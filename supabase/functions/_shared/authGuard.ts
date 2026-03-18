import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

/**
 * Extract and verify the authenticated user from the request JWT.
 * Returns the user object or null if not authenticated.
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return user;
}

/**
 * Verify that the userId from the request body matches the authenticated user.
 * Returns a 403 Response if mismatch, or null if OK.
 */
export function verifyOwnership(
  authenticatedUserId: string,
  requestedUserId: string,
  corsHeaders: Record<string, string>
): Response | null {
  if (authenticatedUserId !== requestedUserId) {
    console.warn(`🚫 Ownership mismatch: JWT=${authenticatedUserId}, body=${requestedUserId}`);
    return new Response(
      JSON.stringify({ error: "Forbidden: user mismatch" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  return null;
}

/**
 * Verify that a resource belongs to the authenticated user.
 * Returns a 403 Response if the resource's user_id doesn't match, or null if OK.
 */
export function verifyResourceOwnership(
  authenticatedUserId: string,
  resourceUserId: string,
  resourceType: string,
  corsHeaders: Record<string, string>
): Response | null {
  if (authenticatedUserId !== resourceUserId) {
    console.warn(`🚫 ${resourceType} ownership mismatch: JWT=${authenticatedUserId}, resource=${resourceUserId}`);
    return new Response(
      JSON.stringify({ error: `Forbidden: ${resourceType} does not belong to you` }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  return null;
}

/**
 * Create a standard 401 response.
 */
export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
