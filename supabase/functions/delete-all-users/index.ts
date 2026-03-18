import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 🔒 SECURITY: Require authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // 🔒 Verify super admin (env variable or fallback)
    const protectedEmail = Deno.env.get('PROTECTED_ADMIN_EMAIL') || 'tbo@alpact.vc';
    if (user.email !== protectedEmail) {
      console.error(`❌ SECURITY: Non-super-admin ${user.email} attempted delete-all-users`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Super admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // 🔒 Require explicit confirmation
    const body = await req.json();
    if (body.confirm !== 'DELETE_ALL_CONFIRMED') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid confirmation. Send { "confirm": "DELETE_ALL_CONFIRMED" }' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('✅ SECURITY: Super admin access verified for', user.email);

    // Get all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let deletedCount = 0;
    const errors: any[] = [];

    for (const u of users) {
      if (u.email === protectedEmail) {
        console.log(`⚠️ Admin ${u.email} preserved`);
        continue;
      }

      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
        if (deleteError) {
          errors.push({ userId: u.id, error: deleteError.message });
        } else {
          deletedCount++;
        }
      } catch (err: any) {
        errors.push({ userId: u.id, error: err.message });
      }
    }

    // Audit log
    await supabaseAdmin.from('access_logs').insert({
      user_id: user.id,
      action: 'delete_all_users',
      target_type: 'system',
      metadata: { deletedCount, totalUsers: users.length, errors: errors.length }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        totalUsers: users.length,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedCount} utilisateur(s) supprimé(s) sur ${users.length}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Global error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
