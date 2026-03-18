import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

// Input validation constants
const MAX_INPUT_LENGTH = 2000;
const MIN_INPUT_LENGTH = 5;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 10 requests per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = await checkRateLimit(clientId, "reformulate-objective", 10, 1);
  if (!isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${clientId}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const body = await req.json();
    const { userInput } = body;

    // Input validation
    if (!userInput || typeof userInput !== "string") {
      return new Response(
        JSON.stringify({ error: "userInput requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input length
    const trimmedInput = userInput.trim();
    if (trimmedInput.length < MIN_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `userInput doit contenir au moins ${MIN_INPUT_LENGTH} caractères` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `userInput ne doit pas dépasser ${MAX_INPUT_LENGTH} caractères` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const systemPrompt = `Tu es un coach entrepreneurial expert. Transforme le texte brouillon de l'utilisateur en un Objectif Prioritaire clair, actionnable sur 2-4 semaines.

RÈGLES ABSOLUES :
- Garde 100% de l'intention de l'utilisateur
- Ne change JAMAIS le fond, seulement la forme
- Rends la forme pro et dynamique
- Maximum 15-25 mots (2-3 phrases courtes)
- Ton coach bienveillant mais factuel
- Centré sur la POSTURE entrepreneuriale et l'équilibre personnel
- NE JAMAIS parler de marché, business, concurrence
- Objectif doit définir CE QUE l'entrepreneur doit atteindre (pas comment)

IMPORTANT : Si l'utilisateur dit "je veux travailler mon énergie", vous DEVEZ garder "énergie" dans la reformulation. Si il dit "clarifier mon idée", vous DEVEZ garder "clarifier". Respectez son vocabulaire et ses priorités.

Retournez UNIQUEMENT le texte reformulé, sans introduction ni explication.`;

    const userPrompt = `Texte brouillon de l'utilisateur : "${trimmedInput}"

Reformule ce texte en Objectif Prioritaire clair et motivant, en gardant 100% de son intention originale.`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    // 🚨 POST-TRAITEMENT VOUVOIEMENT : Garantir "Zéro Tu"
    const reformulatedObjective = enforceVouvoiement(data.choices[0].message.content.trim());

    return new Response(
      JSON.stringify({ reformulatedObjective }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in reformulate-objective:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
