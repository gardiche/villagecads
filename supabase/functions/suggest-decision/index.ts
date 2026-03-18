import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, maturityScore } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Récupérer les zones d'attention
    const { data: attentionZones, error: zonesError } = await supabaseClient
      .from('attention_zones')
      .select('*')
      .eq('idea_id', ideaId);

    if (zonesError) throw zonesError;

    // Récupérer l'idée
    const { data: idea } = await supabaseClient
      .from('ideas')
      .select('title, description')
      .eq('id', ideaId)
      .single();

    // Récupérer les micro-actions
    const { data: microActions } = await supabaseClient
      .from('micro_commitments')
      .select('status')
      .eq('idea_id', ideaId);

    const completedActions = microActions?.filter(m => m.status === 'done').length || 0;
    const totalActions = microActions?.length || 0;

    // Calculer les statistiques des zones d'attention
    const criticalZones = attentionZones?.filter(z => z.severity >= 8).length || 0;
    const moderateZones = attentionZones?.filter(z => z.severity >= 5 && z.severity < 8).length || 0;
    const totalZones = attentionZones?.length || 0;

    // Préparer le contexte pour l'IA
    const context = {
      ideaTitle: idea?.title || "Idée sans titre",
      ideaDescription: idea?.description || "Pas de description",
      maturityScore,
      totalZones,
      criticalZones,
      moderateZones,
      completedActions,
      totalActions,
      attentionZones: attentionZones?.map(z => ({
        label: z.label,
        severity: z.severity,
        recommendation: z.recommendation
      }))
    };

    const systemPrompt = `Tu es Astryd, un coach IA qui aide les entrepreneurs à prendre des décisions éclairées sur leurs projets.

🎯 MODE ASSISTIF (COPILOTE) - PRIORITÉ ABSOLUE :
Tu es un PAIR BIENVEILLANT et LUCIDE, PAS un commandant.
- TOUJOURS formuler comme une PROPOSITION ou une RÉFLEXION, jamais comme un ordre.
- Le rationale doit être en mode conseil bienveillant, pas en affirmation catégorique.
- Utilise le vouvoiement strict.

Ton rôle est d'analyser le contexte du projet et de SUGGÉRER UNE orientation parmi: GO, KEEP, PIVOT ou STOP.

Critères de décision:
- GO (75-100): Score élevé, peu de zones d'attention critiques, actions bien avancées
- KEEP (50-74): Score moyen-bon, quelques zones d'attention, progression régulière
- PIVOT (30-49): Score moyen-faible, plusieurs zones critiques, besoin d'ajustements
- STOP (<30): Score faible, nombreuses zones critiques, besoin de pause

🚫 INTERDICTIONS FORMELLES DANS LE RATIONALE :
- NE JAMAIS utiliser l'impératif seul ("Lancez-vous", "Prenez une pause")
- NE JAMAIS être catégorique ("Vous êtes prêt", "C'est le moment")
- TOUJOURS formuler comme une suggestion : "Il semble que...", "Votre score suggère que...", "Qu'en pensez-vous ?"

Exemples de formulation autorisée :
- ✅ "Votre score de maturité est encourageant. Une prochaine étape pourrait être de valider cette dynamique — qu'en pensez-vous ?"
- ✅ "Les indicateurs suggèrent qu'un temps de recul pourrait vous être bénéfique. Est-ce que cela vous parle ?"
- ❌ "Vous êtes prêt·e à passer à l'action !" (trop directif)
- ❌ "Prenez une pause" (impératif)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RÈGLES ANTI-DÉCROCHAGE V10 (PRIORITÉ HAUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ RÈGLE #4 - MIROIR FACTUEL :
Si le contexte contient des FAITS PRÉCIS (montants, noms, durées, dates, scores) :
→ Les RÉUTILISER TELS QUELS dans le rationale. Ne JAMAIS conceptualiser.
❌ INTERDIT : "des indicateurs encourageants" ou "quelques zones critiques"
✅ OBLIGATOIRE : "un score de 72/100" et "2 zones critiques sur 5"
Les chiffres du contexte DOIVENT apparaître dans le rationale.

⚠️ RÈGLE #5 - ANTI-MÉTA :
Sur les sujets opérationnels (argent, contrats, tréso, zones d'attention critiques) :
→ INTERDICTION de poser des questions sur "la perception" ou "le sentiment"
→ Poser des questions de VIABILITÉ / FAISABILITÉ :
  ❌ "Comment percevez-vous cette dynamique ?"
  ✅ "Est-ce que ces 2 zones critiques sont traitables à court terme ?"

⚠️ STRUCTURE DE RÉPONSE :
1️⃣ CONSTAT FACTUEL (avec les chiffres du contexte)
2️⃣ SUGGESTION (mode proposition, pas d'impératif)
3️⃣ QUESTION FERMÉE (sortie concrète, viabilité)

Réponds UNIQUEMENT avec un JSON valide contenant:
{
  "decision": "GO" | "KEEP" | "PIVOT" | "STOP",
  "rationale": "suggestion bienveillante avec les CHIFFRES du contexte (max 2 phrases, vouvoiement, pas d'impératif, question fermée de viabilité)",
  "confidence": nombre entre 0 et 100
}`;
    // 🔒 SÉCU 7: Sanitize user-provided content
    const userPrompt = `Contexte du projet:
- Titre: ${sanitizeForPrompt(context.ideaTitle, 200)}
- Score de maturité: ${context.maturityScore}/100
- Zones d'attention: ${context.totalZones} total (${context.criticalZones} critiques, ${context.moderateZones} modérées)
- Actions complétées: ${context.completedActions}/${context.totalActions}

Zones d'attention principales:
${context.attentionZones?.slice(0, 3).map(z => `- ${z.label} (sévérité: ${z.severity}/10)`).join('\n') || 'Aucune'}

Analyse ce projet et recommande une décision.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurée");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices[0].message.content;
    
    // Nettoyer les backticks markdown si présents
    if (content.includes('```')) {
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    }
    
    // Parser la réponse JSON
    let suggestion;
    try {
      suggestion = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Fallback basé sur le score uniquement
      if (maturityScore >= 75) {
        suggestion = { decision: "GO", rationale: `Votre score de ${maturityScore}/100 est encourageant. Une prochaine étape pourrait être de valider cette dynamique — qu'en pensez-vous ?`, confidence: 80 };
      } else if (maturityScore >= 50) {
        suggestion = { decision: "KEEP", rationale: `Avec un score de ${maturityScore}/100, votre projet progresse. Continuer à consolider cette base pourrait être une bonne option.`, confidence: 70 };
      } else if (maturityScore >= 30) {
        suggestion = { decision: "PIVOT", rationale: `Votre score de ${maturityScore}/100 suggère que certains ajustements pourraient améliorer votre alignement. Avez-vous identifié des pistes concrètes ?`, confidence: 65 };
      } else {
        suggestion = { decision: "STOP", rationale: `Avec un score de ${maturityScore}/100, un temps de recul pourrait vous être bénéfique. Est-ce que cette pause vous permettrait de mieux structurer votre approche ?`, confidence: 60 };
      }
    }

    // Sauvegarder la suggestion comme décision automatique
    const { error: insertError } = await supabaseClient
      .from('decisions')
      .insert({
        user_id: user.id,
        idea_id: ideaId,
        state: suggestion.decision,
        rationale: `[Suggestion Astryd] ${suggestion.rationale}`,
      });

    if (insertError) {
      console.error("Error saving suggestion:", insertError);
      // Ne pas bloquer si la sauvegarde échoue
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestion 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in suggest-decision function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
