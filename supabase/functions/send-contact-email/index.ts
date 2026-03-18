import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { escapeHtml } from "../_shared/sanitize.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont requis" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate lengths
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Un ou plusieurs champs dépassent la longueur maximale" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to Astryd team
    const emailResponse = await resend.emails.send({
      from: "Astryd Contact <onboarding@resend.dev>",
      to: ["tbo@alpact.vc"],
      replyTo: email,
      subject: `[Astryd Contact] ${subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
            Nouveau message depuis le formulaire de contact Astryd
          </h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>De :</strong> ${escapeHtml(name)}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> ${escapeHtml(email)}</p>
            <p style="margin: 5px 0;"><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Message :</h3>
            <p style="white-space: pre-wrap; color: #333; line-height: 1.6;">${escapeHtml(message)}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Ce message a été envoyé depuis le formulaire de contact d'Astryd
          </p>
        </div>
      `,
    });

    console.log("Contact email sent successfully:", emailResponse);

    // Send confirmation email to user
    await resend.emails.send({
      from: "Astryd <onboarding@resend.dev>",
      to: [email],
      subject: "Message bien reçu - Astryd",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bonjour ${escapeHtml(name)},</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Merci d'avoir pris le temps de nous contacter. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
          </p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;"><strong>Votre message :</strong></p>
            <p style="white-space: pre-wrap; color: #333; line-height: 1.6; margin-top: 10px;">${escapeHtml(message)}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            À très bientôt,<br>
            <strong>L'équipe Astryd</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Astryd - Quand tout s'aligne<br>
            Développé par Alpact
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
