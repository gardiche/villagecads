import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { escapeHtml } from "../_shared/sanitize.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

interface SupportMessageRequest {
  message: string;
  guestEmail?: string;
  guestName?: string;
  userContext?: any;
  conversationId?: string;
  sessionId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header if present
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id || null;
    }

    const { message, guestEmail, guestName, userContext, conversationId, sessionId }: SupportMessageRequest = await req.json();

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le message ne peut pas être vide" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save message to database with conversation grouping
    const { data: savedMessage, error: dbError } = await supabase
      .from("support_messages")
      .insert({
        user_id: userId,
        guest_email: guestEmail,
        guest_name: guestName,
        conversation_id: conversationId || crypto.randomUUID(),
        session_id: sessionId,
        message: message,
        user_context: userContext || {},
        role: "user",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error saving message to database:", dbError);
      throw new Error("Erreur lors de l'enregistrement du message");
    }

    // Send email notification
    const senderInfo = userId 
      ? `Utilisateur connecté (ID: ${userId})`
      : `Visiteur: ${guestName || "Anonyme"} (${guestEmail || "Email non fourni"})`;

    const contextInfo = userContext 
      ? `\n\nContexte:\n${JSON.stringify(userContext, null, 2)}`
      : "";
    
    const conversationInfo = conversationId 
      ? `\n\n<p><strong>Conversation ID:</strong> ${conversationId}</p><p><strong>Session ID:</strong> ${sessionId || "N/A"}</p>`
      : "";

    // 🔒 SÉCU 8: Escape HTML in all user-provided fields
    const emailResponse = await resend.emails.send({
      from: "Astryd Support <onboarding@resend.dev>",
      to: ["tbo@alpact.vc"],
      subject: `[Astryd Support] Nouveau message ${userId ? "utilisateur" : "visiteur"}`,
      html: `
        <h2>Nouveau message de support reçu</h2>
        <p><strong>De:</strong> ${escapeHtml(senderInfo)}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
        ${conversationInfo}
        <hr>
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        ${contextInfo ? `<hr><h3>Contexte:</h3><pre>${escapeHtml(contextInfo)}</pre>` : ""}
        <hr>
        <p><small>ID du message: ${savedMessage.id}</small></p>
        <p><small>Accédez à la conversation complète dans le dashboard admin</small></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: savedMessage.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);