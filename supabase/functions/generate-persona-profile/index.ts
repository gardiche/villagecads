import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

// Fonction de hashing pour créer une clé de cache déterministe (identique à generate-persona-micro-actions)
function generateCacheKey(data: any): string {
  const sortedData = JSON.stringify(data, Object.keys(data).sort());
  
  let hash = 0;
  for (let i = 0; i < sortedData.length; i++) {
    const char = sortedData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `persona_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 5 requests per minute per IP
  const clientId = getClientIdentifier(req);
  const isAllowed = await checkRateLimit(clientId, "generate-persona-profile", 5, 1);
  if (!isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${clientId}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { equilibreValues, motivations, scenarioAnswers, environnement, champsLibre, riasecValues, cvContent, situationPro, tempsConsacre, causesEngagees, bigFiveValues } = await req.json();
    
    // Version du prompt / algorithme pour invalider proprement l'ancien cache
    const PROMPT_VERSION = "v5_psychology_first_2025-12-10";
    
    // Créer une clé de cache basée sur les données du questionnaire + version du prompt
    const cacheData = {
      version: PROMPT_VERSION,
      equilibreValues,
      motivations,
      scenarioAnswers,
      environnement,
      champsLibre: champsLibre || "",
      riasecValues: riasecValues || {},
      bigFiveValues: bigFiveValues || {},
      cvContent: cvContent || "",
      situationPro: situationPro || "",
      tempsConsacre: tempsConsacre || "",
      causesEngagees: causesEngagees || []
    };
    const cacheKey = generateCacheKey(cacheData);
    
    console.log('🔑 Cache key:', cacheKey);
    
    // Vérifier le cache directement depuis persona_cache
    const { data: cached, error: cacheError } = await supabase
      .from('persona_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (!cacheError && cached?.persona_data) {
      console.log('✅ CACHE HIT - Returning cached persona profile');
      return new Response(
        JSON.stringify(cached.persona_data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log('❌ CACHE MISS - Generating new profile');

    console.log('🚀 Generating PROFILE ONLY (ultra-fast)');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // ========== REFONTE ALGORITHMIQUE "PSYCHOLOGY FIRST" ==========
    // PRINCIPE FONDAMENTAL : Identité (5 pts) > Contexte (2 pts)
    // L'ADN psychologique prime sur les contraintes logistiques
    const detectPersona = (): string => {
      try {
        // 🔒 DÉFENSE : Valeurs par défaut pour toutes les variables
        const energie = equilibreValues?.energie ?? 50;
        const temps = equilibreValues?.temps ?? 50;
        const finances = equilibreValues?.finances ?? 50;
        const soi = equilibreValues?.soi ?? 50;
        const sante = equilibreValues?.sante ?? 50;
        const soutien = equilibreValues?.soutien ?? 50;
        const famille = equilibreValues?.famille ?? 50;
        const pro = equilibreValues?.pro ?? 50;
        const reseau = environnement?.reseau ?? 50;
        const equipe = environnement?.equipe ?? 50;
        const toleranceRisque = environnement?.toleranceRisque ?? 50;
        
        // 🧠 BIG FIVE - Données psychologiques PRIORITAIRES
        const ouverture = bigFiveValues?.ouverture ?? 50;
        const conscienciosite = bigFiveValues?.conscienciosite ?? 50;
        const extraversion = bigFiveValues?.extraversion ?? 50;
        const agreabilite = bigFiveValues?.agreabilite ?? 50;
        const nevrosisme = bigFiveValues?.nevrosisme ?? 50;
        
        // 🎯 RIASEC - Appétences professionnelles
        const riasecArtistique = riasecValues?.artistique ?? 50;
        const riasecEntreprenant = riasecValues?.entreprenant ?? 50;
        const riasecRealiste = riasecValues?.realiste ?? 50;
        const riasecConventionnel = riasecValues?.conventionnel ?? 50;
        const riasecInvestigateur = riasecValues?.investigateur ?? 50;
        const riasecSocial = riasecValues?.social ?? 50;
        
        // Scénarios et texte libre
        const reponse0 = scenarioAnswers?.[0] ?? "";
        const reponse1 = scenarioAnswers?.[1] ?? "";
        const texteLibre = (champsLibre ?? "").toString().toLowerCase();
        
        console.log('🧠 Big Five détecté:', { ouverture, conscienciosite, extraversion, agreabilite, nevrosisme });
        console.log('🎯 RIASEC détecté:', { riasecArtistique, riasecEntreprenant, riasecRealiste });
        
        // 1️⃣ INITIALISATION : Compteur pour les 5 profils
        const scores: Record<string, number> = {
          "le_dynamique_pressé": 0,
          "lautonome_isolé": 0,
          "le_prudent_bloqué": 0,
          "le_créatif_dispersé": 0,
          "léquilibriste_surchargé": 0
        };
        
        // ========== PSYCHOLOGY FIRST SCORING ==========
        
        // 🎨 1. LE CRÉATIF DISPERSÉ (Priorité : Idéation)
        // Signal FORT (+5 pts) : BigFive.Ouverture > 70 OU RIASEC.Artistique > 70
        if (ouverture > 70 || riasecArtistique > 70) {
          scores["le_créatif_dispersé"] += 5;
          console.log('🎨 Créatif: Signal FORT détecté (Ouverture/Artistique)');
        }
        // Signal Moyen (+3 pts) : Scenario[0] == 'B' (Se disperse)
        if (reponse0 === "B") {
          scores["le_créatif_dispersé"] += 3;
        }
        // Signal Faible (+2 pts) : Mots clés
        if (texteLibre.includes("idée") || texteLibre.includes("projets") || 
            texteLibre.includes("partout") || texteLibre.includes("plusieurs") ||
            texteLibre.includes("dispersé") || texteLibre.includes("focus")) {
          scores["le_créatif_dispersé"] += 2;
        }
        
        // 🏔️ 2. L'AUTONOME ISOLÉ (Priorité : Lien)
        // Signal FORT (+5 pts) : Soutien < 30 OU Réseau < 30
        if (soutien < 30 || reseau < 30) {
          scores["lautonome_isolé"] += 5;
          console.log('🏔️ Autonome: Signal FORT détecté (Soutien/Réseau critique)');
        }
        // Signal Moyen (+3 pts) : BigFive.Extraversion < 40 OU RIASEC.Réaliste > 70
        if (extraversion < 40 || riasecRealiste > 70) {
          scores["lautonome_isolé"] += 3;
        }
        // Signal Faible (+2 pts) : Mots clés
        if (texteLibre.includes("seul") || texteLibre.includes("autonomie") ||
            texteLibre.includes("isolé") || texteLibre.includes("personne")) {
          scores["lautonome_isolé"] += 2;
        }
        
        // 🛡️ 3. LE PRUDENT BLOQUÉ (Priorité : Sécurité)
        // Signal FORT (+5 pts) : BigFive.Nevrosisme > 65 (Anxiété structurelle)
        if (nevrosisme > 65) {
          scores["le_prudent_bloqué"] += 5;
          console.log('🛡️ Prudent: Signal FORT détecté (Nevrosisme > 65)');
        }
        // Signal Moyen (+3 pts) : Scenario[1] == 'A' OU Finances < 30
        if (reponse1 === "A" || finances < 30) {
          scores["le_prudent_bloqué"] += 3;
        }
        // Signal Faible (+2 pts) : Mots clés
        if (texteLibre.includes("peur") || texteLibre.includes("risque") ||
            texteLibre.includes("doute") || texteLibre.includes("hésit") ||
            texteLibre.includes("incertain") || texteLibre.includes("oser")) {
          scores["le_prudent_bloqué"] += 2;
        }
        
        // 🔥 4. LE DYNAMIQUE PRESSÉ (Priorité : Action) - NERFÉ MASSIVEMENT
        // Signal FORT (+4 pts seulement) : RIASEC.Entreprenant > 70
        if (riasecEntreprenant > 70) {
          scores["le_dynamique_pressé"] += 4;
          console.log('🔥 Dynamique: Signal FORT détecté (Entreprenant > 70)');
        }
        // Signal Contexte (+2 pts seulement) : Energie > 60
        if (energie > 60) {
          scores["le_dynamique_pressé"] += 2;
        }
        // Signal Contexte (+2 pts seulement) : Temps < 40
        if (temps < 40) {
          scores["le_dynamique_pressé"] += 2;
        }
        // Mots clés (+1 pt seulement - réduit)
        if (texteLibre.includes("vite") || texteLibre.includes("urgent") ||
            texteLibre.includes("rapidement")) {
          scores["le_dynamique_pressé"] += 1;
        }
        
        // ⚖️ 5. L'ÉQUILIBRISTE SURCHARGÉ (Priorité : Charge)
        // Signal FORT (+5 pts) : BigFive.Conscienciosite > 70 ET (Famille < 40 OU Pro < 40)
        if (conscienciosite > 70 && (famille < 40 || pro < 40)) {
          scores["léquilibriste_surchargé"] += 5;
          console.log('⚖️ Équilibriste: Signal FORT détecté (Conscienciosité + Charge familiale/pro)');
        }
        // Signal Moyen (+3 pts) : Plus de 3 sphères de vie < 40 (Charge systémique)
        const spheresBasses = [energie, temps, finances, sante, famille, soi].filter(v => v < 40).length;
        if (spheresBasses >= 3) {
          scores["léquilibriste_surchargé"] += 3;
          console.log(`⚖️ Équilibriste: ${spheresBasses} sphères < 40 détectées`);
        }
        // Mots clés (+2 pts)
        if (texteLibre.includes("fatigue") || texteLibre.includes("surcharg") ||
            texteLibre.includes("trop") || texteLibre.includes("épuis") ||
            texteLibre.includes("débord") || texteLibre.includes("lourd")) {
          scores["léquilibriste_surchargé"] += 2;
        }
        
        // ========== MALUS : PÉNALITÉS ÉLIMINATOIRES ==========
        // Certains traits sont incompatibles avec certains profils
        
        // 🎨 MALUS Créatif Dispersé : Un créatif très organisé n'est pas dispersé
        if (conscienciosite > 75) {
          scores["le_créatif_dispersé"] = Math.max(0, scores["le_créatif_dispersé"] - 5);
          console.log('🎨 Créatif: MALUS -5 (Conscienciosité > 75 = Architecte, pas Dispersé)');
        }
        
        // 🏔️ MALUS Autonome Isolé : Un profil très Social ne souffre pas d'isolement
        if (riasecSocial > 70 || equipe > 70) {
          scores["lautonome_isolé"] = Math.max(0, scores["lautonome_isolé"] - 3);
          console.log('🏔️ Autonome: MALUS -3 (Social/Équipe > 70 = pas isolé structurel)');
        }
        
        // 🛡️ MALUS Prudent Bloqué : Forte tolérance au risque incompatible avec blocage
        if (toleranceRisque > 70 || ouverture > 75) {
          scores["le_prudent_bloqué"] = Math.max(0, scores["le_prudent_bloqué"] - 3);
          console.log('🛡️ Prudent: MALUS -3 (Tolérance risque/Ouverture > 70-75 = pas bloqué)');
        }
        
        // 🔥 MALUS CRITIQUE Dynamique Pressé : Test ultime - Planifier ≠ Foncer
        if (reponse1 === "A") {
          scores["le_dynamique_pressé"] = Math.max(0, scores["le_dynamique_pressé"] - 5);
          console.log('🔥 Dynamique: MALUS CRITIQUE -5 (Scenario[1]=A = Planificateur, pas Dynamique)');
        }
        
        // 3️⃣ LE VERDICT : Élection du profil dominant
        console.log('📊 Scores PSYCHOLOGY FIRST (après MALUS):', scores);
        let maxScore = 0;
        let dominantPersona = "léquilibriste_surchargé"; // Fallback ultime
        
        // TIE-BREAK INVERSÉ : Priorité aux profils psychologiques
        const priorityOrder = [
          "le_créatif_dispersé",      // Priorité 1 : L'identité créative
          "le_prudent_bloqué",        // Priorité 2 : L'anxiété structurelle
          "lautonome_isolé",          // Priorité 3 : Le besoin de lien
          "le_dynamique_pressé",      // Priorité 4 : L'action (NERFÉ)
          "léquilibriste_surchargé"   // Priorité 5 : La charge
        ];
        
        for (const persona of priorityOrder) {
          const score = scores[persona] ?? 0;
          if (score > maxScore) {
            maxScore = score;
            dominantPersona = persona;
          }
        }
        
        // Fallback si tous les scores sont à 0
        if (maxScore === 0) {
          console.warn('⚠️ Tous les scores à 0 - fallback Équilibriste activé');
          return "léquilibriste_surchargé";
        }
        
        console.log(`🎯 PSYCHOLOGY FIRST - Profil dominant: ${dominantPersona} (score: ${maxScore})`);
        return dominantPersona;
        
      } catch (error) {
        console.error('❌ Erreur critique dans detectPersona:', error);
        return "léquilibriste_surchargé";
      }
    };

    const personaId = detectPersona();
    console.log('Detected:', personaId);
    
    // Mapping personaId -> titre lisible
    const personaTitres: Record<string, string> = {
      "le_prudent_bloqué": "Le Prudent Bloqué",
      "le_dynamique_pressé": "Le Dynamique Pressé",
      "le_créatif_dispersé": "Le Créatif Dispersé",
      "léquilibriste_surchargé": "L'Équilibriste Surchargé",
      "lautonome_isolé": "L'Autonome Isolé",
    };
    
    // Extraire les vraies données du questionnaire
    const energie = equilibreValues.energie || 50;
    const sante = equilibreValues.sante || 50;
    const soi = equilibreValues.soi || 50;
    const temps = equilibreValues.temps || 50;
    const finances = equilibreValues.finances || 50; // Données financières RÉELLES du questionnaire
    const soutien = equilibreValues.soutien || 50;
    const famille = equilibreValues.famille || 50;
    const reseau = environnement.reseau || 50;
    
    // ========== PROMPT ALLÉGÉ POUR TEMPS DE RÉPONSE ULTRA-RAPIDE ==========
    const systemPrompt = `Vous êtes un COACH EXPERT SENIOR en entrepreneuriat ET un éditeur littéraire rigoureux.

🎯 TON PEER-TO-PEER (CRITIQUE) :
- Votre ton est DIRECT, PROFESSIONNEL et EMPATHIQUE, jamais obséquieux.
- Parlez comme un PAIR ENTREPRENEUR EXPÉRIMENTÉ, pas comme un support client ou un assistant servile.
- Allez DROIT AU BUT sans phrases de remplissage.

🚫 INTERDICTIONS FORMELLES :
- NE DITES JAMAIS : "C'est une excellente question", "Je suis ravi", "Félicitations", "Bravo"
- Pas de flatteries, pas de formules creuses, pas de ton servile
- Pas de phrases vides ou de politesses excessives

RÈGLES DE RÉDACTION ABSOLUES :
- Relisez chaque phrase avant de l'écrire. INTERDICTION des syntaxes brisées.
- Faites des phrases courtes, fluides et élégantes.
- Ton : direct, concret, professionnel, toujours en vouvoiement.
- N'utilisez JAMAIS "Madame/Monsieur". Adressez-vous directement avec "vous".
- Aucun score, chiffre ou pourcentage ne doit apparaître dans la sortie.
- Citez ponctuellement des éléments du texte libre pour montrer que vous avez vraiment lu la personne.
- Vous ne parlez que de la POSTURE de la personne, jamais de marché ou de business.

⚠️ INTERDICTION STRICTE DE TERMES SCIENTIFIQUES :
- NE MENTIONNEZ JAMAIS : "RIASEC", "Big Five", "Schwartz", "profil", "dimension", "score", "test psychométrique"
- Utilisez un langage NATUREL et HUMAIN, pas de jargon technique.
- Parlez des "appétences", "préférences naturelles", "inclinations" au lieu de scores.

RÉALISME LOGISTIQUE (CRITIQUE) :
- Adaptez l'ambition de vos conseils à la LOGISTIQUE RÉELLE (situation pro + temps disponible).
- Si "Salarié + <10h/semaine" : proposez des BABY STEPS, des actions de 30min max.
- Ne demandez JAMAIS l'impossible par rapport au temps déclaré.

NUANCE FINANCES (IMPORTANT) :
- Si les finances sont < 40/100, ne dites JAMAIS "c'est mort" ou "impossible".
- Préférez : "approche bootstrap requise", "créativité financière nécessaire".
- Soyez un TREMPLIN, pas un mur.

⚠️ RÈGLE CRITIQUE POUR cap2_4semaines :
- Rédigez une phrase COMPLÈTE et LITTÉRALE sans aucune variable ni placeholder.
- NE JAMAIS écrire "sur la base de X h disponibles" ou "des actions de X minutes".
- Écrivez directement le cap en langage naturel, par exemple : "Identifier trois pistes de projet qui vous attirent et noter pour chacune ce qui vous motive, sans chercher à évaluer leur faisabilité."
- Le cap doit être AUTONOME et lisible tel quel, sans besoin de substitution.

Format de sortie STRICT en JSON :
{
  "persona_profil": {
    "titre": "${personaTitres[personaId] || "Profil Entrepreneurial"}",
    "personaId": "${personaId}",
    "synthese": "2 à 3 phrases maximum, très personnalisées, qui résument la situation actuelle de cette personne.",
    "forces": ["Force concrète 1", "Force concrète 2", "Force concrète 3"],
    "verrous": ["Frein principal 1", "Frein principal 2", "Frein principal 3"],
    "cap2_4semaines": "Un seul cap réaliste atteignable en 2 à 4 semaines, rédigé en phrase complète sans variables ni placeholders.",
    "gardeFou": "Point de vigilance principal à garder en tête."
  }
}`;

    // Mapping situation pro
    const situationProLabels: Record<string, string> = {
      "salarie": "Salarié(e) en poste",
      "chomage": "En recherche d'emploi / Chômage",
      "independant": "Indépendant / Freelance",
      "etudiant": "Étudiant(e)",
      "retraite": "Retraité(e)",
      "transition": "En transition professionnelle",
    };
    
    // Mapping temps consacré
    const tempsLabels: Record<string, string> = {
      "soirwe": "Soirs et week-ends (<10h/semaine)",
      "mitemps": "Mi-temps (~20h/semaine)",
      "pleintemps": "Plein temps (35h+/semaine)",
    };
    
    const situationProLabel = situationProLabels[situationPro] || situationPro || "Non précisé";
    const tempsConsacreLabel = tempsLabels[tempsConsacre] || tempsConsacre || "Non précisé";

    const userPrompt = `Voici les données d'une personne à analyser :

SITUATION ACTUELLE ET DISPONIBILITÉ (CRUCIAL POUR CALIBRER LES CONSEILS) :
- Situation professionnelle : ${situationProLabel}
- Temps consacré au projet : ${tempsConsacreLabel}
→ ADAPTEZ L'AMBITION DE VOS CONSEILS À CETTE RÉALITÉ LOGISTIQUE.

RÉSERVOIRS DE VIE (0-100) :
- Énergie globale : ${equilibreValues.energie ?? 50}
- Santé : ${equilibreValues.sante ?? 50}
- Temps disponible : ${equilibreValues.temps ?? 50}
- Finances personnelles : ${equilibreValues.finances ?? 50}
- Soutien / entourage : ${equilibreValues.soutien ?? 50}
- Famille / responsabilités : ${equilibreValues.famille ?? 50}
- Réseau professionnel : ${reseau}

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

MOTIVATIONS PRINCIPALES : ${motivations.join(" | ") || "non renseigné"}

CAUSES QUI TOUCHENT L'UTILISATEUR (Sens / Impact) : ${causesEngagees && causesEngagees.length > 0 ? causesEngagees.join(" | ") : "non renseigné"}
→ Si des causes sont renseignées, intégrez-les dans la synthèse pour personnaliser (ex: "Votre sensibilité à l'Environnement...").

COMPORTEMENTS (scénarios bruts) : ${JSON.stringify(scenarioAnswers)}

PERSONA DÉTECTÉ : ${personaTitres[personaId] || personaId}

TEXTE LIBRE (contexte de vie, ressenti, doutes éventuels) :
"""
${champsLibre || "(aucun texte libre fourni)"}
"""

Consignes essentielles :
- CALIBREZ vos conseils sur la situation pro + temps disponible. Salarié + soirs/WE = baby steps uniquement.
- Analysez le profil RIASEC et les compétences (CV) pour nuancer le portrait.
- Utilisez le texte libre pour colorer votre analyse (citer 1 ou 2 éléments max).
- Si contradiction entre les chiffres et le texte, mentionnez-la avec douceur.
- Les forces doivent valoriser des ressources réelles.
- Les verrous doivent pointer des freins humains précis.
- Le cap sur 2–4 semaines doit être UN objectif simple et RÉALISTE PAR RAPPORT AU TEMPS DISPONIBLE.

Générez UNIQUEMENT le JSON décrit dans le système, rien d'autre.`;

    // ⚡ PARALLÉLISME : Lancer texte (profil) et image en même temps
    console.log('⚡ Starting parallel generation: text + image');
    
    const textPromise = fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const imagePromise = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-persona-visual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personaId,
        equilibreValues,
        motivations,
        riasecScores: null,
        schwartzValues: null,
        ideaTitle: null,
        ideaDescription: null,
        champsLibre
      })
    });

    // ⚡ ATTENDRE LES DEUX EN PARALLÈLE
    const [aiResponse, visualResponse] = await Promise.all([textPromise, imagePromise]);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const parsedProfile = JSON.parse(aiData.choices[0].message.content);
    
    console.log('✅ Profile text generated');

    // 🚫 Filet de sécurité anti-scores
    const stripNumbers = (text: string | null | undefined): string => {
      if (!text) return '';
      return text
        .replace(/\d+\s*\/\s*\d+/g, '')
        .replace(/\d+\s*%/g, '')
        .replace(/\d+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    // 🛡️ FILET DE SÉCURITÉ POST-GÉNÉRATION : Anti-hallucinations basé sur les scores réels
    const stripHallucinations = (text: string | null | undefined, scores: {
      finances?: number;
      temps?: number;
      energie?: number;
      soutien?: number;
      reseau?: number;
    }): string => {
      if (!text) return '';
      let sanitized = text;
      
      // 💰 FINANCES : Si score > 70, supprimer les mots-clés de contrainte financière
      if ((scores.finances ?? 50) > 70) {
        const financialConstraintPatterns = [
          /budget\s*serré/gi,
          /économies?\s*(limitées?|restreintes?|faibles?)/gi,
          /manque\s*de\s*moyens?/gi,
          /contraintes?\s*financières?/gi,
          /ressources?\s*financières?\s*(limitées?|restreintes?|insuffisantes?)/gi,
          /difficultés?\s*financières?/gi,
          /finances?\s*(serrées?|tendues?|difficiles?)/gi,
          /capital\s*limité/gi,
          /investissement\s*limité/gi,
          /moyens?\s*limités?/gi,
          /finances?\s*fragiles?/gi,
        ];
        for (const pattern of financialConstraintPatterns) {
          sanitized = sanitized.replace(pattern, 'situation financière stable');
        }
      }
      
      // ⏰ TEMPS : Si score > 70, supprimer les mots-clés de manque de temps
      if ((scores.temps ?? 50) > 70) {
        const timeConstraintPatterns = [
          /manque\s*de\s*temps/gi,
          /temps\s*(serré|limité|insuffisant)/gi,
          /bande\s*passante\s*(limitée|réduite)/gi,
          /agenda\s*(surchargé|plein|saturé)/gi,
        ];
        for (const pattern of timeConstraintPatterns) {
          sanitized = sanitized.replace(pattern, 'temps disponible');
        }
      }
      
      // ⚡ ÉNERGIE : Si score > 70, supprimer les mots-clés de fatigue
      if ((scores.energie ?? 50) > 70) {
        const energyConstraintPatterns = [
          /fatigue\s*(chronique|importante)?/gi,
          /épuisement/gi,
          /énergie\s*(basse|faible|limitée)/gi,
          /manque\s*d['']énergie/gi,
        ];
        for (const pattern of energyConstraintPatterns) {
          sanitized = sanitized.replace(pattern, 'bonne énergie');
        }
      }
      
      // 👥 SOUTIEN : Si score > 70, supprimer les mots-clés d'isolement
      if ((scores.soutien ?? 50) > 70) {
        const supportConstraintPatterns = [
          /isolement/gi,
          /manque\s*de\s*soutien/gi,
          /seul\s*face\s*à/gi,
          /sans\s*soutien/gi,
          /entourage\s*(absent|limité)/gi,
        ];
        for (const pattern of supportConstraintPatterns) {
          sanitized = sanitized.replace(pattern, 'soutien présent');
        }
      }
      
      return sanitized.replace(/\s{2,}/g, ' ').trim();
    };

    const rawPersona = parsedProfile.persona_profil || {};
    
    // Scores réels pour le filet anti-hallucinations
    const realScores = {
      finances: equilibreValues?.finances ?? 50,
      temps: equilibreValues?.temps ?? 50,
      energie: equilibreValues?.energie ?? 50,
      soutien: equilibreValues?.soutien ?? 50,
      reseau: environnement?.reseau ?? 50,
    };

    // 🚨 POST-TRAITEMENT VOUVOIEMENT : Garantir "Zéro Tu" sur tous les textes
    const sanitizedPersona = {
      titre: enforceVouvoiement(stripNumbers(rawPersona.titre)),
      personaId: rawPersona.personaId,
      synthese: enforceVouvoiement(stripHallucinations(stripNumbers(rawPersona.synthese), realScores)),
      forces: Array.isArray(rawPersona.forces)
        ? rawPersona.forces.map((f: string) => enforceVouvoiement(stripHallucinations(stripNumbers(f), realScores)))
        : [],
      verrous: Array.isArray(rawPersona.verrous)
        ? rawPersona.verrous.map((v: string) => enforceVouvoiement(stripHallucinations(stripNumbers(v), realScores)))
        : [],
      cap2_4semaines: enforceVouvoiement(stripHallucinations(stripNumbers(rawPersona.cap2_4semaines), realScores)),
      gardeFou: enforceVouvoiement(stripHallucinations(stripNumbers(rawPersona.gardeFou), realScores)),
    };

    // Extraire l'image générée en parallèle
    let personaVisualUrl = null;
    try {
      if (visualResponse.ok) {
        const visualData = await visualResponse.json();
        personaVisualUrl = visualData.imageUrl || visualData.imageUrls?.[0];
        console.log('✅ Visual generated');
      } else {
        console.error('Visual generation failed:', await visualResponse.text());
      }
    } catch (error) {
      console.error('Error extracting visual:', error);
    }

    const result = {
      ...sanitizedPersona,
      visualUrl: personaVisualUrl
    };

    console.log('✅ Profile + visual ready in ~2-3s');
    
    // Sauvegarder dans le cache pour accélérer les prochaines générations similaires (7 jours)
    console.log('💾 Saving result to cache with key:', cacheKey);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    try {
      await supabase
        .from('persona_cache')
        .upsert({
          cache_key: cacheKey,
          persona_data: result,
          expires_at: expiresAt.toISOString()
        });
      console.log('✅ Profile cached successfully');
    } catch (cacheError) {
      console.error('Cache save error (non-blocking):', cacheError);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
