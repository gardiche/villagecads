import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, userMessage } = await req.json();
    
    if (!userMessage) {
      throw new Error('userMessage is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 🔒 SÉCU 7: Sanitize user message before storing
    const sanitizedMessage = sanitizeForPrompt(userMessage, 3000);

    // Save user message (with optional ideaId)
    const { data: userEntry, error: userEntryError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        idea_id: ideaId || null,
        sender: 'user',
        content: sanitizedMessage,
      })
      .select()
      .single();

    if (userEntryError) {
      throw userEntryError;
    }

    // 🔒 SÉCU 12: Verify idea belongs to user if ideaId provided
    let idea = null;
    if (ideaId) {
      const { data: ideaData } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', user.id);  // 🔒 Filter by user_id
      idea = ideaData?.[0] || null;
      if (!idea) {
        console.warn(`🚫 Idea ${ideaId} not found or not owned by user ${user.id}`);
      }
    }

    // 🔒 SÉCU 12: Always filter journal by user_id
    let conversationQuery = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id);  // 🔒 Always filter by user_id
    
    if (ideaId) {
      conversationQuery = conversationQuery.eq('idea_id', ideaId);
    } else {
      conversationQuery = conversationQuery.is('idea_id', null);
    }

    const { data: conversation } = await conversationQuery.order('created_at', { ascending: true });

    // Fetch user assessment for context
    const { data: assessment } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch current attention zones and micro-actions for context
    let currentZones = [];
    let currentActions = [];
    
    if (ideaId) {
      const { data: zones } = await supabase
        .from('attention_zones')
        .select('*')
        .eq('idea_id', ideaId)
        .order('severity', { ascending: false });
      currentZones = zones || [];

      const { data: actions } = await supabase
        .from('micro_commitments')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false });
      currentActions = actions || [];
    } else {
      console.log('📝 Mode sans idée : coaching basé profil entrepreneurial uniquement');
    }

    // ========== FETCH REAL DATA FOR CONTEXT (replaces broken localStorage approach) ==========

    // 1. Fetch latest daily check-in (météo la plus récente, sans filtre de date)
    const { data: latestCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fetch recent completed daily micro-actions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentDailyActions } = await supabase
      .from('daily_micro_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. Fetch alignment scores (jauges) from DB
    let alignmentData = null;
    if (ideaId) {
      const { data: alignment } = await supabase
        .from('alignment_scores')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      alignmentData = alignment;
    }

    // 4. Fetch astryd_session for maturity + session stats
    let sessionData = null;
    if (ideaId) {
      const { data: session } = await supabase
        .from('astryd_sessions')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();
      sessionData = session;
    }

    // 5. Fetch persona profile from user_assessments + related tables
    let personaInfo = 'Non détecté';
    if (assessment) {
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
      
      if (riasec) {
        const riasecEntries = Object.entries(riasec)
          .filter(([k]) => !['id', 'assessment_id'].includes(k))
          .sort(([,a], [,b]) => (b as number) - (a as number));
        const topRiasec = riasecEntries.slice(0, 3).map(([k, v]) => `${k}:${v}`).join(', ');
        personaInfo = `RIASEC top: ${topRiasec}`;
      }
    }

    // ========== BUILD CONTEXT SUMMARY FROM REAL DB DATA ==========
    const buildUserContextSummary = (): string => {
      const points: string[] = [];
      
      // Jauges d'alignement (from alignment_scores table)
      if (alignmentData?.details) {
        const details = alignmentData.details as any;
        const gaugeLabels: Record<string, string> = {
          energie: 'Énergie', temps: 'Temps', finances: 'Finances',
          soutien: 'Soutien', competences: 'Compétences', motivation: 'Motivation'
        };
        for (const [key, label] of Object.entries(gaugeLabels)) {
          const val = details[key];
          if (val !== undefined && val !== null) {
            if (val >= 80) points.push(`${label} TRÈS HAUTE (${val})`);
            else if (val >= 60) points.push(`${label} HAUTE (${val})`);
            else if (val <= 20) points.push(`${label} CRITIQUE (${val})`);
            else if (val <= 40) points.push(`${label} BASSE (${val})`);
          }
        }
        if (alignmentData.score_global) {
          points.push(`Score global d'alignement : ${alignmentData.score_global}/100`);
        }
      }

      // Météo du jour (from daily_checkins)
      if (latestCheckin) {
        points.push(`Météo du jour — Énergie: ${latestCheckin.energy_level}/10, Clarté: ${latestCheckin.clarity_level}/10, Moral: ${latestCheckin.mood_level}/10`);
        if (latestCheckin.journal_entry) {
          points.push(`Commentaire météo : "${latestCheckin.journal_entry}"`);
        }
      }

      // Maturity score
      if (sessionData) {
        points.push(`Score de maturité : ${sessionData.maturity_score_current} (initial: ${sessionData.maturity_score_initial})`);
        if (sessionData.journal_message_count) {
          points.push(`Messages journal : ${sessionData.journal_message_count}`);
        }
        if (sessionData.micro_actions_completed_count) {
          points.push(`Micro-actions complétées : ${sessionData.micro_actions_completed_count}`);
        }
      }

      // Recent completed daily actions
      if (recentDailyActions && recentDailyActions.length > 0) {
        const actionsSummary = recentDailyActions.map(a => a.title).join(', ');
        points.push(`Actions quotidiennes récentes complétées : ${actionsSummary}`);
      }
      
      if (points.length === 0) {
        return "POINTS SAILLANTS : Données profil non encore disponibles (premier usage).";
      }
      
      return `⚡ POINTS SAILLANTS À ANCRER : ${points.join(' | ')}.
🎭 PERSONA : ${personaInfo}`;
    };
    
    const userContextSummary = buildUserContextSummary();
    console.log('📊 Context Summary:', userContextSummary);

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: `${userContextSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 BRAIN ASTRYD V2 — COACH IA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu es le coach IA d'Astryd. Tu aides l'entrepreneur à transformer ce qu'il dépose (météo, blocages, avancées) en clarté + micro-actions contextualisées.

Positionnement : coaching de posture, pas consultant projet. Tu accompagnes l'humain, pas le Trello.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 PROCESS DE CONVERSATION (4 étapes obligatoires)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Étape 0 — Calibrage (instantané)**
- Aligner le registre : vouvoiement par défaut. Si l'utilisateur tutoie, mirror le tutoiement.
- Reprendre les faits tels quels : noms, durées, montants, dates. Ne JAMAIS conceptualiser.
  ❌ "Un engagement financier mesuré"
  ✅ "Payer 1500€ après 2 mois de test"

**Étape 1 — Miroir factuel (1 phrase max)**
- Reformuler la situation en réutilisant les éléments concrets du message.
- Pas de jargon, pas d'interprétation. Juste : "Si je comprends bien, vous [faits]."

**Étape 2 — Mini-audit (1 question max)**
- Si le message est flou ou trop large : proposer un choix fermé A / B / C
- Sinon : poser UNE seule question de clarification, de préférence réflexive (pas juste factuelle)
- Sur les sujets opérationnels (argent, contrats, recrutement, POC) : questions FERMÉES uniquement
  ❌ "Comment percevez-vous cette décision ?"
  ✅ "C'est viable pour votre tréso ? Oui/Non"

**⚠️ Étape 2.5 — Garde-fou Coach / Psy (PRIORITÉ ABSOLUE)**
Si le message contient des signaux EXPLICITES de détresse psychologique grave (idées noires, pensées suicidaires, désespoir profond, "je ne veux plus vivre", "tout est fini", "je n'en peux plus de vivre") :
1. Ne PAS creuser le sujet
2. Répondre avec empathie mais fermeté :
   "Je vois que vous traversez un moment vraiment difficile. Je suis une IA, je ne peux pas vous aider sur ce point comme il le faudrait.
   Je vous recommande vraiment d'en parler à :
   - Votre mentor si vous avez activé le partage
   - Un professionnel de santé ou un psychologue
   - Le 3114 (numéro national de prévention du suicide) si vous avez des pensées noires
   Ce que vous vivez mérite un vrai accompagnement humain spécialisé.
   Si vous le souhaitez, on peut reprendre sur votre projet entrepreneurial quand vous vous sentirez prêt(e)."
3. Ne PAS générer de micro-action sur ce sujet
4. Ne PAS creuser avec des questions de relance sur la détresse
5. Ajouter le tag <DISTRESS_DETECTED>true</DISTRESS_DETECTED> à la fin de votre réponse
6. Après redirection : si l'utilisateur revient sur des sujets entrepreneuriaux, reprendre le coaching normal

⛔ N'ajoutez JAMAIS le tag <DISTRESS_DETECTED> pour des messages normaux, positifs, ou simplement stressés. Ce tag est EXCLUSIVEMENT réservé aux cas de détresse psychologique GRAVE. Le stress entrepreneurial normal (tréso, délais, fatigue) n'est PAS de la détresse psychologique.

Vocabulaire INTERDIT : diagnostic, santé mentale, pathologie, thérapie
Vocabulaire AUTORISÉ : moment difficile, besoin d'accompagnement spécialisé

**Étape 3 — Analyse légère (1 phrase max)**
- Nommer l'enjeu dominant parmi : surcharge / flou / peur / isolement / perte d'élan
- Si pattern récurrent détecté (même blocage revient 3+ fois) : le signaler factuellement, sans dramatiser

**Étape 4 — Sortie (1 micro-action)**
- Proposer UNE action : concrète, timeboxée (2-10 min), adaptée à l'état actuel
- Si fatigué → action de clarification légère ("Notez 3 risques")
- Si lucide → action de progression ("Envoyez le mail à X")
- JAMAIS de liste de 10 suggestions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 RÈGLES ANTI-DÉCROCHAGE (priorité absolue)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔁 **Règle Anti-Boucle (KPI "je ne comprends pas")**
Si l'utilisateur dit "je ne comprends pas", "je vois pas", "c'est flou" ou équivalent :
→ INTERDICTION de reformuler la même question
→ OBLIGATION de changer de format :
  • Exemple concret ("Par exemple : si votre risque c'est l'argent, ça veut dire...")
  • Choix fermé ("C'est plutôt A (argent), B (solitude), ou C (charge) ?")
  • Micro-action de clarification ("Notez 3 risques sur une échelle 1-5")

🚫 **Règle Anti-Méta**
Sur les sujets opérationnels (argent, contrats, recrutement, POC) :
→ INTERDICTION de poser des questions commençant par "Comment percevez-vous..." ou "Quel est votre sentiment..."
→ Questions fermées : viabilité / faisabilité / oui-non

🚫 **Règle Anti-Consultant**
→ INTERDICTION de phrases creuses de validation ("C'est une excellente réflexion", "Vous êtes sur la bonne voie")
→ Si l'utilisateur dit "OK" ou "d'accord" → passer au next step immédiatement, NE PAS re-valider

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 GESTION DES MICRO-ACTIONS (cap + dédup)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Objectif permanent : RÉDUIRE la charge, pas l'augmenter
- Cap strict : max 3 à 5 actions actives simultanément
- Si l'utilisateur a déjà 5+ actions actives : passer en MODE CONSOLIDATION
  → Identifier les doublons / actions similaires → fusionner
  → Proposer un Top 3 priorisé
  → Proposer d'archiver le reste
  → Format : "Voici vos 3 priorités. Je propose d'archiver les X autres. OK ?"
- Si une nouvelle action est générée mais le cap est atteint : demander laquelle remplacer

Avant de créer : vérifier les doublons dans la liste ci-dessous.
Format : Verbe + Résultat + Temps (ex: "Lister 3 critères de succès pour ${idea?.title || 'votre projet'} (20 min)")

Si action terminée mentionnée :
<VALIDATION_SUGGESTIONS>{"suggestedIds": ["id1"], "message": "raison"}</VALIDATION_SUGGESTIONS>

Pour archiver/consolider :
<ACTION_MANAGEMENT>{"action":"consolidate","ideaId":"${ideaId || ''}","maxKeep":3}</ACTION_MANAGEMENT>
<ACTION_MANAGEMENT>{"action":"archive","actionIds":["id1","id2"]}</ACTION_MANAGEMENT>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ TRANSPARENCE TECHNIQUE (fallback)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si l'IA ne peut PAS modifier directement la liste "Mes actions" (limitation technique) :
→ Le dire en 1 phrase claire : "Je ne peux pas modifier votre liste directement."
→ Fournir un bloc prêt à copier-coller avec le contenu proposé
→ Ne PAS prétendre avoir modifié quelque chose qui n'a pas changé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 CONTEXTE PROFIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DONNÉES PROFIL :
- Idée : ${idea?.title || 'Non définie'} — ${idea?.description || 'Non renseignée'}
- Jauges : ${assessment ? JSON.stringify((assessment as any).context_summary || 'Non renseigné') : 'Non disponibles'}
- Persona : ${assessment ? JSON.stringify((assessment as any).persona_type || 'Non détecté') : 'Non disponible'}

📍 ZONES D'ATTENTION :
${currentZones && currentZones.length > 0 ? currentZones.map(z => `- ${z.label} (sévérité: ${z.severity})`).join('\n') : 'Aucune zone définie'}

✅ ACTIONS EN COURS :
${currentActions && currentActions.length > 0 ? currentActions.slice(0, 5).map(a => {
  const statusLabel = a.status === 'todo' ? 'à faire' : a.status === 'done' ? 'terminée' : a.status === 'in_progress' ? 'en cours' : a.status;
  return `- ${a.text} (${statusLabel})`;
}).join('\n') : 'Aucune action définie'}

Si vous ne voyez pas certaines infos, DITES-LE clairement : "Je ne vois pas vos micro-actions, mais je vois que vous avez parlé de X/Y"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ PÉRIMÈTRE : COACHING MENTAL UNIQUEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Si question technique sur l'app → "Je ne vois pas votre écran. Contactez le support via la bulle en bas à droite."
- Pas de conseils business/GTM (renvoyez vers Mona Lysa)
- N'inventez JAMAIS de fonctionnalités de l'application

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 TONE OF VOICE — STYLE D'ÉCRITURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSTURE : Coach Expert Senior, pair-à-pair. Pas servile, pas obséquieux.
REGISTRE : Vouvoiement par défaut. Si l'utilisateur tutoie → mirror le tutoiement.

📝 STYLE OBLIGATOIRE :
- Phrases COURTES et DIRECTES. Sujet-Verbe-Complément. Voix active.
- Réponse totale : 3 à 6 lignes max (pas de pavés).
- Pas de jargon coaching ("dissonance", "potentielle", "mise en lumière", "stratégie globale").
- Parler comme un collègue entrepreneur, pas comme un rapport de consulting.

🚫 FORMULATIONS INTERDITES (voix passive, tournures alambiquées) :
  ❌ "Cela met en lumière une potentielle dissonance entre..."
  ✅ "OK, donc le conseil ne vous branche pas plus que ça."
  ❌ "Vous indiquez que c'est plutôt un manque d'envie"
  ✅ "Pas d'envie de prospecter, noté."
  ❌ "Pour avancer, pourriez-vous identifier une raison principale pour laquelle..."
  ✅ "Qu'est-ce qui vous freine concrètement ? Pas le bon moment, pas aligné, ou trop crevant ?"
  ❌ "Cette réflexion peut aider à mieux comprendre la place que cette activité occupe"
  ✅ (supprimer — phrase creuse, n'apporte rien)
  ❌ "Si je comprends bien, vous êtes prêt à explorer les raisons de votre hésitation à..."
  ✅ "OK, creusons ça."

RÈGLE D'OR : Si une phrase peut être dite plus court → la raccourcir. Si elle n'apporte rien → la supprimer.

🚫 TERMINOLOGIE INTERNE INTERDITE DANS VOS RÉPONSES :
Ne JAMAIS utiliser de noms techniques internes dans vos réponses à l'utilisateur :
DailyPulse, daily_checkins, micro_commitments, attention_zones, idea_id, check_in, alignment_scores, astryd_sessions, journal_entries, user_assessments, posture_assessments.
Utilisez uniquement le vocabulaire utilisateur : "météo", "actions", "zones d'attention", "projet", "journal", "bilan".`
      }
    ];

    // Add conversation history (last 10 messages for context)
    if (conversation && conversation.length > 0) {
      const recentConv = conversation.slice(-10);
      for (const msg of recentConv) {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Call Lovable AI gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let aiMessage = enforceVouvoiement(aiResponse.choices[0].message.content);

    // Étape 2.5 — Detect psychological distress flag from AI response
    let distressDetected = false;
    const distressMatch = aiMessage.match(/<DISTRESS_DETECTED>true<\/DISTRESS_DETECTED>/s);
    if (distressMatch) {
      distressDetected = true;
      aiMessage = aiMessage.replace(/<DISTRESS_DETECTED>true<\/DISTRESS_DETECTED>/s, '').trim();
      console.log('🚨 Psychological distress detected — flagging entry');
    }

    // Extract validation suggestions if present
    const validationSuggestions: { suggestedIds: string[], message: string } | null = null;
    let extractedSuggestions = null;
    const suggestionMatch = aiMessage.match(/<VALIDATION_SUGGESTIONS>(.*?)<\/VALIDATION_SUGGESTIONS>/s);
    if (suggestionMatch) {
      try {
        extractedSuggestions = JSON.parse(suggestionMatch[1]);
        aiMessage = aiMessage.replace(/<VALIDATION_SUGGESTIONS>.*?<\/VALIDATION_SUGGESTIONS>/s, '').trim();
      } catch (e) {
        console.error('Failed to parse validation suggestion data:', e);
      }
    }

    // Extract and execute ACTION_MANAGEMENT commands
    let actionManagementResult = null;
    const actionMatch = aiMessage.match(/<ACTION_MANAGEMENT>(.*?)<\/ACTION_MANAGEMENT>/s);
    if (actionMatch) {
      try {
        const actionCmd = JSON.parse(actionMatch[1]);
        aiMessage = aiMessage.replace(/<ACTION_MANAGEMENT>.*?<\/ACTION_MANAGEMENT>/s, '').trim();
        
        console.log('🔧 ACTION_MANAGEMENT detected:', actionCmd);
        
        // Execute the action via manage-micro-actions function
        const manageResponse = await fetch(`${supabaseUrl}/functions/v1/manage-micro-actions`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actionCmd),
        });
        
        if (manageResponse.ok) {
          actionManagementResult = await manageResponse.json();
          console.log('✅ ACTION_MANAGEMENT result:', actionManagementResult);
        } else {
          const errText = await manageResponse.text();
          console.error('❌ ACTION_MANAGEMENT failed:', errText);
        }
      } catch (e) {
        console.error('Failed to parse/execute ACTION_MANAGEMENT:', e);
      }
    }

    // Save AI response with validation suggestions metadata + distress flag
    const aiContext = extractedSuggestions ? { validationSuggestions: extractedSuggestions } : {};
    
    const { data: aiEntry, error: aiEntryError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        idea_id: ideaId,
        sender: 'ai',
        content: aiMessage,
        ai_context: aiContext,
        psychological_distress_detected: distressDetected,
      })
      .select()
      .single();

    // Also flag the user's message if distress was detected
    if (distressDetected && userEntry?.id) {
      await supabase
        .from('journal_entries')
        .update({ psychological_distress_detected: true })
        .eq('id', userEntry.id);
      console.log('🚨 User entry flagged for psychological distress');
    }

    if (aiEntryError) {
      throw aiEntryError;
    }

    // CRITICAL: Analyze conversation and update zones/actions if needed
    // Every 2 messages, trigger an analysis to potentially generate new zones/actions
    const totalMessages = conversation ? conversation.length : 0;
    const shouldAnalyze = totalMessages > 0 && totalMessages % 2 === 0 && !distressDetected;

    if (shouldAnalyze) {
      try {
        // Build analysis context from last 5 exchanges
        const recentConversation = conversation ? conversation.slice(-10) : [];
        const conversationText = recentConversation
          .map(m => `${m.sender === 'user' ? 'Porteur' : 'Astryd'}: ${m.content}`)
          .join('\n\n');

        // Call Lovable AI to analyze conversation and generate insights
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        if (lovableApiKey) {
          const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `Vous êtes un expert en analyse de coaching entrepreneurial. Analysez cette conversation pour identifier :

🎯 VOTRE MISSION :
1. **Détecter ACTIVEMENT de nouveaux freins Alpact** qui émergent dans la conversation :
   - Énergie personnelle insuffisante
   - Manque de temps/bande passante
   - Contraintes financières
   - Manque de confiance/syndrome imposteur
   - Isolement/absence de soutien
   - Manque de clarté sur l'idée
   - Contexte défavorable
   - Compétences manquantes

2. **Proposer des micro-actions CONCRÈTES** (15-30 min) adaptées aux besoins exprimés - VOUVOIEMENT OBLIGATOIRE

3. **Ajuster les zones d'attention existantes** si elles sont résolues ou évoluent

🔄 APPROCHE PROACTIVE :
- Soyez GÉNÉREUX dans la génération de nouveaux éléments
- Si l'utilisateur exprime un doute → générez une zone d'attention + micro-action
- Si l'utilisateur parle d'un obstacle → identifiez le frein Alpact correspondant
- Si l'utilisateur mentionne une avancée → proposez une micro-action pour continuer
- Ne retournez des arrays vides QUE si la conversation est vraiment triviale

⚠️ VOUVOIEMENT ABSOLU OBLIGATOIRE :
- TOUS les textes générés DOIVENT utiliser "vous", "votre", "vos"
- INTERDICTION ABSOLUE du tutoiement ("tu", "ton", "ta", "tes")
- Labels et recommandations en VOUVOIEMENT uniquement

Retournez un JSON structuré :
{
  "newZones": [
    {
      "label": "Titre court et personnalisé du frein avec VOUS (ex: 'Manque de temps pour votre projet')",
      "severity": 1-3 (1=faible, 2=moyen, 3=critique),
      "recommendation": "Explication détaillée avec VOUVOIEMENT basée sur la conversation"
    }
  ],
  "newActions": [
    {
      "text": "Action concrète avec VOUVOIEMENT (ex: 'Identifiez 1 créneau dans votre agenda')",
      "objectif": "Ce que ça permet d'accomplir",
      "duree": "15-30 min",
      "jauge_ciblee": "energie|temps|finances|soutien|competences|motivation"
    }
  ],
  "updatedZones": [
    {
      "action": "resolve|adjust",
      "reason": "Pourquoi cette zone doit être résolue ou ajustée"
    }
  ]
}

Si VRAIMENT rien de nouveau n'émerge, retournez des arrays vides. Mais soyez proactif !`
                },
                {
                  role: 'user',
                  content: `Idée : ${idea?.title}\n\nConversation récente :\n${conversationText}`
                }
              ],
              temperature: 0.7,
              response_format: { type: 'json_object' }
            })
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            const insights = JSON.parse(analysisData.choices[0].message.content);

            // Insert new attention zones
            if (insights.newZones && insights.newZones.length > 0) {
              for (const zone of insights.newZones) {
                await supabase
                  .from('attention_zones')
                  .insert({
                    user_id: user.id,
                    idea_id: ideaId,
                    label: zone.label,
                    severity: zone.severity || 2,
                    recommendation: zone.recommendation
                  });
              }
              console.log(`✅ ${insights.newZones.length} nouvelles zones d'attention générées`);
            }

            // Insert new micro-actions
            if (insights.newActions && insights.newActions.length > 0) {
              for (const action of insights.newActions) {
                await supabase
                  .from('micro_commitments')
                  .insert({
                    user_id: user.id,
                    idea_id: ideaId,
                    text: action.text,
                    objectif: action.objectif,
                    duree: action.duree,
                    jauge_ciblee: action.jauge_ciblee,
                    status: 'todo',
                    period: 'weekly'
                  });
              }
              console.log(`✅ ${insights.newActions.length} nouvelles micro-actions générées`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to analyze conversation:', error);
        // Don't throw - conversation is saved, analysis is secondary
      }
    }

    // Trigger maturity update
    try {
      await fetch(`${supabaseUrl}/functions/v1/update-maturity`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: ideaId,
          actionType: 'journal',
          progressionPoints: 3
        })
      });
    } catch (error) {
      console.error('Failed to update maturity after journal:', error);
      // Don't throw - journal entry is saved, maturity update is secondary
    }

    return new Response(
      JSON.stringify({
        userEntry,
        aiEntry,
        shouldRefresh: true,
        newContentGenerated: shouldAnalyze,
        validationSuggestions: extractedSuggestions,
        actionManagementResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat-journal:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
