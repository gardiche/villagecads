import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

interface MentoratRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  challenge: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prenom, nom, email, telephone, challenge, userId }: MentoratRequest = await req.json();

    // Validation des champs requis
    if (!prenom || !nom || !email || !telephone || !challenge) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construire le lien vers le profil Astryd (si userId fourni)
    const profileLink = userId 
      ? `https://astryd.app/profil-entrepreneurial?user=${userId}` 
      : "Utilisateur non connecté";

    // Envoyer l'email structuré à tbo@alpact.vc
    const emailResponse = await resend.emails.send({
      from: "Astryd <onboarding@resend.dev>",
      to: ["tbo@alpact.vc"],
      subject: `🎯 Nouvelle candidature Mentorat Astryd — ${prenom} ${nom}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
            🎯 Nouvelle candidature Mentorat
          </h1>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">📋 Informations du candidat</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Prénom & Nom:</strong></td>
                <td style="padding: 8px 0;">${prenom} ${nom}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #8B5CF6;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Téléphone:</strong></td>
                <td style="padding: 8px 0;"><a href="tel:${telephone}" style="color: #8B5CF6;">${telephone}</a></td>
              </tr>
            </table>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">🧩 Challenge actuel décrit par le candidat</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${challenge}</p>
          </div>

          <div style="background: #e7f3ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">🔗 Accès au profil Astryd</h3>
            <p style="margin: 0;">
              ${userId 
                ? `<a href="${profileLink}" style="color: #8B5CF6; font-weight: bold;">Voir le profil complet sur Astryd →</a>` 
                : `<span style="color: #666;">Utilisateur non authentifié au moment de la candidature</span>`
              }
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">
            Email envoyé automatiquement depuis Astryd — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      `,
    });

    console.log("📧 Email mentorat envoyé:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Candidature envoyée avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erreur send-mentorat-request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
