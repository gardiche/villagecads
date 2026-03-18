import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, sessionId, assistantMessage, guestEmail, guestName } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id || null;
    }

    // Sauvegarder le message de l'assistant
    await supabase.from("support_messages").insert({
      user_id: userId,
      guest_email: guestEmail,
      guest_name: guestName,
      conversation_id: conversationId,
      session_id: sessionId,
      role: "assistant",
      message: assistantMessage,
    });

    // Récupérer toute la conversation pour l'email
    const { data: conversation } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    // Si c'est le premier message, envoyer une notification email
    const userMessages = conversation?.filter(m => m.role === "user") || [];
    if (userMessages.length === 1) {
      const senderInfo = userId 
        ? `Utilisateur connecté (ID: ${userId})`
        : `Visiteur: ${guestName || "Anonyme"} (${guestEmail || "Email non fourni"})`;

      const conversationHtml = conversation
        ?.map(msg => `
          <div style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#f0f0f0' : '#e3f2fd'}; border-radius: 5px;">
            <strong>${msg.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant'}:</strong>
            <p style="white-space: pre-wrap; margin: 5px 0;">${msg.message}</p>
            <small style="color: #666;">${new Date(msg.created_at).toLocaleString('fr-FR')}</small>
          </div>
        `)
        .join('') || '';

      await resend.emails.send({
        from: "Astryd Support <onboarding@resend.dev>",
        to: ["tbo@alpact.vc"],
        subject: `[Astryd Support] Nouvelle conversation ${userId ? "utilisateur" : "visiteur"}`,
        html: `
          <h2>Nouvelle conversation de support</h2>
          <p><strong>De:</strong> ${senderInfo}</p>
          <p><strong>Session ID:</strong> ${sessionId}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
          <hr>
          <h3>Conversation:</h3>
          ${conversationHtml}
          <hr>
          <p><small>Cette notification est envoyée au premier message de la conversation.</small></p>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("save-support-conversation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});