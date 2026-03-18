import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userEmail, userName, replyMessage } = await req.json();

    // Envoyer l'email à l'utilisateur
    if (userEmail) {
      await resend.emails.send({
        from: "Astryd Support <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Réponse de l'équipe Astryd",
        html: `
          <h2>Bonjour ${userName || ""},</h2>
          <p>Vous avez reçu une réponse de l'équipe Astryd concernant votre demande de support :</p>
          <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #6366f1; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
          </div>
          <p>Si vous avez d'autres questions, n'hésitez pas à nous contacter via le chat support sur le site.</p>
          <p>Cordialement,<br>L'équipe Astryd</p>
        `,
      });
    }

    // Copie à l'admin
    await resend.emails.send({
      from: "Astryd Support <onboarding@resend.dev>",
      to: ["tbo@alpact.vc"],
      subject: `[Astryd Support] Copie de votre réponse - Conv: ${conversationId.slice(0, 8)}`,
      html: `
        <h2>Copie de votre réponse support</h2>
        <p><strong>Destinataire:</strong> ${userName || "Visiteur"} (${userEmail || "Email non fourni"})</p>
        <p><strong>Conversation ID:</strong> ${conversationId}</p>
        <hr>
        <h3>Votre message:</h3>
        <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #6366f1; border-radius: 5px;">
          <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("send-admin-reply-email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
