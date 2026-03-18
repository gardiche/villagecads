import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Démarrage de la migration tutoiement → vouvoiement...');

    // Récupérer toutes les zones d'attention
    const { data: attentionZones, error: attentionError } = await supabase
      .from('attention_zones')
      .select('*');

    if (attentionError) {
      throw new Error(`Erreur récupération zones d'attention: ${attentionError.message}`);
    }

    // Récupérer toutes les micro-actions
    const { data: microActions, error: microError } = await supabase
      .from('micro_commitments')
      .select('*');

    if (microError) {
      throw new Error(`Erreur récupération micro-actions: ${microError.message}`);
    }

    console.log(`📊 Zones d'attention à traiter: ${attentionZones?.length || 0}`);
    console.log(`📊 Micro-actions à traiter: ${microActions?.length || 0}`);

    let updatedZones = 0;
    let updatedActions = 0;

    // Fonction pour transformer un texte du tutoiement au vouvoiement
    async function transformToVouvoiement(text: string): Promise<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert en langue française. Transforme le texte suivant du TUTOIEMENT vers le VOUVOIEMENT de manière naturelle et fluide.

RÈGLES STRICTES :
- Remplace TOUS les "tu" par "vous"
- Remplace "ton/ta/tes" par "votre/vos"
- Ajuste les verbes à la 2e personne du pluriel
- Garde exactement le même sens et la même structure
- Ne modifie RIEN d'autre que le passage du tutoiement au vouvoiement
- Retourne UNIQUEMENT le texte transformé, sans commentaire

Exemples :
- "Tu dois travailler ta motivation" → "Vous devez travailler votre motivation"
- "Ta charge mentale est élevée" → "Votre charge mentale est élevée"
- "Tes compétences sont limitées" → "Vos compétences sont limitées"`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    }

    // Migrer les zones d'attention
    if (attentionZones && attentionZones.length > 0) {
      for (const zone of attentionZones) {
        try {
          const newLabel = await transformToVouvoiement(zone.label);
          const newRecommendation = zone.recommendation 
            ? await transformToVouvoiement(zone.recommendation)
            : null;

          const { error: updateError } = await supabase
            .from('attention_zones')
            .update({
              label: newLabel,
              recommendation: newRecommendation
            })
            .eq('id', zone.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour zone ${zone.id}:`, updateError);
          } else {
            updatedZones++;
            console.log(`✅ Zone d'attention mise à jour: ${zone.id}`);
          }
        } catch (error) {
          console.error(`❌ Erreur transformation zone ${zone.id}:`, error);
        }
      }
    }

    // Migrer les micro-actions
    if (microActions && microActions.length > 0) {
      for (const action of microActions) {
        try {
          const newText = await transformToVouvoiement(action.text);
          const newObjectif = action.objectif 
            ? await transformToVouvoiement(action.objectif)
            : null;
          const newImpactAttendu = action.impact_attendu 
            ? await transformToVouvoiement(action.impact_attendu)
            : null;

          const { error: updateError } = await supabase
            .from('micro_commitments')
            .update({
              text: newText,
              objectif: newObjectif,
              impact_attendu: newImpactAttendu
            })
            .eq('id', action.id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour action ${action.id}:`, updateError);
          } else {
            updatedActions++;
            console.log(`✅ Micro-action mise à jour: ${action.id}`);
          }
        } catch (error) {
          console.error(`❌ Erreur transformation action ${action.id}:`, error);
        }
      }
    }

    console.log(`✅ Migration terminée: ${updatedZones} zones, ${updatedActions} actions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration terminée avec succès',
        stats: {
          zonesUpdated: updatedZones,
          actionsUpdated: updatedActions,
          totalZones: attentionZones?.length || 0,
          totalActions: microActions?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
