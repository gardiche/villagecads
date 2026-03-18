import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

// Fonction de hashing pour créer une clé de cache déterministe
// VERSION 2: includes zones_attention and parcours
const CACHE_VERSION = 'v2';

function generateCacheKey(data: any): string {
  const sortedData = JSON.stringify(data, Object.keys(data).sort());
  
  let hash = 0;
  for (let i = 0; i < sortedData.length; i++) {
    const char = sortedData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_VERSION}_persona_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 5 requests per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = await checkRateLimit(clientId, "generate-persona-micro-actions", 5, 1);
  if (!isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${clientId}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { equilibreValues, motivations, scenarioAnswers, environnement, champsLibre, riasecValues, cvContent } = await req.json();
    
    // Générer une clé de cache basée sur les données d'entrée (incluant RIASEC + CV)
    const cacheData = {
      equilibreValues,
      motivations,
      scenarioAnswers,
      environnement,
      champsLibre: champsLibre || "",
      riasecValues: riasecValues || {},
      cvContent: cvContent || ""
    };
    const cacheKey = generateCacheKey(cacheData);
    
    console.log('Generated cache key:', cacheKey);
    
    // Vérifier le cache
    const { data: cached, error: cacheError } = await supabase
      .from('persona_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (!cacheError && cached?.persona_data) {
      console.log('✅ Cache HIT - Returning cached persona result');
      return new Response(
        JSON.stringify(cached.persona_data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log('❌ Cache MISS - Generating new persona...');
    
    console.log('Generating personalized micro-actions with data:', {
      equilibreValues,
      motivations,
      scenarioAnswers,
      environnement
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Détecter le persona parmi les 5 définis
    // Basé sur les 3 premières questions du questionnaire :
    // - scenarioAnswers[0] : "Quand quelque chose est incertain" (A=Attendre, B=Expérimenter, C=Se renseigner)
    // - scenarioAnswers[1] : "Face à un projet nouveau" (A=Planifier, B=Se lancer, C=Demander conseil)
    // - scenarioAnswers[2] : "Quand vous rencontrez des difficultés" (A=Insister seul, B=En parler, C=Prendre du recul)
    // - equilibreValues : énergie, temps, soutien, famille (0-100)
    // - environnement : reseau, contextePro, margeManoeuvre (0-100)
    
    const detectPersona = (): string => {
      const energie = equilibreValues.energie || 50;
      const temps = equilibreValues.temps || 50;
      const soi = equilibreValues.soi || 50; // Énergie personnelle/santé
      const soutien = equilibreValues.soutien || 50;
      const famille = equilibreValues.famille || 50;
      const reseau = environnement.reseau || 50;
      
      const reponse0 = scenarioAnswers[0] || "";
      const reponse1 = scenarioAnswers[1] || "";
      const reponse2 = scenarioAnswers[2] || "";
      
      console.log('Persona detection inputs:', { energie, temps, soi, soutien, famille, reseau, reponse0, reponse1, reponse2 });
      
      // NOMS EXACTS DES 5 PERSONAS (STRICTEMENT IDENTIQUES À generate-persona-profile)
      
      // 1. le_prudent_bloqué : "Je doute souvent" (réponse A ou C au scenario 0)
      if (reponse0 === "A" || reponse0 === "C") return "le_prudent_bloqué";
      
      // 2. le_dynamique_pressé : "J'agis vite" + énergie haute + temps bas
      if (reponse1 === "B" && energie > 60 && temps < 40) return "le_dynamique_pressé";
      
      // 3. le_créatif_dispersé : "Je me disperse"
      if (reponse0 === "B" && champsLibre?.includes("idée")) return "le_créatif_dispersé";
      
      // 4. léquilibriste_surchargé : Basé sur soi (énergie personnelle/santé) faible
      if (soi < 40 || famille < 40) return "léquilibriste_surchargé";
      
      // 5. lautonome_isolé : Réseau faible + préfère avancer seul
      if (reseau < 40 && reponse2 === "A") return "lautonome_isolé";
      
      return "léquilibriste_surchargé";
    };

    const personaId = detectPersona();
    
    // Mapper personaId vers titre complet pour affichage
    const personaTitres: Record<string, string> = {
      "le_prudent_bloqué": "Le Prudent Bloqué",
      "le_dynamique_pressé": "Le Dynamique Pressé",
      "le_créatif_dispersé": "Le Créatif Dispersé",
      "léquilibriste_surchargé": "L'Équilibriste Surchargé",
      "lautonome_isolé": "L'Autonome Isolé"
    };
    const personaTitre = personaTitres[personaId] || "Profil Entrepreneurial";

    // Prompts ultra-allégés pour génération rapide (<5s)
    const systemPrompt = `Vous êtes un coach entrepreneurial expérimenté.

🚨 MODE ASSISTIF (PRIORITÉ ABSOLUE - LIRE EN PREMIER) :
- Vous êtes un COPILOTE bienveillant, PAS un commandant.
- INTERDICTION d'utiliser l'impératif seul dans les titres de micro-actions.
- TOUJOURS reformuler en INFINITIF ou QUESTION :
  ❌ "Renseignez votre idée" → ✅ "Renseigner votre idée ?"
  ❌ "Décrivez votre projet" → ✅ "Décrire votre projet (10 min)"
  ❌ "Identifiez vos priorités" → ✅ "Identifier vos 3 priorités ?"
- Les champs "impact", "justification", "conseil_pratique" peuvent utiliser des suggestions douces.

🚨 RÈGLE ABSOLUE NON-NÉGOCIABLE - VOUVOIEMENT :
- TOUJOURS utiliser "vous", "votre", "vos" dans ABSOLUMENT TOUS les textes
- INTERDICTION STRICTE du tutoiement : JAMAIS "tu", "ton", "ta", "tes", "te", "toi"
- Exemples corrects : "Vous avez", "Votre idée", "Votre énergie"
- Exemples INTERDITS : "Tu as", "Ton idée", "Ton énergie"
- Cette règle s'applique à TOUS les champs : titre, impact, justification, conseil_pratique

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RÈGLES ANTI-DÉCROCHAGE V10 (PRIORITÉ HAUTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ RÈGLE - MIROIR FACTUEL :
Si l'utilisateur donne des FAITS PRÉCIS (montants, noms, durées, dates) dans son contexte libre :
→ Les RÉUTILISER TELS QUELS dans la synthèse et les micro-actions. Ne JAMAIS conceptualiser.
❌ INTERDIT : "des contraintes financières" ou "un manque de temps"
✅ OBLIGATOIRE : utiliser les mots exacts et chiffres fournis par l'utilisateur.

⚠️ RÈGLE - ANTI-MÉTA :
Sur les sujets opérationnels (argent, contrats, recrutement, POC, tréso) :
→ INTERDICTION de poser des questions sur "la perception" ou "le sentiment"
→ Les justifications et impacts doivent être FACTUELS et CONCRETS :
  ❌ "Pour mieux appréhender votre rapport au risque"
  ✅ "Pour savoir si votre tréso tient 3 mois sans revenus"

⚠️ STRUCTURE DOUTE/PEUR/BLOCAGE :
Si un frein/verrou est identifié :
1️⃣ VALIDATION factuelle (1 phrase) : "C'est normal de se questionner quand..."
2️⃣ RECADRAGE concret (1 phrase, avec les données de l'utilisateur)
3️⃣ QUESTION FERMÉE ou ACTION concrète

Ton : bienveillant, concret, direct.
Objectif : générer un profil entrepreneurial ET 3-4 micro-actions personnalisées ultra-concrètes.
- Aucun score, chiffre ou pourcentage dans la sortie (jamais de "/100", "%", "score").
- Citez ponctuellement le texte libre pour montrer que vous avez lu la personne.
- SCORES 40-60 : zone NEUTRE/STABLE, base correcte à optimiser (PAS un danger).
- PREMIÈRE MICRO-ACTION OBLIGATOIRE : "Renseigner votre idée pour des résultats ultra-personnalisés ?" (format question, duree: "10 min")

⚠️ INTERDICTION STRICTE DE TERMES SCIENTIFIQUES :
- NE MENTIONNEZ JAMAIS : "RIASEC", "Big Five", "Schwartz", "profil", "dimension", "score", "test psychométrique"
- Utilisez un langage NATUREL et HUMAIN, pas de jargon technique.

Format JSON STRICT :
{
  "persona_profil": {
    "titre": "${personaTitre}",
    "personaId": "${personaId}",
    "synthese": "2-3 phrases max personnalisées EN VOUVOIEMENT",
    "forces": ["Force 1", "Force 2", "Force 3"],
    "verrous": ["Frein 1", "Frein 2", "Frein 3"],
    "cap2_4semaines": "Un seul cap réaliste EN VOUVOIEMENT",
    "gardeFou": "Point de vigilance principal EN VOUVOIEMENT"
  },
  "micro_actions": [
    {
      "titre": "Renseigner votre idée pour des résultats ultra-personnalisés ?",
      "duree": "10 min",
      "impact": "Débloquer micro-actions et zones d'attention 100% ciblées sur votre projet",
      "justification": "Sans idée précise, les recommandations restent génériques",
      "conseil_pratique": "Vous pouvez décrire votre idée en 2-3 phrases : audience, problème résolu, solution envisagée",
      "action_id": "renseigner_idee"
    },
    {
      "titre": "Action ultra-spécifique 5-8 mots (INFINITIF ou QUESTION)",
      "duree": "15 min" | "20 min" | "30 min",
      "impact": "Ce que ça débloque pour vous (VOUVOIEMENT)",
      "justification": "Pourquoi maintenant vu vos contraintes (VOUVOIEMENT)",
      "conseil_pratique": "Une suggestion en 3 étapes : 1... 2... 3..."
    }
  ]
}`;

    const userPrompt = `Voici les données d'une personne :

RÉSERVOIRS DE VIE (0-100) :
- Énergie : ${equilibreValues.energie ?? 50}
- Temps disponible : ${equilibreValues.temps ?? 50}
- Finances personnelles : ${equilibreValues.finances ?? 50}
- Soutien / entourage : ${equilibreValues.soutien ?? 50}
- Réseau professionnel : ${environnement.reseau ?? 50}

PRÉFÉRENCES NATURELLES (appétences professionnelles - analyse interne, NE PAS MENTIONNER CES TERMES) :
- Goût pour le concret/technique : ${riasecValues?.realiste ?? 50}/100
- Goût pour l'analyse/recherche : ${riasecValues?.investigateur ?? 50}/100
- Goût pour la créativité/innovation : ${riasecValues?.artistique ?? 50}/100
- Goût pour l'accompagnement/relation : ${riasecValues?.social ?? 50}/100
- Goût pour la persuasion/leadership : ${riasecValues?.entreprenant ?? 50}/100
- Goût pour l'organisation/méthode : ${riasecValues?.conventionnel ?? 50}/100

COMPÉTENCES / PARCOURS PROFESSIONNEL :
"""
${cvContent || "(aucun CV ou parcours fourni)"}
"""

MOTIVATIONS : ${motivations.join(" | ") || "non renseigné"}

PERSONA DÉTECTÉ : ${personaTitre}

${champsLibre ? `CONTEXTE LIBRE : "${champsLibre.substring(0, 300)}"` : ''}

Consignes :
- MODE ASSISTIF : Tous les titres de micro-actions doivent utiliser l'INFINITIF ou le format QUESTION (pas d'impératif)
- PREMIÈRE MICRO-ACTION OBLIGATOIRE : "Renseigner votre idée pour des résultats ultra-personnalisés ?" avec action_id: "renseigner_idee"
- UTILISEZ LE PROFIL RIASEC pour personnaliser les actions : un "Artistique" aura des actions créatives, un "Conventionnel" aura des actions structurées
- UTILISEZ LES COMPÉTENCES (CV) pour adapter les recommandations au niveau réel de la personne
- Si finances > 70 → dans FORCES mentionner capacité d'investissement, JAMAIS dans freins "contraintes financières"
- Si énergie < 40 → micro-action de récupération/repos (2ème ou 3ème action)
- Si temps < 40 → micro-action de priorisation/élimination (2ème ou 3ème action)
- Les 3-4 micro-actions doivent être ultra-personnalisées selon RIASEC+CV et faisables en <30min
- Citez 1-2 éléments du contexte libre si pertinent

Générez UNIQUEMENT le JSON, rien d'autre.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON from AI');
    }

    if (!parsedResult.micro_actions || !Array.isArray(parsedResult.micro_actions)) {
      throw new Error('Invalid micro_actions format from AI');
    }

    if (!parsedResult.persona_profil) {
      throw new Error('Invalid persona_profil format from AI');
    }

    // ⚡ PARALLÉLISER zones d'attention + parcours pour gagner du temps
    console.log('⚡ Generating zones + journey in parallel...');
    
    // Construire un résumé des appétences pour les zones (sans mentionner RIASEC)
    const appetencesSummary = riasecValues ? 
      `Appétences: Concret/technique=${riasecValues.realiste ?? 50}, Analyse=${riasecValues.investigateur ?? 50}, Créativité=${riasecValues.artistique ?? 50}, Relation=${riasecValues.social ?? 50}, Leadership=${riasecValues.entreprenant ?? 50}, Organisation=${riasecValues.conventionnel ?? 50}` : 
      'Appétences: non renseignées';
    
    const zonesPrompt = `Générez 2-3 zones d'attention basées sur ce profil.

PROFIL: ${parsedResult.persona_profil.titre}
- Freins: ${parsedResult.persona_profil.verrous.join(', ')}
- ${appetencesSummary}
- Compétences/CV: ${cvContent ? cvContent.substring(0, 200) + '...' : '(non renseigné)'}

🚨 RÈGLE ABSOLUE NON-NÉGOCIABLE - VOUVOIEMENT :
- TOUJOURS utiliser "vous", "votre", "vos" dans ABSOLUMENT TOUS les textes
- INTERDICTION STRICTE du tutoiement : JAMAIS "tu", "ton", "ta", "tes", "te", "toi"
- Exemples corrects : "Vous semblez", "Votre énergie", "Votre réseau"
- Exemples INTERDITS : "Tu sembles", "Ton énergie", "Ton réseau"

CONTRAINTES :
- Zones d'attention = CONSTATS PURS uniquement (observations, pas d'actions)
- Exemples: "Vous semblez avoir un problème d'énergie", "Votre réseau professionnel est limité"
- JAMAIS d'impératifs ("identifier", "évaluer", "renseigner") - ça appartient aux micro-actions
- Severity: 3=critique, 2=attention, 1=info
- Langage simple, bienveillant
- SCORES 40-60 = zone NEUTRE/STABLE (base correcte à optimiser, PAS un danger)
- NE MENTIONNEZ JAMAIS "RIASEC", "Big Five", "Schwartz" - utilisez un langage naturel

JSON STRICT:
{"zones": [{"label": "...", "recommendation": "Constat détaillé et personnalisé EN VOUVOIEMENT", "severity": 1-3, "impact_concret": "Pourquoi c'est vital pour vous EN VOUVOIEMENT"}]}`;

    const journeyPrompt = `Créez 6 étapes de parcours PERSONNALISÉES.

PROFIL: ${parsedResult.persona_profil.titre}
- Cap: ${parsedResult.persona_profil.cap2_4semaines}

🚨 RÈGLE ABSOLUE - VOUVOIEMENT OBLIGATOIRE :
- TOUJOURS "vous", "votre", "vos" - JAMAIS "tu", "ton", "ta", "tes"

ÉTAPES EXACTES:
1. id: "profile_completed", title: "Profil entrepreneurial complété", completed: true
2. id: "idea_defined", title: "Renseigner votre idée projet", completed: false
3. id: "objective_validated", title: "Valider votre objectif", completed: false
4. id: "first_micro_action", title: "Réaliser votre première micro-action", completed: false
5. id: "journal_started", title: "Démarrer votre journal entrepreneurial", completed: false
6. id: "zones_explored", title: "Explorer vos zones d'attention", completed: false

Descriptions: 15-25 mots EN VOUVOIEMENT ("vous"), expliquer POURQUOI cette étape est importante pour cette personne.

JSON STRICT (aucun texte avant/après):
{"parcours": [{"id": "...", "title": "...", "description": "...", "completed": true/false}, ...]}`;

    // Fallback steps en cas d'échec
    const fallbackSteps = [
      { id: "profile_completed", title: "Profil entrepreneurial complété", description: "Vous avez complété votre profil entrepreneurial avec succès.", completed: true },
      { id: "idea_defined", title: "Renseigner votre idée projet", description: "Précisez votre idée pour personnaliser vos micro-actions et zones d'attention.", completed: false },
      { id: "objective_validated", title: "Valider votre objectif", description: "Validez l'objectif proposé pour structurer votre progression.", completed: false },
      { id: "first_micro_action", title: "Réaliser votre première micro-action", description: "Accomplissez une première action concrète pour avancer.", completed: false },
      { id: "journal_started", title: "Démarrer votre journal entrepreneurial", description: "Commencez à échanger avec le coach IA pour cheminer.", completed: false },
      { id: "zones_explored", title: "Explorer vos zones d'attention", description: "Prenez connaissance des points de vigilance identifiés.", completed: false }
    ];

    let attentionZones = [];
    let journeySteps = fallbackSteps;

    // ⚡ APPELS PARALLÈLES pour zones + parcours
    const [zonesResponse, journeyResponse] = await Promise.all([
      fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: zonesPrompt }],
          response_format: { type: "json_object" }
        }),
      }),
      fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a JSON generator. Output ONLY valid JSON.' },
            { role: 'user', content: journeyPrompt }
          ],
          response_format: { type: "json_object" }
        }),
      })
    ]);

    // Traiter zones
    try {
      if (zonesResponse.ok) {
        const zonesData = await zonesResponse.json();
        const parsedZones = JSON.parse(zonesData.choices[0].message.content);
        if (parsedZones.zones && Array.isArray(parsedZones.zones)) {
          attentionZones = parsedZones.zones;
          console.log('✅ Generated attention zones:', attentionZones.length);
        }
      }
    } catch (error) {
      console.error('Error parsing zones:', error);
    }

    // Traiter parcours
    try {
      if (journeyResponse.ok) {
        const journeyData = await journeyResponse.json();
        const content = journeyData.choices[0].message.content.trim()
          .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedJourney = JSON.parse(content);
        if (parsedJourney.parcours && Array.isArray(parsedJourney.parcours) && parsedJourney.parcours.length === 6) {
          journeySteps = parsedJourney.parcours;
          console.log('✅ Generated journey steps:', journeySteps.length);
        }
      }
    } catch (error) {
      console.error('Error parsing journey:', error);
    }


    // 🚨 POST-TRAITEMENT VOUVOIEMENT : Utiliser la fonction partagée pour garantir "Zéro Tu"
    const transformedMicroActions = parsedResult.micro_actions.map((action: any) => ({
      ...action,
      titre: enforceVouvoiement(action.titre),
      impact: enforceVouvoiement(action.impact),
      justification: enforceVouvoiement(action.justification),
      conseil_pratique: enforceVouvoiement(action.conseil_pratique)
    }));

    const transformedZones = attentionZones.map((zone: any) => ({
      ...zone,
      label: enforceVouvoiement(zone.label),
      recommendation: enforceVouvoiement(zone.recommendation),
      impact_concret: enforceVouvoiement(zone.impact_concret)
    }));

    // Generate hyper-personalized Nano Banana visual with FULL profile data
    console.log('🎨 Generating hyper-personalized Nano Banana visual...');
    let visualUrl = null;
    try {
      const visualResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-persona-visual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personaId,
          equilibreValues,
          motivations,
          riasecScores: null, // Pas encore dans ce contexte
          schwartzValues: null, // Pas encore dans ce contexte
          ideaTitle: null,
          ideaDescription: null,
          champsLibre
        })
      });
      
      if (visualResponse.ok) {
        const visualData = await visualResponse.json();
        visualUrl = visualData.imageUrl || visualData.imageUrls?.[0];
        console.log('✅ Hyper-personalized Nano Banana visual generated');
      } else {
        console.error('Visual generation failed:', await visualResponse.text());
      }
    } catch (error) {
      console.error('Error generating persona visual:', error);
    }

    const finalResult = { 
      success: true,
      persona_profil: {
        ...parsedResult.persona_profil,
        synthese: enforceVouvoiement(parsedResult.persona_profil.synthese),
        cap2_4semaines: enforceVouvoiement(parsedResult.persona_profil.cap2_4semaines),
        gardeFou: enforceVouvoiement(parsedResult.persona_profil.gardeFou),
        visualUrl
      },
      micro_actions: transformedMicroActions.slice(0, 3),
      zones_attention: transformedZones,
      parcours: journeySteps, // ✅ Étapes de parcours personnalisées
      titre: parsedResult.persona_profil.titre,
      personaId: parsedResult.persona_profil.personaId,
      synthese: enforceVouvoiement(parsedResult.persona_profil.synthese),
      forces: parsedResult.persona_profil.forces,
      verrous: parsedResult.persona_profil.verrous,
      cap2_4semaines: enforceVouvoiement(parsedResult.persona_profil.cap2_4semaines),
      gardeFou: enforceVouvoiement(parsedResult.persona_profil.gardeFou),
      visual_url: visualUrl
    };
    
    // Sauvegarder en cache pour utilisation future (7 jours)
    console.log('Saving result to cache with key:', cacheKey);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    try {
      await supabase
        .from('persona_cache')
        .upsert({
          cache_key: cacheKey,
          persona_data: finalResult,
          expires_at: expiresAt.toISOString()
        });
      console.log('✅ Result cached successfully');
    } catch (cacheError) {
      console.error('Cache save error (non-blocking):', cacheError);
    }

    return new Response(
      JSON.stringify(finalResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-persona-micro-actions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
