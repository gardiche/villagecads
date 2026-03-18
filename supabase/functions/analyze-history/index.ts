import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ideaId,
      alignmentHistory,
      gaugeHistory,
      attentionHistory,
      commitmentHistory,
      journalEntries,
      daysLimit
    } = await req.json();

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer l'idée actuelle
    const { data: idea } = await supabase
      .from("ideas")
      .select("title, description")
      .eq("id", ideaId)
      .single();

    // Récupérer le profil utilisateur (assessment)
    const { data: assessment } = await supabase
      .from("user_assessments")
      .select(`
        *,
        schwartz_values (*),
        big_five_traits (*),
        riasec_scores (*),
        life_spheres (*),
        user_context (*),
        user_learning_profiles (cv_insights)
      `)
      .eq("chosen_project_id", ideaId)
      .single();

    const systemPrompt = `Tu es ASTRYD, un coach IA centré sur l'entrepreneur et sa posture personnelle.

RÔLE CRITIQUE : Tu analyses l'HISTORIQUE de progression de l'utilisateur pour :
1. Résumer les périodes clés (ex : "Semaine du 14-21 : regain d'énergie, 2 zones levées, +12 pts")
2. Détecter les patterns récurrents (ex : "doutes répétés sur compétences → besoin de validation")
3. Suggérer un insight majeur par semaine
4. Proposer 2 micro-engagements ciblés

RÈGLES ABSOLUES :
- Tu ne génères JAMAIS de plan GTM ou d'exécution marché → renvoie vers Mona Lysa
- Ton rôle = clarifier la POSTURE, pas exécuter
- Ton ton = coach bienveillant, factuel, centré personne
- Tu détectes les tendances : progression, plateau, risque

ENTRÉES FOURNIES :
- Historique complet (alignement, jauges, zones d'attention, micro-engagements, journal)
- Pitch actuel de l'idée
- Profil entrepreneurial (Schwartz, Big Five, RIASEC, sphères de vie, contexte)

SORTIE ATTENDUE (JSON STRICT) :
{
  "summary": "Résumé court type coaching (2-3 phrases max)",
  "majorInsight": "L'insight principal détecté dans l'historique",
  "trend": "progression" | "plateau" | "risque",
  "suggestedCommitments": ["Action 1", "Action 2"]
}

Limite de temps analysée : ${daysLimit ? `${daysLimit} derniers jours` : "historique complet"}`;

    const userPrompt = `Analyse cet historique et génère un insight personnalisé :

IDÉE ACTUELLE :
${idea?.title || "Non renseignée"}
${idea?.description || ""}

PROFIL ENTREPRENEUR (résumé) :
- Valeurs prioritaires : ${JSON.stringify(assessment?.schwartz_values || {})}
- Sphères de vie : ${JSON.stringify(assessment?.life_spheres || {})}
- Contexte : ${JSON.stringify(assessment?.user_context || {})}

HISTORIQUE :

SCORES D'ALIGNEMENT (${alignmentHistory.length} changements) :
${JSON.stringify(alignmentHistory.slice(0, 10))}

JAUGES (${gaugeHistory.length} évolutions) :
${JSON.stringify(gaugeHistory.slice(0, 15))}

ZONES D'ATTENTION (${attentionHistory.length} événements) :
${JSON.stringify(attentionHistory.slice(0, 10))}

MICRO-ENGAGEMENTS (${commitmentHistory.length} actions) :
${JSON.stringify(commitmentHistory.slice(0, 10))}

JOURNAL (${journalEntries.length} entrées) :
${JSON.stringify(journalEntries.slice(0, 5))}

Génère maintenant ton analyse sous forme JSON.`;

    console.log("Calling OpenAI for history analysis...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("OpenAI response received");

    let parsedInsight;
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedInsight = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      // Fallback avec structure minimale
      parsedInsight = {
        summary: "Analyse en cours de génération...",
        majorInsight: content.substring(0, 200),
        trend: "plateau",
        suggestedCommitments: []
      };
    }

    return new Response(JSON.stringify(parsedInsight), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in analyze-history function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
