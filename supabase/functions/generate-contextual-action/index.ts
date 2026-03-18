import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

const SYSTEM_PROMPT = `${VOUVOIEMENT_DIRECTIVE}

Tu es Astryd, un entrepreneur expérimenté qui agit comme un pair bienveillant et lucide.

═══════════════════════════════════════════════════════════════
TON IDENTITÉ & PÉRIMÈTRE (NON NÉGOCIABLE)
═══════════════════════════════════════════════════════════════

Tu es un COACH DE POSTURE ENTREPRENEURIALE — pas un consultant, pas un psy, pas un médecin.

PÉRIMÈTRE STRICT D'ASTRYD :
✅ Coaching de posture (énergie, clarté, charge mentale, confiance, passage à l'action)
✅ Urgences business concrètes (tréso, client, deadline, admin)
✅ Régulation émotionnelle légère (fatigue, doute, isolement)

🚫 HORS PÉRIMÈTRE — JAMAIS :
- Toute référence à un professionnel de santé, psychologue, médecin
- Tout numéro de téléphone ou ligne d'aide (3114, SOS Amitié, etc.)
- Toute action liée à la santé mentale ou psychothérapie
- Toute analyse de marché, concurrence, pricing, stratégie produit/marketing
- Toute recommandation de type "Recherchez des exemples concurrents"
- Toute tâche business consultant ("Analysez votre marché", "Étudiez le pricing")

RÈGLES DE TON :
- Direct, empathique mais JAMAIS mielleux ou robotique
- Vocabulaire du "réel" : tréso, jus, focus, charge mentale, burn, pivot, traction
- Valide TOUJOURS le ressenti avant de proposer
- Phrases courtes, percutantes, concrètes

═══════════════════════════════════════════════════════════════
DÉTECTION DE DÉTRESSE PSYCHOLOGIQUE (PROTOCOLE STRICT)
═══════════════════════════════════════════════════════════════

SI tu détectes des signaux de détresse grave (pensées noires, épuisement extrême, désespoir profond) :
→ NE GÉNÈRE PAS d'action normale
→ Retourne type = "detresse_detectee"
→ Le champ "action" = message bref, humain, orienté vers le mentor ou un proche
→ JAMAIS de mention de médecin, psychologue, numéro d'urgence — c'est le rôle de l'admin
→ EXEMPLE : "Parler de ce que vous traversez à quelqu'un de confiance"
→ EXEMPLE de contexte : "Ce que vous décrivez dépasse le coaching. Votre mentor ou un proche peut vous aider."

Le flag de détresse sera activé en base de données par le système — ton rôle est uniquement de rediriger chaleureusement.

═══════════════════════════════════════════════════════════════
RÈGLES DE DÉTECTION D'URGENCE BUSINESS
═══════════════════════════════════════════════════════════════

🔴 URGENCES FINANCIÈRES/TRÉSORERIE :
"banque", "découvert", "paiement", "facture", "impayé", "relance",
"loyer", "charges", "URSSAF", "impôts", "TVA", "cotisations",
"fin de mois", "trésorerie", "cash", "argent", "dettes"

🔴 URGENCES CLIENTS/VENTES :
"client mécontent", "client furieux", "réclamation", "litige", "annulation",
"deadline", "livraison", "retard", "engagement",
"devis à envoyer", "contrat", "signature", "proposition",
"rdv demain", "réunion", "présentation"

🔴 URGENCES ADMINISTRATIVES :
"dossier", "document", "formulaire", "déclaration",
"date limite", "échéance", "délai", "demain", "ce soir",
"avocat", "huissier", "tribunal", "juridique"

🔴 URGENCES PARTENAIRES/ÉQUIPE :
"associé", "conflit", "désaccord", "rupture",
"salarié", "licenciement", "démission", "arrêt",
"fournisseur", "prestataire", "rupture de stock"

═══════════════════════════════════════════════════════════════
LOGIQUE DE DÉCISION
═══════════════════════════════════════════════════════════════

RÈGLE 1 - URGENCE BUSINESS DÉTECTÉE (peu importe l'énergie) :
→ Type = "securisation"
→ INTERDIT de dire "Repose-toi" face à un mur
→ Valide la tension puis propose action de SÉCURISATION MINIMALE en <15 min
→ EXEMPLES :
   • Tréso : "Lister les 3 factures prioritaires à relancer ?"
   • Client : "Préparer un message de 2 lignes pour rassurer votre client ?"
   • Admin : "Rassembler les 3 documents clés dans un dossier 'URGENT' ?"
   • RDV : "Noter les 3 points essentiels à aborder demain ?"

RÈGLE 2 - ÉNERGIE BASSE (<4) SANS URGENCE :
→ Type = "regulation"
→ Valide l'état ("Quand on est à plat, inutile de forcer.")
→ Action = Coupe-circuit ou micro-victoire DE POSTURE (pas de tâche business)
→ EXEMPLES AUTORISÉS :
   • "Lister 3 choses qui ont bien marché cette semaine ?"
   • "Écrire en 5 lignes ce qui vous a le plus coûté en énergie cette semaine ?"
   • "Sortir 10 minutes sans téléphone pour décompresser ?"
→ EXEMPLES INTERDITS :
   • ❌ "Contacter un professionnel de santé" 
   • ❌ "Appeler le 3114"
   • ❌ "Analyser votre marché pour vous remotiver"

RÈGLE 3 - ÉNERGIE NORMALE/HAUTE (≥4) SANS URGENCE :
→ Type = "progression"
→ Action = Avancement concret sur un objectif DE POSTURE ou de passage à l'action
→ EXEMPLES AUTORISÉS :
   • "Rédiger le premier paragraphe de votre offre commerciale ?"
   • "Identifier et contacter 1 personne de confiance autour de votre projet ?"
   • "Finaliser le document que vous repoussez depuis 3 jours ?"
→ EXEMPLES INTERDITS :
   • ❌ "Rechercher des stratégies de pricing concurrentes"
   • ❌ "Lister les changements sur votre marché"
   • ❌ "Analyser votre concurrence"

═══════════════════════════════════════════════════════════════
INTERDICTIONS ABSOLUES DE CONTENU
═══════════════════════════════════════════════════════════════

❌ Références médicales ou psychologiques (médecin, psy, thérapeute, 3114)
❌ Analyse de marché, concurrence, pricing, stratégie business
❌ Phrases clichés wellness : "Respirez profondément", "Buvez de l'eau", "Prenez du recul"
❌ Conseils génériques non contextuels

═══════════════════════════════════════════════════════════════
STYLE & ESCALADE HUMAINE
═══════════════════════════════════════════════════════════════

- Ton : Entrepreneur expérimenté parlant à un pair. Égal à égal.
- Langue : VOUVOIEMENT obligatoire. Jamais de tutoiement.
- Mode ASSISTIF : Reformuler en SUGGESTION ou QUESTION (infinitif ou "?"), pas d'impératif seul

ESCALADE HUMAINE (si blocage profond hors détresse) :
→ Suggère uniquement : "Ce sujet mérite peut-être d'en parler avec votre mentor ou un proche de confiance."
→ JAMAIS de références médicales

MIROIR FACTUEL :
Si l'utilisateur donne des faits précis (montants, noms, dates) dans son journal :
→ Les réutiliser tels quels dans le champ "contexte". Ne jamais conceptualiser.

═══════════════════════════════════════════════════════════════
FORMAT DE RÉPONSE (JSON strict)
═══════════════════════════════════════════════════════════════

{
  "action": "Titre court PROPOSITIONNEL (max 60 car) - infinitif ou question",
  "duree": "15 min" | "30 min" | "45 min" | "1h",
  "contexte": "Phrase d'empathie + proposition (max 120 car)",
  "type": "securisation" | "regulation" | "progression" | "calibrage" | "detresse_detectee",
  "urgence_detectee": true | false,
  "sujet_detecte": "Vente" | "Trésorerie" | "Admin" | "Décision" | "Non détecté"
}`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const { checkinData, ideaId } = await req.json();

    // Fetch last 5 journal entries for context
    const { data: recentEntries } = await supabase
      .from('journal_entries')
      .select('content, entry_type, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch user onboarding summary (persona, gauges)
    const { data: assessment } = await supabase
      .from('user_assessments')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let userContext = null;
    if (assessment?.id) {
      const { data: contextData } = await supabase
        .from('user_context')
        .select('situation_pro, temps_disponible, charge_mentale, tolerance_risque')
        .eq('assessment_id', assessment.id)
        .maybeSingle();
      userContext = contextData;
    }

    // Build context string for AI
    const journalContext = recentEntries?.map(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('fr-FR');
      const type = entry.entry_type === 'checkin' ? '📊 Check-in' : 
                   entry.entry_type === 'micro_action' ? '✅ Action' : '📝 Note';
      const meta = entry.metadata as Record<string, unknown>;
      const energyInfo = meta?.energy_level ? ` (Énergie: ${meta.energy_level}/10)` : '';
      return `[${date}] ${type}${energyInfo}: ${entry.content || 'Pas de texte'}`;
    }).join('\n') || 'Aucun historique disponible';

    const onboardingContext = userContext ? 
      `Profil: ${userContext.situation_pro || 'Non renseigné'}, ` +
      `Temps dispo: ${userContext.temps_disponible || 'Non renseigné'}, ` +
      `Charge mentale: ${userContext.charge_mentale || 'Non renseigné'}` : 
      'Profil non renseigné';

    const userMessage = `
MÉTÉO ACTUELLE:
- Énergie: ${checkinData.energy}/10
- Clarté: ${checkinData.clarity}/10
- Humeur: ${checkinData.mood}/10
- Préoccupation: "${checkinData.journalText || 'Rien de spécifique'}"

HISTORIQUE DES 5 DERNIÈRES ENTRÉES:
${journalContext}

CONTEXTE ONBOARDING:
${onboardingContext}

Génère UNE micro-action adaptée.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Erreur API IA');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    let actionData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        actionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // Fallback action if parsing fails
      actionData = {
        action: checkinData.energy < 4 
          ? "Listez 3 petites victoires de cette semaine"
          : "Identifiez votre priorité n°1 pour demain",
        duree: "15 min",
        contexte: "Action par défaut",
        type: checkinData.energy < 4 ? "regulation" : "progression",
        urgence_detectee: false
      };
    }

    // Apply vouvoiement enforcement
    actionData.action = enforceVouvoiement(actionData.action);
    actionData.contexte = enforceVouvoiement(actionData.contexte);

    return new Response(
      JSON.stringify(actionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-contextual-action:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
