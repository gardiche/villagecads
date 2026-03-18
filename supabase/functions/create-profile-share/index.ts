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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    const { personaTitre, personaSynthese, personaVisualUrl, forces, verrous } = await req.json();

    if (!personaTitre) {
      throw new Error('personaTitre is required');
    }

    // Générer un code unique de 12 caractères
    const shareCode = Math.random().toString(36).substring(2, 14).toUpperCase();

    // Créer le partage de profil
    const { data, error } = await supabase
      .from('profile_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        persona_titre: personaTitre,
        persona_synthese: personaSynthese || null,
        persona_visual_url: personaVisualUrl || null,
        forces: forces || [],
        verrous: verrous || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile share:', error);
      throw error;
    }

    const shareUrl = `${Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.')}/share/${shareCode}`;

    console.log('Profile share created:', shareCode);

    return new Response(
      JSON.stringify({ 
        success: true, 
        shareCode,
        shareUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in create-profile-share:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});