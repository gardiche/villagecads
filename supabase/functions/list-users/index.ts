import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 5 calls per minute per admin
    const isAllowed = await checkRateLimit(user.id, "list-users", 5, 1);
    if (!isAllowed) {
      return rateLimitResponse(corsHeaders);
    }

    // Parse pagination params
    let body: any = {};
    try {
      body = await req.json();
    } catch { /* empty body is ok */ }
    
    const page = Math.max(1, Number(body.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(body.limit) || 50));

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Filter out current admin
    const filteredUsers = users.filter((u) => u.id !== user.id);

    // Sort by most recent signup
    filteredUsers.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Paginate
    const totalCount = filteredUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

    // Enrich with minimal data
    const enrichedUsers = await Promise.all(
      paginatedUsers.map(async (u) => {
        const { data: assessment } = await supabaseAdmin
          .from("user_assessments")
          .select("completed")
          .eq("user_id", u.id)
          .maybeSingle();

        const { data: subscription } = await supabaseAdmin
          .from("user_subscriptions")
          .select("plan")
          .eq("user_id", u.id)
          .eq("status", "active")
          .maybeSingle();

        return {
          id: u.id,
          email: u.email || "Email non renseigné",
          created_at: u.created_at,
          assessment_completed: assessment?.completed || false,
          plan: subscription?.plan || "declic",
        };
      })
    );

    return new Response(JSON.stringify({ 
      users: enrichedUsers,
      pagination: { page, limit, totalCount, totalPages }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in list-users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
