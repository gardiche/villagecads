import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Check rate limit for a given identifier and function name
 * Returns true if under limit, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  functionName: string,
  maxRequests: number = 10,
  windowMinutes: number = 1
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_function_name: functionName,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    });

    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow request if rate limiting fails
      return true;
    }

    return data === true;
  } catch (err) {
    console.error("Rate limit exception:", err);
    // Fail open
    return true;
  }
}

/**
 * Get client identifier from request.
 * 🔒 SÉCU 10: Uses userId from JWT if authenticated (unforgeable),
 * falls back to IP + header fingerprint for guests.
 */
export function getClientIdentifier(req: Request, authenticatedUserId?: string): string {
  // If authenticated, use the userId — infalsifiable
  if (authenticatedUserId) {
    return `user_${authenticatedUserId}`;
  }

  // For guests: combine IP with header fingerprint
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor 
    ? forwardedFor.split(",")[0].trim() 
    : req.headers.get("x-real-ip") || "unknown-ip";

  const ua = req.headers.get("user-agent") || "unknown";
  const lang = req.headers.get("accept-language") || "unknown";
  const accept = req.headers.get("accept-encoding") || "unknown";
  
  // Combine IP + fingerprint for harder spoofing
  return `guest_${ip}_${hashString(ua + lang + accept)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
