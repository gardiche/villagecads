import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { personaData } = await req.json();

    if (!personaData) {
      throw new Error('personaData is required');
    }

    // 🔒 SECURITY: Générer un code unique cryptographiquement sécurisé
    // crypto.randomUUID() génère 128 bits d'entropie (vs ~41 bits avec Math.random)
    const uuid = crypto.randomUUID();
    // Prendre les 12 premiers caractères pour un code lisible mais sécurisé
    const code = uuid.replace(/-/g, '').substring(0, 12).toUpperCase();

    // Expiration dans 24h
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Sauvegarder les résultats temporaires
    const { data, error } = await supabase
      .from('guest_results_temp')
      .insert({
        code,
        persona_data: personaData,
        expires_at: expiresAt.toISOString(),
        retrieved: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving guest results:', error);
      throw error;
    }

    console.log('Guest results saved with secure code:', code);

    return new Response(
      JSON.stringify({ 
        success: true, 
        code,
        expiresAt: expiresAt.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in save-guest-results:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
