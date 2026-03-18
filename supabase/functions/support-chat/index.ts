import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 20 messages per minute per IP (more generous for chat)
  const clientId = getClientIdentifier(req);
  const isAllowed = await checkRateLimit(clientId, "support-chat", 20, 1);
  if (!isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${clientId}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const { messages, conversationId, sessionId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // System prompt pour le support Astryd
    const systemPrompt = `Tu es l'assistant support d'Astryd, un coach IA entrepreneurial qui aide les entrepreneurs à renforcer leur posture personnelle et vérifier l'alignement avec leur idée de projet.

Ton rôle :
- Répondre aux questions sur Astryd et son fonctionnement
- Aider les utilisateurs à naviguer dans l'application
- Collecter les retours et suggestions
- Être bienveillant, professionnel et efficace
- Répondre de manière concise (2-3 phrases maximum par réponse)

Ne jamais :
- Donner de conseils d'investissement ou business directs
- Prétendre être un humain
- Promettre des fonctionnalités qui n'existent pas

Si la demande nécessite une intervention humaine (bug complexe, demande de fonctionnalité spécifique, question sur la facturation), indique clairement que l'équipe sera notifiée et prendra contact rapidement.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sauvegarder le message utilisateur
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      const authHeader = req.headers.get("Authorization");
      let userId: string | null = null;
      
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );
        userId = user?.id || null;
      }

      await supabase.from("support_messages").insert({
        user_id: userId,
        conversation_id: conversationId,
        session_id: sessionId,
        role: "user",
        message: userMessage.content,
        user_context: {
          currentPage: userMessage.metadata?.currentPage || "/",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: any) {
    console.error("support-chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});