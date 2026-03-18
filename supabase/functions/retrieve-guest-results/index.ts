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
    // Rate limit: 5 attempts per hour per IP
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(clientId, "retrieve-guest-results", 5, 60);
    if (!isAllowed) {
      return rateLimitResponse(corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { code } = await req.json();

    if (!code || typeof code !== 'string' || code.length < 6 || code.length > 12) {
      return new Response(
        JSON.stringify({ error: 'Code invalide ou expiré' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Récupérer les résultats avec le code
    const { data, error } = await supabase
      .from('guest_results_temp')
      .select('*')
      .eq('code', code.toUpperCase())
      .gte('expires_at', new Date().toISOString())
      .eq('retrieved', false)
      .single();

    if (error || !data) {
      // Always return same generic error (no difference between non-existent and expired)
      return new Response(
        JSON.stringify({ error: 'Code invalide ou expiré' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Marquer comme récupéré
    await supabase
      .from('guest_results_temp')
      .update({ retrieved: true })
      .eq('id', data.id);

    console.log('Guest results retrieved with code:', code);

    return new Response(
      JSON.stringify({ 
        success: true, 
        personaData: data.persona_data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in retrieve-guest-results:', error);
    return new Response(
      JSON.stringify({ error: 'Code invalide ou expiré' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});