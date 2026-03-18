import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { mapZoneToFrein, selectJournalQuestions, type AlpactFrein } from "../_shared/journalQuestionsLibrary.ts";
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { enforceVouvoiement } from "../_shared/enforceVouvoiement.ts";
import { getAuthenticatedUser, verifyOwnership, unauthorizedResponse } from "../_shared/authGuard.ts";
import { sanitizeForPrompt, wrapUserInput } from "../_shared/sanitize.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

// Types for simplified AI response
interface BilanAlignement {
  score_global: number;
  details: {
    energie: number;
    temps: number;
    finances: number;
    soutien: number;
    competences: number;
    motivation: number;
  };
  explications_jauges?: {
    explication_energie?: string;
    explication_temps?: string;
    explication_finances?: string;
    explication_soutien?: string;
    explication_competences?: string;
    explication_motivation?: string;
  };
}

interface ZoneAttention {
  label: string;
  niveau: 'critique' | 'attention';
  explication: string;
}

interface MicroAction {
  label: string;
  objectif: string;
  duree: string;
  impact_attendu: string;
  jauge_ciblee: 'energie' | 'temps' | 'finances' | 'soutien' | 'competences' | 'motivation';
}

interface JournalQuestion {
  question: string;
  objectif: string;
}

interface AstrydAnalysisResult {
  bilan_alignement: BilanAlignement;
  zones_attention: ZoneAttention[];
  micro_actions: MicroAction[];
  journal_questions: JournalQuestion[];
  cap2_4semaines: string;
  recommandation_finale: 'GO' | 'KEEP' | 'PIVOT' | 'STOP';
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 3 requests per minute per IP (expensive operation)
  const clientId = getClientIdentifier(req);
  const isAllowed = await checkRateLimit(clientId, "astryd-analyse", 3, 1);
  if (!isAllowed) {
    console.warn(`🚫 Rate limit exceeded for ${clientId}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    // 🔒 SÉCU 3: Verify JWT and ownership
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return unauthorizedResponse(corsHeaders);
    }

    const { ideaId, userId, personaData } = await req.json();
    
    // Verify the userId from body matches the JWT user
    if (userId) {
      const ownershipError = verifyOwnership(authUser.id, userId, corsHeaders);
      if (ownershipError) return ownershipError;
    }
    
    console.log('━━━ ASTRYD_ANALYSE - START ━━━');
    console.log('→ ideaId:', ideaId);
    console.log('→ userId (verified):', authUser.id);
    console.log('→ personaData received:', personaData ? 'YES' : 'NO');
    if (personaData) {
      console.log('→ personaData.titre:', personaData.titre);
    }
    
    if (!ideaId) {
      throw new Error('ideaId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const user = { id: authUser.id };
    
    console.log('→ Fetching idea...');
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      throw new Error('Idea not found');
    }

    // Fetch user assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError || !assessment) {
      throw new Error('Assessment not found');
    }

    // Fetch all assessment data
    const { data: schwartz } = await supabase
      .from('schwartz_values')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const { data: bigFive } = await supabase
      .from('big_five_traits')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const { data: riasec } = await supabase
      .from('riasec_scores')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const { data: lifeSpheres } = await supabase
      .from('life_spheres')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const { data: context } = await supabase
      .from('user_context')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    const { data: learningProfile } = await supabase
      .from('user_learning_profiles')
      .select('*')
      .eq('assessment_id', assessment.id)
      .maybeSingle();

    // Fetch idea documents
    const { data: ideaDocuments } = await supabase
      .from('idea_documents')
      .select('parsed_content, file_name')
      .eq('idea_id', ideaId);

    const documentsSummaries = ideaDocuments?.map(doc => 
      doc.parsed_content || `Document: ${doc.file_name}`
    ) || [];

    // Fetch journal entries (last 6)
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
      .limit(6);

    // Fetch micro-commitments completed
    const { data: completedCommitments } = await supabase
      .from('micro_commitments')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('status', 'done');

    // Log les données RIASEC et CV récupérées depuis la base
    console.log('→ RIASEC scores from DB:', riasec ? {
      realiste: riasec.realiste,
      investigateur: riasec.investigateur,
      artistique: riasec.artistique,
      social: riasec.social,
      entreprenant: riasec.entreprenant,
      conventionnel: riasec.conventionnel
    } : 'NOT FOUND');
    console.log('→ CV/Learning profile from DB:', learningProfile ? {
      cv_insights: learningProfile.cv_insights ? 'PRESENT' : 'EMPTY',
      cv_uploaded: learningProfile.cv_uploaded
    } : 'NOT FOUND');
    
    console.log('→ Building payload...');
    console.log('→ Model: google/gemini-2.5-flash');
    
    // System prompt with enhanced quality and personalization
    const systemPrompt = `Tu es Astryd, coach entrepreneurial expert en posture et alignement projet-personne.

═══════════════════════════════
MISSION & TON
═══════════════════════════════

Tu analyses l'alignement entre un projet entrepreneurial et la personne qui le porte.

TON & STYLE :
- Utilise TOUJOURS le tutoiement ("tu")
- Ton : bienveillant, lucide, direct mais non jugeant
- Français impeccable : accents corrects (é, è, à, ç), apostrophes propres (l'idée, l'entrepreneuriat)
- Aucun texte en anglais, aucune séquence d'échappement JSON visible (\', &apos;)
- Coach de POSTURE, pas de stratégie marketing ni business plan
- Focus : énergie, temps, finances perso, soutien, compétences, motivation, passage à l'action

═══════════════════════════════
DONNÉES FOURNIES
═══════════════════════════════

- Valeurs Schwartz (10 valeurs, échelle 0-100)
- Big Five (5 traits de personnalité, échelle 0-100)
- RIASEC (6 types professionnels, échelle 0-100)
- Sphères de vie (6 dimensions : pro, couple, amis, famille, loisirs, soi - échelle 0-100)
- Contexte personnel (situation, ressources, contraintes)
- Documents projet (si disponibles)
- Historique journal & micro-actions (si existant)

═══════════════════════════════
STRUCTURE JSON ATTENDUE
═══════════════════════════════

{
  "bilan_alignement": {
    "score_global": integer (0-100, pas de décimales),
    "details": {
      "energie": integer (0-100, pas de décimales),
      "temps": integer (0-100, pas de décimales),
      "finances": integer (0-100, pas de décimales),
      "soutien": integer (0-100, pas de décimales),
      "competences": integer (0-100, pas de décimales),
      "motivation": integer (0-100, pas de décimales)
    },
    "explications_jauges": {
      "explication_energie": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques),
      "explication_temps": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques),
      "explication_finances": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques),
      "explication_soutien": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques),
      "explication_competences": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques),
      "explication_motivation": string (15-25 mots, langage simple, concret, sans chiffres ni termes techniques)
    }
  },
  "zones_attention": [
    {
      "label": string (court, concret, ex: "Énergie vitale critique"),
      "niveau": "critique" | "attention",
      "explication": string (3-5 phrases max, personnalisées, voir règles ci-dessous)
    }
  ],
  "micro_actions": [
    {
      "label": string (verbe d'action clair, ex: "Faire ton audit d'énergie personnel"),
      "objectif": string (ce que ça t'apporte intérieurement),
      "duree": string (ex: "15 min", "20 min"),
      "impact_attendu": string (bénéfice concret et personnalisé),
      "jauge_ciblee": "energie" | "temps" | "finances" | "soutien" | "competences" | "motivation"
    }
  ],
  "journal_questions": [
    {
      "question": string (tutoiement, personnalisée),
      "objectif": string (pourquoi cette question aide)
    }
  ],
  "cap2_4semaines": string (objectif personnalisé court, 15-25 mots, centré sur la posture et l'équilibre),
  "recommandation_finale": "GO" | "KEEP" | "PIVOT" | "STOP"
}

═══════════════════════════════
RÈGLES DE PERSONNALISATION
═══════════════════════════════

IMPÉRATIF : Chaque zone d'attention et micro-action DOIT être visiblement liée :
1. Au NOM du projet (référence explicite au titre)
2. À la SITUATION de la personne en LANGAGE SIMPLE (ex: "ton énergie est très basse", "tes finances sont justes")
3. Aux motivations profondes détectées (SANS mentionner Schwartz, RIASEC, Big5)

⚠️ Si certaines données sont manquantes (ex: Big Five ou RIASEC non fournis), ne les analyse PAS.
✅ Base-toi UNIQUEMENT sur les données réellement fournies par la personne.

🚨 INTERDICTION ABSOLUE - AUCUN SCORE NUMÉRIQUE 🚨
⚠️ Tu VOIS des scores dans les données JSON (0-100), mais tu dois les TRADUIRE en LANGAGE HUMAIN dans tes explications
⚠️ JAMAIS de mention de chiffres, pourcentages, fractions (ex: "7/100", "51/100", "60%", "Q0B")
⚠️ JAMAIS de mention RIASEC, Big Five, Schwartz, "profil", "dimension", "alignement calculé"
⚠️ JAMAIS de terme technique ou jargon psychométrique
✅ Utilise UNIQUEMENT des formulations qualitatives SIMPLES et CONCRÈTES :
- "très bas", "critique", "insuffisant", "presque vide" (scores < 30)
- "faible", "juste", "limité", "fragile" (scores 30-50)
- "moyen", "acceptable", "correct" (scores 50-70)
- "bon", "solide", "fort", "élevé" (scores 70-85)
- "excellent", "très élevé", "plein", "robuste" (scores > 85)

🔴 VÉRIFICATION AVANT RÉPONSE : Relis CHAQUE explication et supprime TOUS les chiffres/scores

ÉVITE ABSOLUMENT les formulations génériques :
❌ "Clarifiez vos motivations personnelles"
❌ "Définissez vos priorités"
❌ "Prenez soin de vous"

PRIVILÉGIE les formulations personnalisées SANS SCORES NI JARGON :
✅ "Pour 'Fynance Club Deal', tu vas devoir parler argent souvent. Or tes finances perso sont justes : on va sécuriser ça avant d'accélérer."
✅ "Ton niveau d'énergie est critique : si tu te lances comme ça, chaque obstacle va te sembler énorme. On commence par reconstruire ton réservoir d'énergie."
✅ "Tu aimes beaucoup le contact humain et la créativité. Dans ce projet, il faudra que tu trouves un moyen d'exprimer ça, sinon tu vas t'éteindre en route."

═══════════════════════════════
ZONES D'ATTENTION - RÈGLES
═══════════════════════════════

Pour chaque zone d'attention :
- Structure : 3-5 phrases max
- Spécificité : description qualitative de la situation ET lien au projet
- Lisibilité : pas de jargon psy, rester concret
- JAMAIS de scores numériques, JAMAIS de mention RIASEC/Big5/Schwartz, JAMAIS de jargon technique
- Parle de SA VIE RÉELLE, pas de son "profil" ou ses "scores"

Format attendu :
1. Ce que la situation dit de la personne (qualitativement)
2. Pourquoi c'est un verrou pour CE projet précis
3. Ce que ça risque de provoquer si on ne fait rien

Exemple :
{
  "label": "Énergie vitale critique",
  "niveau": "critique",
  "explication": "Ton niveau d'énergie est très bas en ce moment. Lancer 'Fynance Club Deal' dans cet état, c'est comme partir en randonnée avec une batterie presque vide. Tu risques de te décourager vite, de remettre à plus tard les tâches importantes et d'associer ce projet à de la fatigue plutôt qu'à de l'élan. On va d'abord sécuriser ton énergie avant de te mettre en première ligne."
}

Critères de niveau :
- "critique" : score < 30
- "attention" : score 30-50

═══════════════════════════════
MICRO-ACTIONS - RÈGLES STRICTES
═══════════════════════════════

🔴 PÉRIMÈTRE ASTRYD — COACHING DE POSTURE UNIQUEMENT :
✅ AUTORISÉ : énergie, clarté, charge mentale, confiance, passage à l'action, soutien
🚫 INTERDIT : analyse de marché, concurrence, pricing, stratégie produit/marketing
🚫 INTERDIT : références médicales ou psychologiques (médecin, psy, 3114)
🚫 INTERDIT : actions qui appartiennent à un consultant business

🔢 NOMBRE : EXACTEMENT 5 micro-actions, PAS PLUS, PAS MOINS.

Chaque micro-action doit être :
- Ultra concrète (10-30 minutes max)
- Réalisable immédiatement
- Reliée à UNE jauge ciblée
- Écrite avec un verbe d'action clair
- 🚨 AUCUN chiffre, AUCUN pourcentage, AUCUN score visible
- AUCUNE mention RIASEC/Big5/Schwartz, AUCUN jargon technique
- Parle d'ACTIONS CONCRÈTES : "Bloque 2h samedi", "Appelle ton ami X"

🔴 Exemples INTERDITS :
❌ "Rechercher des stratégies de pricing concurrentes"
❌ "Analyser les changements du marché"
❌ "Contacter un professionnel de santé"
❌ "Vu ton score de 35/100 en énergie"

✅ Exemples CORRECTS (posture coaching) :
{
  "label": "Faire ton mini-audit d'énergie",
  "objectif": "Identifier ce qui te vide et ce qui te recharge vraiment dans tes journées.",
  "duree": "15 min",
  "impact_attendu": "Tu sauras sur quoi dire non pour protéger ton énergie.",
  "jauge_ciblee": "energie"
}

PRÉFÈRE :
✅ "Écrire ton 'pourquoi profond' en 10 lignes pour ce projet"
✅ "Réserver deux créneaux dans la semaine où tu as le plus d'énergie"
✅ "Identifier 1 personne de confiance à qui parler de ton projet cette semaine"

═══════════════════════════════
EFFET "WOW" PREMIÈRE ANALYSE
═══════════════════════════════

Dès la première génération (même sans historique journal) :
- Fais référence à AU MOINS 2-3 éléments concrets du profil (scores, contraintes, valeurs)
- ET AU MOINS 1 élément concret de l'idée (nature, public, complexité)
- Dans CHAQUE zone d'attention ET micro-action

Le sentiment recherché : "OK, Astryd a vraiment lu mon profil et mon idée."

CALCUL DES SCORES
═══════════════════════════════

score_global = moyenne pondérée des 6 jauges
Jauges (0-100) : énergie, temps, finances, soutien, compétences, motivation

Base le calcul sur :
- Sphères de vie (indicateur d'équilibre général)
- Contexte personnel (ressources, contraintes)
- Big5, Schwartz, RIASEC (indicateurs de fit profond)

═══════════════════════════════
OBJECTIF 2-4 SEMAINES
═══════════════════════════════

Génère un objectif personnalisé court (15-25 mots max) qui reflète :
- LA priorité absolue pour cette personne (pas le projet, LA PERSONNE)
- Ce sur quoi elle doit travailler EN PREMIER pour renforcer sa posture
- Le ton : bienveillant, direct, coach entrepreneurial

Exemples :
✅ "Priorité absolue : reconstruire votre base énergétique et humaine."
✅ "Sécuriser vos finances personnelles avant d'accélérer sur votre projet."
✅ "Créer votre premier espace-temps hebdomadaire dédié pour avancer sereinement."
✅ "Identifier et mobiliser 2-3 personnes de confiance autour de vous."

❌ PAS "Valider votre idée" ou "Trouver vos premiers clients" (ça c'est Mona Lysa)
❌ PAS trop long ni abstrait

═══════════════════════════════
RECOMMANDATION FINALE
═══════════════════════════════

- "GO" : score > 65, peu de zones critiques, prêt·e à lancer
- "KEEP" : score 50-65, quelques zones à travailler, garder l'idée en incubation
- "PIVOT" : score 35-50, plusieurs zones critiques, reformuler ou adapter le projet
- "STOP" : score < 35, alignement trop faible, mieux vaut explorer autre chose

Réponds STRICTEMENT en JSON, sans texte avant ou après.`;

    // 🔒 SÉCU 7: Sanitize user inputs before injecting into prompts
    const sanitizedTitle = sanitizeForPrompt(idea.title, 200);
    const sanitizedDescription = sanitizeForPrompt(idea.description || "", 2000);
    const sanitizedDocuments = documentsSummaries.map(d => sanitizeForPrompt(d, 3000));

    const userPrompt = `Analyse ce projet entrepreneurial :

PROJET :
Titre : ${wrapUserInput('TITRE', sanitizedTitle, 200)}
Description : ${wrapUserInput('DESCRIPTION', sanitizedDescription, 2000)}
Documents : ${sanitizedDocuments.length > 0 ? sanitizedDocuments.join('\n\n') : "Aucun"}

PROFIL PSYCHOLOGIQUE :
Schwartz (0-100) : ${schwartz ? JSON.stringify(schwartz, null, 2) : "Non renseigné"}
Big Five (0-100) : ${bigFive ? JSON.stringify(bigFive, null, 2) : "Non renseigné"}
RIASEC (0-100) : ${riasec ? JSON.stringify(riasec, null, 2) : "Non renseigné"}

ÉQUILIBRE DE VIE (0-100) :
${lifeSpheres ? JSON.stringify(lifeSpheres, null, 2) : "Non renseigné"}

CONTEXTE PERSONNEL :
${context ? JSON.stringify(context, null, 2) : "Non renseigné"}

PROGRESSION :
- Journal : ${journalEntries?.length || 0} entrées
- Micro-actions complétées : ${completedCommitments?.length || 0}

Réponds UNIQUEMENT avec le JSON structuré attendu.`;

    // Call Lovable AI
    let aiResponse: AstrydAnalysisResult;
    try {
      console.log('→ Sending request to Lovable AI...');
      console.log('→ System prompt length:', systemPrompt.length);
      console.log('→ User prompt length:', userPrompt.length);
      
      const aiApiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      if (!aiApiResponse.ok) {
        const errorText = await aiApiResponse.text();
        console.error('━━━ AI API ERROR ━━━');
        console.error('→ Status:', aiApiResponse.status);
        console.error('→ Error body:', errorText);
        throw new Error(`AI API failed with status ${aiApiResponse.status}: ${errorText}`);
      }

      const aiData = await aiApiResponse.json();
      console.log('→ AI response received');
      
      let rawContent = aiData.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('No content in AI response');
      }

      console.log('→ Raw AI content (first 500 chars):', rawContent.substring(0, 500));
      
      // Clean and parse AI JSON response
      // Remove any markdown code blocks if present
      rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse, with fallback error handling
      try {
        aiResponse = JSON.parse(rawContent) as AstrydAnalysisResult;
      } catch (parseError) {
        console.error('━━━ JSON PARSE ERROR ━━━');
        console.error('→ Parse error:', parseError);
        console.error('→ Attempting to extract valid JSON...');
        
        // Try to extract JSON from the response
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]) as AstrydAnalysisResult;
            console.log('→ Successfully extracted and parsed JSON from response');
          } catch (extractError) {
            console.error('→ Extraction also failed:', extractError);
            console.error('→ Full raw content:', rawContent);
            throw new Error('Failed to parse AI response as valid JSON');
          }
        } else {
          console.error('→ No JSON structure found in response');
          console.error('→ Full raw content:', rawContent);
          throw new Error('No valid JSON found in AI response');
        }
      }
      
      // Validate and set defaults
      if (!aiResponse.bilan_alignement) {
        aiResponse.bilan_alignement = {
          score_global: 50,
          details: { energie: 50, temps: 50, finances: 50, soutien: 50, competences: 50, motivation: 50 }
        };
      }
      
      aiResponse.bilan_alignement.details = {
        energie: aiResponse.bilan_alignement.details?.energie ?? 50,
        temps: aiResponse.bilan_alignement.details?.temps ?? 50,
        finances: aiResponse.bilan_alignement.details?.finances ?? 50,
        soutien: aiResponse.bilan_alignement.details?.soutien ?? 50,
        competences: aiResponse.bilan_alignement.details?.competences ?? 50,
        motivation: aiResponse.bilan_alignement.details?.motivation ?? 50
      };
      
      aiResponse.zones_attention = aiResponse.zones_attention || [];
      aiResponse.micro_actions = aiResponse.micro_actions || [];
      
      // Validation : forcer minimum 3 zones et 3 micro-actions
      if (aiResponse.zones_attention.length < 3) {
        console.log('→ ⚠️ WARNING: AI returned less than 3 zones, forcing generation of default zones');
        aiResponse.zones_attention = [
          ...aiResponse.zones_attention,
          {
            label: "Clarté du projet insuffisante",
            niveau: "attention" as const,
            explication: "Votre projet manque encore de précision. Prenez le temps de détailler votre audience cible, votre proposition de valeur et vos premières étapes concrètes."
          }
        ];
      }
      
      if (aiResponse.micro_actions.length < 3) {
        console.log('→ ⚠️ WARNING: AI returned less than 3 micro-actions, forcing generation of default actions');
        aiResponse.micro_actions = [
          ...aiResponse.micro_actions,
          {
            label: "Écrire en 10 lignes votre 'pourquoi' profond pour ce projet",
            objectif: "Clarifier votre motivation intrinsèque",
            duree: "15 min",
            impact_attendu: "Vous saurez pourquoi vous portez cette idée",
            jauge_ciblee: "motivation" as const
          }
        ];
      }
      
      // 🔒 CAP STRICT : maximum 5 micro-actions (règle produit Astryd)
      if (aiResponse.micro_actions.length > 5) {
        console.log(`→ ⚠️ Capping micro-actions from ${aiResponse.micro_actions.length} to 5`);
        aiResponse.micro_actions = aiResponse.micro_actions.slice(0, 5);
      }
      
      // Enrichir les questions de journal avec la bibliothèque
      const freinsIdentifies: AlpactFrein[] = aiResponse.zones_attention
        .sort((a, b) => (b.niveau === 'critique' ? 3 : 2) - (a.niveau === 'critique' ? 3 : 2))
        .map(zone => mapZoneToFrein(zone.label))
        .filter((frein, index, self) => self.indexOf(frein) === index)
        .slice(0, 3);
      
      if (Array.isArray(aiResponse.journal_questions) && aiResponse.journal_questions.length > 0) {
        // L'IA a fourni des questions, les utiliser
        aiResponse.journal_questions = aiResponse.journal_questions.slice(0, 3);
      } else {
        // Utiliser la bibliothèque de questions personnalisées
        const selectedQuestions = selectJournalQuestions(
          freinsIdentifies.length > 0 ? freinsIdentifies : ["clarte"],
          aiResponse.bilan_alignement.details.motivation
        );
        aiResponse.journal_questions = selectedQuestions.map(q => ({ 
          question: q,
          objectif: "Réflexion guidée pour clarifier votre posture entrepreneuriale"
        }));
      }
      
      // Fallback si toujours vide
      if (aiResponse.journal_questions.length === 0) {
        aiResponse.journal_questions = [
          { question: "Qu'as-tu appris sur toi cette semaine en avançant sur ce projet ?", objectif: "Introspection" },
          { question: "Sur 10, ton niveau d'énergie aujourd'hui quand tu penses à cette idée, et que peux-tu faire pour gagner +1 point ?", objectif: "Auto-évaluation énergie" },
          { question: "Si tu enlèves la peur pendant 5 minutes, quelle décision prendrais-tu à propos de ce projet ?", objectif: "Clarification décision" }
        ];
      }
      
      aiResponse.recommandation_finale = aiResponse.recommandation_finale || 'KEEP';
      
      console.log('→ AI response parsed successfully');
      console.log('→ Score global:', aiResponse.bilan_alignement.score_global);
      console.log('→ Details:', JSON.stringify(aiResponse.bilan_alignement.details));
      console.log('→ Zones attention count:', aiResponse.zones_attention.length);
      console.log('→ Micro actions count:', aiResponse.micro_actions.length);
      console.log('→ Journal questions count:', aiResponse.journal_questions.length);
      console.log('→ Freins identifiés:', freinsIdentifies.join(', '));
      
    } catch (error) {
      console.error('━━━ AI CALL FAILED ━━━');
      console.error('→ Error:', error);
      throw error;
    }

    // Insert alignment scores
    console.log('→ Inserting alignment scores...');
    const { error: alignmentError } = await supabase
      .from('alignment_scores')
      .insert({
        user_id: user.id,
        idea_id: ideaId,
        score_global: Math.round(aiResponse.bilan_alignement.score_global),
        details: {
          energie: Math.round(aiResponse.bilan_alignement.details.energie),
          temps: Math.round(aiResponse.bilan_alignement.details.temps),
          finances: Math.round(aiResponse.bilan_alignement.details.finances),
          soutien: Math.round(aiResponse.bilan_alignement.details.soutien),
          competences: Math.round(aiResponse.bilan_alignement.details.competences),
          motivation: Math.round(aiResponse.bilan_alignement.details.motivation),
          explications_jauges: aiResponse.bilan_alignement.explications_jauges || {}
        }
      });

    if (alignmentError) {
      console.error('→ Alignment scores insertion error:', alignmentError);
      throw alignmentError;
    }
    console.log('→ Alignment scores inserted');

    // Initialize/update maturity score with the new alignment score
    console.log('→ Initializing maturity score...');
    const { error: maturityError } = await supabase.functions.invoke('update-maturity', {
      body: {
        ideaId,
        actionType: 'initial',
        progressionPoints: 0
      }
    });
    
    if (maturityError) {
      console.error('→ Maturity score initialization error:', maturityError);
    } else {
      console.log('→ Maturity score initialized');
    }

    // Delete old attention zones for this idea
    await supabase
      .from('attention_zones')
      .delete()
      .eq('idea_id', ideaId)
      .eq('user_id', user.id);

    // Insert new attention zones with DEDUPLICATION + HARD CAP
    const MAX_ACTIVE_ZONES = 7;
    if (aiResponse.zones_attention.length > 0) {
      console.log(`→ Inserting attention zones (max ${MAX_ACTIVE_ZONES}, with dedup)...`);
      
      const insertedLabels: string[] = [];
      let insertedCount = 0;

      for (const zone of aiResponse.zones_attention) {
        if (insertedCount >= MAX_ACTIVE_ZONES) {
          console.log(`⏭️ Hard cap reached (${MAX_ACTIVE_ZONES}), skipping remaining zones`);
          break;
        }

        // Deduplication: check against already inserted labels
        const normalizedLabel = zone.label.toLowerCase().trim();
        const isDuplicate = insertedLabels.some(existing => 
          existing === normalizedLabel || 
          existing.includes(normalizedLabel) || 
          normalizedLabel.includes(existing)
        );

        if (isDuplicate) {
          console.log(`⏭️ Zone dupliquée ignorée: "${zone.label}"`);
          continue;
        }

        const { error } = await supabase
          .from('attention_zones')
          .insert({
            user_id: user.id,
            idea_id: ideaId,
            label: zone.label,
            severity: zone.niveau === 'critique' ? 3 : 2,
            recommendation: enforceVouvoiement(zone.explication)
          });

        if (error) {
          console.error(`→ ❌ Zone insertion error for "${zone.label}":`, error);
        } else {
          insertedLabels.push(normalizedLabel);
          insertedCount++;
        }
      }
      console.log(`→ ✅ ${insertedCount} attention zones inserted (deduped from ${aiResponse.zones_attention.length})`);
    } else {
      console.log('→ ⚠️ WARNING: No attention zones to insert (AI returned empty array)');
    }

    // Archive (et non supprimer) les anciennes micro-actions 'todo' pour préserver l'historique
    // On archive TOUTES les actions actives avant d'en insérer de nouvelles
    console.log('→ Archiving old todo micro-commitments...');
    const { data: oldTodoActions } = await supabase
      .from('micro_commitments')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .or('archived.is.null,archived.eq.false')
      .neq('status', 'done');
    
    if (oldTodoActions && oldTodoActions.length > 0) {
      const archiveIds = oldTodoActions.map((a: any) => a.id);
      await supabase
        .from('micro_commitments')
        .update({ archived: true, archived_at: new Date().toISOString(), status: 'archived' })
        .in('id', archiveIds)
        .eq('user_id', user.id);
      console.log(`→ ✅ ${archiveIds.length} old actions archived`);
    }

    // Insert new micro-commitments
    if (aiResponse.micro_actions.length > 0) {
      console.log(`→ Inserting ${aiResponse.micro_actions.length} micro-commitments...`);
      const commitmentsData = aiResponse.micro_actions.map(action => ({
        user_id: user.id,
        idea_id: ideaId,
        text: action.label,
        objectif: action.objectif,
        duree: action.duree,
        impact_attendu: action.impact_attendu,
        jauge_ciblee: action.jauge_ciblee,
        status: 'todo',
        period: 'weekly'
      }));

      const { error: commitmentsError, data: insertedCommitments } = await supabase
        .from('micro_commitments')
        .insert(commitmentsData)
        .select();

      if (commitmentsError) {
        console.error('→ ❌ Micro-commitments insertion error:', commitmentsError);
        console.error('→ Failed data:', JSON.stringify(commitmentsData));
      } else {
        console.log(`→ ✅ ${insertedCommitments?.length || 0} micro-commitments inserted successfully`);
      }
    } else {
      console.log('→ ⚠️ WARNING: No micro-actions to insert (AI returned empty array)');
    }

    // Insert or update decision
    console.log('→ Upserting decision...');
    const decisionState = aiResponse.recommandation_finale;
    
    // Générer un rationale personnalisé basé sur la décision IA (pas de score ici, il sera affiché ailleurs)
    let decisionRationale = "";
    switch (decisionState) {
      case "GO":
        decisionRationale = "Ton alignement est solide et tes freins sont gérables. Tu es prêt·e à passer à l'action.";
        break;
      case "KEEP":
        decisionRationale = "Continuez d'avancer et de consolider. Votre projet est intéressant mais nécessite encore quelques ajustements.";
        break;
      case "PIVOT":
        decisionRationale = "Il est temps d'ajuster certains aspects de votre projet ou de votre posture pour mieux vous aligner.";
        break;
      case "STOP":
        decisionRationale = "Les risques personnels sont trop importants en l'état. Prenez le temps de sécuriser votre posture avant de poursuivre.";
        break;
      default:
        decisionRationale = "Continuez votre élan et consolidez progressivement.";
    }

    // Check if decision exists
    const { data: existingDecision } = await supabase
      .from('decisions')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingDecision) {
      await supabase
        .from('decisions')
        .update({
          state: decisionState,
          rationale: decisionRationale
        })
        .eq('id', existingDecision.id);
      console.log('→ Decision updated');
    } else {
      await supabase
        .from('decisions')
        .insert({
          user_id: user.id,
          idea_id: ideaId,
          state: decisionState,
          rationale: decisionRationale
        });
      console.log('→ Decision created');
    }

    // Update or create astryd_sessions
    console.log('→ Upserting astryd_sessions...');
    const maturityScore = Math.round(aiResponse.bilan_alignement.score_global);
    
    const { data: existingSession } = await supabase
      .from('astryd_sessions')
      .select('id, maturity_score_initial, journal_message_count, micro_actions_completed_count')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .maybeSingle();

    const sessionData = {
      user_id: user.id,
      idea_id: ideaId,
      idea_title: idea.title,
      idea_summary: idea.description,
      alignment_energie: Math.round(aiResponse.bilan_alignement.details.energie),
      alignment_temps: Math.round(aiResponse.bilan_alignement.details.temps),
      alignment_finances: Math.round(aiResponse.bilan_alignement.details.finances),
      alignment_support: Math.round(aiResponse.bilan_alignement.details.soutien),
      alignment_skills: Math.round(aiResponse.bilan_alignement.details.competences),
      alignment_motivation: Math.round(aiResponse.bilan_alignement.details.motivation),
      maturity_score_current: maturityScore,
      maturity_score_initial: existingSession?.maturity_score_initial ?? maturityScore,
      decision: decisionState,
      attention_zones: aiResponse.zones_attention,
      micro_actions: {
        persona_profil: personaData || null,
        actions: aiResponse.micro_actions
      },
      journal_questions: aiResponse.journal_questions,
      journal_message_count: existingSession?.journal_message_count ?? 0,
      micro_actions_completed_count: existingSession?.micro_actions_completed_count ?? 0,
      updated_at: new Date().toISOString()
    };

    if (existingSession) {
      await supabase
        .from('astryd_sessions')
        .update(sessionData)
        .eq('id', existingSession.id);
      console.log('→ astryd_sessions updated');
    } else {
      await supabase
        .from('astryd_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString()
        });
      console.log('→ astryd_sessions created');
    }

    console.log('━━━ ASTRYD_ANALYSE - SUCCESS ━━━');
    console.log('→ Final score_global:', aiResponse.bilan_alignement.score_global);
    console.log('→ Final details:', JSON.stringify(aiResponse.bilan_alignement.details));
    console.log('→ Zones inserted:', aiResponse.zones_attention.length);
    console.log('→ Actions inserted:', aiResponse.micro_actions.length);
    console.log('→ Questions:', aiResponse.journal_questions.length);
    console.log('→ Recommandation:', aiResponse.recommandation_finale);

    return new Response(
      JSON.stringify({
        success: true,
        personaData: {
          cap2_4semaines: aiResponse.cap2_4semaines || "Définir votre priorité pour avancer sereinement."
        },
        zones_attention: aiResponse.zones_attention,
        micro_actions: aiResponse.micro_actions,
        parcours: [], // Sera géré ultérieurement
        score: aiResponse.bilan_alignement.score_global,
        details: aiResponse.bilan_alignement.details,
        zones_count: aiResponse.zones_attention.length,
        actions_count: aiResponse.micro_actions.length,
        questions_count: aiResponse.journal_questions.length,
        recommandation: aiResponse.recommandation_finale
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('━━━ ASTRYD_ANALYSE - FATAL ERROR ━━━');
    console.error('→ Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
