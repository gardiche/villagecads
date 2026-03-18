import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { zones } = await req.json();
    // zones = [{ label: string, user_id: string }]

    if (!zones || zones.length === 0) {
      return new Response(JSON.stringify({ categories: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a deduplicated list of labels with user counts
    const labelMap: Record<string, Set<string>> = {};
    for (const z of zones) {
      if (!labelMap[z.label]) labelMap[z.label] = new Set();
      labelMap[z.label].add(z.user_id);
    }

    const labelSummary = Object.entries(labelMap)
      .map(([label, users]) => `- "${label}" (${users.size} entrepreneur${users.size > 1 ? 's' : ''})`)
      .join("\n");

    const totalEntrepreneurs = new Set(zones.map((z: any) => z.user_id)).size;

    const systemPrompt = `Tu es un analyste expert en accompagnement entrepreneurial. Tu reçois une liste de zones d'attention individuelles détectées chez des entrepreneurs d'une cohorte.

Ta mission : regrouper ces zones en MACRO-CATÉGORIES pertinentes pour le pilotage d'un programme d'accompagnement.

Les 3 familles de catégories possibles sont :
1. **Entrepreneur** (posture personnelle) : énergie, clarté mentale, humeur, charge mentale, équilibre de vie, motivation, confiance, isolement, soutien social
2. **Projet** (maturité du projet) : stratégie, positionnement, modèle économique, finances du projet, compétences à développer, go-to-market, structuration, vision
3. **Marché** (environnement externe) : validation marché, concurrence, taille de marché, réglementation, timing

Règles :
- Regroupe les libellés similaires même s'ils sont formulés différemment
- Donne un label court et clair pour chaque macro-catégorie (ex: "Charge mentale & énergie", "Fragilité financière personnelle", "Clarté stratégique du projet")
- Chaque macro-catégorie doit indiquer sa famille (entrepreneur/projet/marché)
- Calcule le nombre d'entrepreneurs uniques touchés par la macro-catégorie (union des entrepreneurs de tous les libellés regroupés)
- Trie par nombre d'entrepreneurs touchés décroissant
- Maximum 8 macro-catégories`;

    const userPrompt = `Cohorte de ${totalEntrepreneurs} entrepreneurs.

Zones d'attention individuelles détectées :
${labelSummary}

Analyse et regroupe ces zones en macro-catégories.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_categories",
              description: "Return the macro-categories of blocages",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Short label for the macro-category" },
                        family: { type: "string", enum: ["entrepreneur", "projet", "marche"], description: "Which family this belongs to" },
                        count: { type: "number", description: "Number of unique entrepreneurs affected" },
                        original_labels: { type: "array", items: { type: "string" }, description: "List of original zone labels grouped here" },
                      },
                      required: ["label", "family", "count", "original_labels"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_categories" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      throw new Error("No structured output from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Recalculate counts accurately using our own data (AI might approximate)
    const categories = parsed.categories.map((cat: any) => {
      const affectedUsers = new Set<string>();
      for (const origLabel of cat.original_labels) {
        const users = labelMap[origLabel];
        if (users) {
          users.forEach(u => affectedUsers.add(u));
        }
      }
      return {
        label: cat.label,
        family: cat.family,
        count: affectedUsers.size,
        total: totalEntrepreneurs,
        percentage: Math.round((affectedUsers.size / totalEntrepreneurs) * 100),
      };
    });

    // Sort by count desc
    categories.sort((a: any, b: any) => b.count - a.count);

    return new Response(JSON.stringify({ categories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-blocages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
