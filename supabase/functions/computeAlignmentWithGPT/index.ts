import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { idea, answers, uploadedDocuments, journalEntries, microCommitments } = await req.json();
    console.log('Computing alignment with GPT for idea:', idea?.title);

    const systemPrompt = `Tu es Astryd, coach IA centré sur la POSTURE entrepreneuriale personnelle (pas business). 
Analyse l'alignement entre la PERSONNE et son idée sur 6 dimensions : énergie, temps, finances perso, soutien social, compétences, motivation.

INTERDICTIONS : Jamais de conseil business/marché/GTM. Pas de scores/chiffres/termes techniques (Big Five, RIASEC, Schwartz) dans les textes. Vouvoiement strict ("vous").

ZONES D'ATTENTION = CONSTATS PURS (fatigue, isolement, peur). Jamais d'actions (pas "Identifiez...", "Bloquez...").
MICRO-ACTIONS = ACTIONS CONCRÈTES <20min (organiser temps, clarifier motivations, parler à proches).

Si finances > 70, NE JAMAIS mentionner "contraintes financières".

Réponds en JSON : score_alignement (moyenne des 6), scores_detail (chacun 10-100, tous différents), explications_jauges (15-25 mots simples chacune), zones_attention (3-7, constats purs), micro_engagements (6-10, actions concrètes), journal_questions (3), recommandation_finale (keep/adjust/pause).`;

    const userPrompt = `Profil :
- Sphères vie : ${JSON.stringify(answers?.spheres || {})}
- Motivations : ${JSON.stringify(answers?.motivations || {})}
- Environnement : ${JSON.stringify(answers?.environment || {})}
- Big5 : ${JSON.stringify(answers?.big5 || {})}
- RIASEC : ${JSON.stringify(answers?.riasec || {})}
- CV : ${uploadedDocuments?.analysis || 'Non renseigné'}

Idée : ${idea?.title || 'Sans titre'}
Description : ${idea?.description || 'Non renseignée'}
Pitch : ${idea?.pitch || 'Non renseigné'}

Journal : ${JSON.stringify(journalEntries || [])}
Actions réalisées : ${JSON.stringify(microCommitments?.completed || [])}

Analyse l'alignement idée ⇄ personne et génère le JSON complet.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes le moteur de coaching entrepreneurial d\'Astryd. Vous analysez l\'alignement PERSONNE-IDÉE (pas le business). VOUVOIEMENT OBLIGATOIRE ABSOLU : utilisez TOUJOURS "vous", "votre", "vos" dans TOUS les textes générés (zones d\'attention, micro-actions, questions journal). INTERDICTION ABSOLUE du tutoiement ("tu", "ton", "ta", "tes"). Vous êtes un coach centré sur la posture entrepreneuriale : énergie, temps, finances personnelles, soutien, compétences, motivation. Vous ne parlez JAMAIS de marché, concurrence, GTM, persona, business model, clients, publicité, offre, pricing. Le projet est un CONTEXTE, pas une cible d\'analyse business. Vous produisez des diagnostics ULTRA-personnalisés basés sur Schwartz, Big Five, RIASEC, sphères de vie, contexte réel. Chacun des 6 scores dimensionnels DOIT être différent et basé sur une analyse spécifique. Vous générez 6-10 micro-actions PERSONNELLES (pas business), 3 questions de journal HYPER-personnalisées, et une recommandation argumentée centrée sur la posture.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    console.log('Alignment computed successfully:', result.score_alignement);
    console.log('Scores detail from GPT:', result.scores_detail);

    // CRITICAL: Validate that all 6 dimensional scores are present and DIFFERENT
    if (!result.scores_detail || typeof result.scores_detail !== 'object') {
      console.error('CRITICAL ERROR: scores_detail is missing from GPT response');
      console.error('Full GPT result:', JSON.stringify(result, null, 2));
      throw new Error('GPT did not generate dimensional scores');
    }

    const scores = result.scores_detail;
    const requiredDimensions = ['energie', 'temps', 'finances', 'soutien', 'competences', 'motivation'];
    const missingDimensions = requiredDimensions.filter(d => scores[d] === undefined || scores[d] === null);
    
    if (missingDimensions.length > 0) {
      console.error('CRITICAL ERROR: Missing dimensional scores:', missingDimensions);
      console.error('Received scores_detail:', JSON.stringify(scores, null, 2));
      throw new Error(`GPT did not generate scores for: ${missingDimensions.join(', ')}`);
    }

    // CRITICAL: Check if any score is 0 (which would be wrong)
    const zeroScores = requiredDimensions.filter(d => scores[d] === 0);
    if (zeroScores.length > 0) {
      console.error('CRITICAL ERROR: Some scores are 0:', zeroScores);
      console.error('Received scores_detail:', JSON.stringify(scores, null, 2));
      throw new Error(`GPT generated invalid 0 scores for: ${zeroScores.join(', ')}. All scores must be between 10-100.`);
    }

    // Check if all scores are the same (which would be wrong)
    const uniqueScores = new Set(Object.values(scores));
    if (uniqueScores.size === 1) {
      console.warn('WARNING: All dimensional scores are identical, GPT may not have analyzed properly');
      console.warn('Scores:', JSON.stringify(scores, null, 2));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in computeAlignmentWithGPT:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to compute alignment with GPT'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
