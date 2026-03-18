import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";

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

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { ideaId } = await req.json();
    console.log('🔄 Remplissage des recommandations manquantes pour:', { ideaId, userId: user.id });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Récupérer les zones sans recommandation
    const { data: zonesWithoutReco, error: zonesError } = await supabase
      .from('attention_zones')
      .select('*')
      .eq('user_id', user.id)
      .eq('idea_id', ideaId)
      .eq('archived', false)
      .is('recommendation', null);

    if (zonesError) {
      throw new Error('Failed to fetch zones: ' + zonesError.message);
    }

    if (!zonesWithoutReco || zonesWithoutReco.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Toutes les zones ont déjà des recommandations',
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 ${zonesWithoutReco.length} zones sans recommandation trouvées`);

    // Récupérer le profil et l'idée pour contexte
    const [assessmentRes, ideaRes, lifeSpheres, bigFive, riasec, userContext] = await Promise.all([
      supabase.from('user_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('ideas').select('*').eq('id', ideaId).maybeSingle(),
      supabase.from('life_spheres').select('*').eq('assessment_id', (await supabase.from('user_assessments').select('id').eq('user_id', user.id).limit(1).maybeSingle()).data?.id).maybeSingle(),
      supabase.from('big_five_traits').select('*').eq('assessment_id', (await supabase.from('user_assessments').select('id').eq('user_id', user.id).limit(1).maybeSingle()).data?.id).maybeSingle(),
      supabase.from('riasec_scores').select('*').eq('assessment_id', (await supabase.from('user_assessments').select('id').eq('user_id', user.id).limit(1).maybeSingle()).data?.id).maybeSingle(),
      supabase.from('user_context').select('*').eq('assessment_id', (await supabase.from('user_assessments').select('id').eq('user_id', user.id).limit(1).maybeSingle()).data?.id).maybeSingle()
    ]);

    const idea = ideaRes.data;

    // Générer les recommandations via IA
    const prompt = `
Tu es un coach entrepreneurial expert. Génère des recommandations personnalisées pour chaque zone d'attention.

CONTEXTE UTILISATEUR:
- Idée projet: ${idea?.title || 'Non renseignée'} - ${idea?.description || ''}
- Sphères de vie: ${JSON.stringify(lifeSpheres.data || {})}
- Big Five: ${JSON.stringify(bigFive.data || {})}
- RIASEC: ${JSON.stringify(riasec.data || {})}
- Contexte: ${JSON.stringify(userContext.data || {})}

ZONES D'ATTENTION À ENRICHIR:
${zonesWithoutReco.map((z, i) => `${i + 1}. "${z.label}" (severity: ${z.severity})`).join('\n')}

INSTRUCTIONS:
- Pour CHAQUE zone, génère une recommandation personnalisée de 2-3 phrases
- La recommandation doit être un CONSTAT (pas une action)
- Explique POURQUOI cette zone est critique pour CETTE personne avec CETTE idée
- Utilise le vouvoiement
- Sois direct et factuel, pas de flatterie

FORMAT JSON STRICT:
{
  "recommendations": [
    {
      "zone_id": "uuid de la zone",
      "recommendation": "Texte de la recommandation personnalisée"
    }
  ]
}
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un coach entrepreneurial. Génère UNIQUEMENT du JSON valide.' },
          { role: 'user', content: prompt + '\n\nZONES IDs:\n' + zonesWithoutReco.map(z => `- ${z.id}: "${z.label}"`).join('\n') }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('✅ Recommandations IA reçues');

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON from AI');
    }

    // Mettre à jour les zones avec leurs nouvelles recommandations
    let updatedCount = 0;
    for (const reco of parsedResult.recommendations || []) {
      // 🚨 POST-TRAITEMENT VOUVOIEMENT : Garantir "Zéro Tu"
      const { error: updateError } = await supabase
        .from('attention_zones')
        .update({ recommendation: enforceVouvoiement(reco.recommendation) })
        .eq('id', reco.zone_id)
        .eq('user_id', user.id);

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Zone ${reco.zone_id} mise à jour`);
      } else {
        console.error(`❌ Erreur mise à jour zone ${reco.zone_id}:`, updateError);
      }
    }

    console.log(`✅ ${updatedCount}/${zonesWithoutReco.length} zones mises à jour avec recommandations`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: zonesWithoutReco.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fill-missing-recommendations:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
