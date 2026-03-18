import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ideaId } = await req.json();

    // Récupérer les données du profil
    const { data: assessment } = await supabaseClient
      .from('user_assessments')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: schwartz } = await supabaseClient
      .from('schwartz_values')
      .select('*')
      .eq('assessment_id', assessment?.id)
      .single();

    const { data: bigFive } = await supabaseClient
      .from('big_five_traits')
      .select('*')
      .eq('assessment_id', assessment?.id)
      .single();

    const { data: riasec } = await supabaseClient
      .from('riasec_scores')
      .select('*')
      .eq('assessment_id', assessment?.id)
      .single();

    const { data: lifeSpheres } = await supabaseClient
      .from('life_spheres')
      .select('*')
      .eq('assessment_id', assessment?.id)
      .single();

    const { data: context } = await supabaseClient
      .from('user_context')
      .select('*')
      .eq('assessment_id', assessment?.id)
      .single();

    // Récupérer l'idée
    const { data: idea } = await supabaseClient
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single();

    // Récupérer les micro-actions complétées
    const { data: completedActions } = await supabaseClient
      .from('micro_commitments')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('status', 'done');

    // Récupérer les dernières entrées journal
    const { data: journalEntries } = await supabaseClient
      .from('journal_entries')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('sender', 'user')
      .order('created_at', { ascending: false })
      .limit(10);

    // Récupérer les zones d'attention actuelles
    const { data: attentionZones } = await supabaseClient
      .from('attention_zones')
      .select('*')
      .eq('idea_id', ideaId);

    // Appeler OpenAI pour générer l'objectif personnalisé
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    const systemPrompt = `Tu es un coach entrepreneurial expert qui accompagne des entrepreneurs dans leur cheminement personnel.
Ta mission est de générer UN OBJECTIF CLAIR ET PERSONNALISÉ pour l'entrepreneur, basé sur son profil complet et ses interactions.

IMPORTANT : 
- L'objectif doit être COURT (2-3 phrases maximum)
- Il doit définir CE QUE L'ENTREPRENEUR DOIT ATTEINDRE, pas comment y arriver
- Il doit être PERSONNALISÉ selon son profil, ses zones d'attention, ses micro-actions accomplies, et ses échanges dans le journal
- Il doit évoluer en fonction de sa progression (si beaucoup d'actions accomplies, l'objectif doit refléter une étape plus avancée)
- Ton langage doit être celui d'un coach bienveillant mais factuel, centré personne
- NE PARLE JAMAIS de marché, de business, de concurrence - tu te concentres sur la POSTURE ENTREPRENEURIALE et l'équilibre personnel

L'objectif doit aider l'entrepreneur à comprendre VERS QUOI il chemine : renforcer sa posture, lever ses freins internes, construire un équilibre durable.`;

    const userPrompt = `Voici les données de l'entrepreneur :

PROFIL PSYCHOLOGIQUE :
- Valeurs Schwartz : ${JSON.stringify(schwartz)}
- Big Five : ${JSON.stringify(bigFive)}
- RIASEC : ${JSON.stringify(riasec)}

ÉQUILIBRE DE VIE :
- Sphères de vie : ${JSON.stringify(lifeSpheres)}
- Contexte : ${JSON.stringify(context)}

IDÉE DE PROJET :
${idea ? `Titre: ${idea.title}\nDescription: ${idea.description}` : "Aucune idée renseignée"}

ZONES D'ATTENTION ACTUELLES :
${attentionZones && attentionZones.length > 0 
  ? attentionZones.map(z => `- ${z.label} (gravité: ${z.severity}/3)`).join('\n')
  : "Aucune zone d'attention"}

MICRO-ACTIONS ACCOMPLIES : ${completedActions?.length || 0}

DERNIERS ÉCHANGES JOURNAL :
${journalEntries && journalEntries.length > 0
  ? journalEntries.slice(0, 3).map(e => `- "${e.content}"`).join('\n')
  : "Aucun échange"}

Génère un objectif personnalisé (2-3 phrases) qui définit CE QUE cet entrepreneur doit atteindre pour progresser vers une posture entrepreneuriale solide et équilibrée. L'objectif doit être adapté à sa situation actuelle et à sa progression.

Retourne UNIQUEMENT le texte de l'objectif, sans introduction ni conclusion.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const objective = openaiData.choices[0].message.content.trim();

    return new Response(JSON.stringify({ objective }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-objective:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
