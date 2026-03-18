import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceVouvoiement, VOUVOIEMENT_DIRECTIVE } from "../_shared/enforceVouvoiement.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

/**
 * Edge function de régénération INTELLIGENTE des zones d'attention et micro-actions
 * RÈGLES CRITIQUES :
 * - JAMAIS supprimer ou écraser les données utilisateur existantes
 * - TOUJOURS préserver les actions complétées (status='done')
 * - Archiver (pas supprimer) les recommandations obsolètes
 * - Ajouter UNIQUEMENT de nouvelles recommandations non-redondantes
 * - Incrémenter generation_version pour traçabilité
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { ideaId, trigger } = await req.json();
    console.log('🔄 Régénération intelligente déclenchée:', { ideaId, trigger, userId: user.id });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 🔍 ÉTAPE 1 : Collecter TOUTES les données existantes (y compris archivées) pour analyse intelligente
    const [assessmentRes, ideaRes, activeActionsRes, archivedActionsRes, activeZonesRes, archivedZonesRes, journalRes, completedActionsRes] = await Promise.all([
      supabase.from('user_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ideaId ? supabase.from('ideas').select('*').eq('id', ideaId).maybeSingle() : { data: null },
      ideaId ? supabase.from('micro_commitments').select('*').eq('idea_id', ideaId).eq('user_id', user.id).eq('archived', false) : { data: [] },
      ideaId ? supabase.from('micro_commitments').select('*').eq('idea_id', ideaId).eq('user_id', user.id).eq('archived', true) : { data: [] },
      ideaId ? supabase.from('attention_zones').select('*').eq('idea_id', ideaId).eq('user_id', user.id).eq('archived', false) : { data: [] },
      ideaId ? supabase.from('attention_zones').select('*').eq('idea_id', ideaId).eq('user_id', user.id).eq('archived', true) : { data: [] },
      ideaId ? supabase.from('journal_entries').select('*').eq('idea_id', ideaId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10) : { data: [] },
      ideaId ? supabase.from('micro_commitments').select('*').eq('idea_id', ideaId).eq('user_id', user.id).eq('status', 'done') : { data: [] }
    ]);

    const assessment = assessmentRes.data;
    const idea = ideaRes.data;
    const activeActions = activeActionsRes.data || [];
    const archivedActions = archivedActionsRes.data || [];
    const activeZones = activeZonesRes.data || [];
    const archivedZones = archivedZonesRes.data || [];
    const recentJournal = journalRes.data || [];
    const completedActions = completedActionsRes.data || [];
    
    // 🔒 BLOCAGE GÉNÉRATION : Si ≥3 actions "todo", ne pas en générer de nouvelles
    const todoActions = activeActions.filter(a => a.status === 'todo');
    const shouldBlockGeneration = todoActions.length >= 3;
    
    if (shouldBlockGeneration) {
      console.log(`🛑 Blocage génération: ${todoActions.length} actions "todo" en attente (seuil: 3). Aucune nouvelle action ne sera générée.`);
    }

    console.log('📊 État actuel:', {
      activeActions: activeActions.length,
      todoActions: todoActions.length,
      blockedGeneration: shouldBlockGeneration,
      archivedActions: archivedActions.length,
      completedActions: completedActions.length,
      activeZones: activeZones.length,
      archivedZones: archivedZones.length,
      journalMessages: recentJournal.length
    });

    // 🧠 ÉTAPE 2 : Construire un prompt INTELLIGENT qui analyse l'existant avant de générer du nouveau
    const contextPrompt = `
CONTEXTE UTILISATEUR COMPLET:

PROFIL ENTREPRENEURIAL:
${assessment ? `- Assessment complété` : '- Profil non disponible'}

IDÉE PROJET:
${idea ? `- Titre: ${idea.title}
- Description: ${idea.description || 'Non renseignée'}` : '- ❗ AUCUNE IDÉE RENSEIGNÉE'}

📋 MICRO-ACTIONS ACTIVES (${activeActions.length}) - NE PAS DUPLIQUER :
${activeActions.map(a => `- "${a.text}" (${a.status}${a.status === 'done' ? ' ✅ COMPLÉTÉE - PRÉSERVÉE' : ''})`).join('\n') || '- Aucune action active'}

✅ ACTIONS COMPLÉTÉES (${completedActions.length}) - HISTORIQUE PRÉSERVÉ :
${completedActions.slice(0, 5).map(a => `- "${a.text}"`).join('\n') || '- Aucune action complétée'}

⚠️ ZONES D'ATTENTION ACTIVES (${activeZones.length}) - NE PAS DUPLIQUER :
${activeZones.map(z => `- "${z.label}" (severity ${z.severity})`).join('\n') || '- Aucune zone active'}

💬 JOURNAL RÉCENT (${recentJournal.filter(e => e.sender === 'user').length} messages utilisateur):
${recentJournal.filter(e => e.sender === 'user').slice(0, 5).map(e => `- "${e.content.substring(0, 120)}..."`).join('\n') || '- Aucun message journal'}

🔄 TRIGGER: ${trigger}

🎭 ADAPTATION TON & FORMULATION (CRITIQUE) :
Détectez le PERSONA ENTREPRENEURIAL à partir du profil et ADAPTEZ la FORMULATION des micro-actions et zones :

🔥 DYNAMIQUE PRESSÉ : Formulez en mode RÉSULTAT direct
→ Micro-action : "Obtenez [résultat] en 15 min"
→ Zone : "Votre énergie est au max, attention à la surcharge"

🛡️ PRUDENT BLOQUÉ : Formulez en mode EXPÉRIMENTATION sans risque
→ Micro-action : "Testez juste ceci pour voir..."
→ Zone : "Cette hésitation est normale, vous avancez bien"

⚖️ ÉQUILIBRISTE : Formulez en mode PROTECTION DES ÉQUILIBRES
→ Micro-action : "Avancez par petit pas compatible avec votre équilibre..."
→ Zone : "Attention à préserver vos sphères de vie essentielles"

🎨 CRÉATIF DISPERSÉ : Formulez en mode FOCALISATION structurante
→ Micro-action : "Concentrez-vous sur UNE chose : ..."
→ Zone : "Recentrez-vous sur votre objectif principal"

🏔️ AUTONOME ISOLÉ : Formulez en mode OUVERTURE relationnelle
→ Micro-action : "Partagez votre idée avec une personne de confiance"
→ Zone : "Vous gagneriez à vous ouvrir aux autres"

CONSIGNES STRICTES ANTI-DUPLICATION:
1. ❌ NE JAMAIS générer une micro-action déjà dans la liste ACTIVES ci-dessus
2. ❌ NE JAMAIS générer une zone d'attention déjà dans la liste ACTIVES ci-dessus
3. ✅ Analyser ce qui est MANQUANT ou OBSOLÈTE dans les recommandations actuelles
4. ✅ Générer UNIQUEMENT 1-3 nouvelles micro-actions SI elles apportent de la valeur
5. ✅ Générer UNIQUEMENT 0-2 nouvelles zones d'attention SI des signaux nouveaux émergent du journal
6. ✅ Si idée NON renseignée ET aucune action "renseigner_idee" active : ajouter cette action
7. ✅ Si rien de pertinent à ajouter : retourner listes vides
8. ✅ ADAPTEZ la formulation selon le persona détecté (ton et style)

DÉTECTION D'OBSOLESCENCE (actions/zones à archiver):
- Identifier les actions/zones devenues obsolètes vu l'évolution (ex: action "renseigner idée" si idée renseignée)
- Lister leurs IDs dans un champ "to_archive"

Format JSON STRICT:
{
  "analysis": "Résumé 2-3 phrases: quoi de nouveau depuis dernière analyse, quoi garder, quoi ajouter",
  "to_archive": {
    "action_ids": ["id1", "id2"],
    "zone_ids": ["id3"]
  },
  "micro_actions": [
    {
      "titre": "Action NON-REDONDANTE ultra-spécifique 5-8 mots",
      "duree": "15 min" | "20 min" | "30 min",
      "impact": "Ce que ça débloque MAINTENANT pour cette personne",
      "justification": "Pourquoi cette action est NOUVELLE et pertinente",
      "conseil_pratique": "La méthode en 3 étapes : 1... 2... 3...",
      "action_id": "renseigner_idee" si action de renseignement idée, sinon null,
      "auto_complete": true si action déjà faite (ex: idée renseignée)
    }
  ],
  "zones_attention": [
    {
      "label": "Titre court NOUVEAU constat",
      "recommendation": "Constat détaillé NON-REDONDANT (PAS d'action)",
      "severity": 1-3,
      "impact_concret": "Pourquoi ce NOUVEAU constat maintenant"
    }
  ]
}`;

    console.log('📤 Envoi prompt régénération à Gemini Flash...');
    console.log('📤 Envoi prompt INTELLIGENT à Gemini Flash...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Vous êtes un coach entrepreneurial expert en analyse différentielle. Générez UNIQUEMENT du JSON valide. Évitez les duplications.' },
          { role: 'user', content: contextPrompt }
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
    console.log('✅ Analyse IA reçue');

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON from AI');
    }

    console.log('🔍 Analyse IA:', parsedResult.analysis);

    // 🗄️ ÉTAPE 3 : ARCHIVER (pas supprimer) les anciennes recommandations obsolètes
    const toArchive = parsedResult.to_archive || { action_ids: [], zone_ids: [] };
    let archivedActionsCount = 0;
    let archivedZonesCount = 0;

    if (toArchive.action_ids && toArchive.action_ids.length > 0) {
      const { error: archiveActionsError } = await supabase
        .from('micro_commitments')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString() 
        })
        .in('id', toArchive.action_ids)
        .eq('user_id', user.id)
        .neq('status', 'done'); // ❗ JAMAIS archiver les actions complétées
      
      if (!archiveActionsError) {
        archivedActionsCount = toArchive.action_ids.length;
        console.log(`📦 ${archivedActionsCount} micro-actions archivées (obsolètes)`);
      }
    }

    if (toArchive.zone_ids && toArchive.zone_ids.length > 0) {
      const { error: archiveZonesError } = await supabase
        .from('attention_zones')
        .update({ 
          archived: true, 
          archived_at: new Date().toISOString() 
        })
        .in('id', toArchive.zone_ids)
        .eq('user_id', user.id);
      
      if (!archiveZonesError) {
        archivedZonesCount = toArchive.zone_ids.length;
        console.log(`📦 ${archivedZonesCount} zones d'attention archivées (obsolètes)`);
      }
    }

    // ➕ ÉTAPE 4 : Ajouter UNIQUEMENT les nouvelles recommandations non-redondantes
    const newMicroActions = parsedResult.micro_actions || [];
    const newZones = parsedResult.zones_attention || [];
    
    // Calculer la prochaine version de génération
    const maxVersionActions = activeActions.reduce((max, a) => Math.max(max, a.generation_version || 1), 1);
    const maxVersionZones = activeZones.reduce((max, z) => Math.max(max, z.generation_version || 1), 1);
    const nextGenerationVersion = Math.max(maxVersionActions, maxVersionZones) + 1;

    let insertedActionsCount = 0;
    let insertedZonesCount = 0;

    // 🔒 Si blocage génération activé, ne pas insérer de nouvelles actions
    if (!shouldBlockGeneration) {
      for (const action of newMicroActions) {
        const status = action.auto_complete ? 'done' : 'todo';
        
        // 🔍 DEDUPLICATION TEXTUELLE : vérifier qu'une action similaire n'existe pas déjà
        const normalizedTitle = (action.titre || '').toLowerCase().trim();
        const isDuplicateAction = activeActions.some(existing => {
          const existingText = (existing.text || '').toLowerCase().trim();
          return existingText === normalizedTitle || 
                 existingText.includes(normalizedTitle) || 
                 normalizedTitle.includes(existingText);
        });

        if (isDuplicateAction) {
          console.log(`⏭️ Action dupliquée ignorée: "${action.titre}"`);
          continue;
        }

        // 🚨 POST-TRAITEMENT VOUVOIEMENT : Garantir "Zéro Tu"
        const { error } = await supabase.from('micro_commitments').insert({
          user_id: user.id,
          idea_id: ideaId || null,
          text: enforceVouvoiement(action.titre),
          duree: action.duree,
          impact_attendu: enforceVouvoiement(action.impact),
          status,
          period: 'weekly',
          archived: false,
          generation_version: nextGenerationVersion
        });
        
        if (!error) insertedActionsCount++;
      }
    } else {
      console.log('⏭️ Insertion micro-actions bloquée (trop d\'actions en attente)');
    }

    // 🔒 HARD CAP : Maximum 7 zones actives au total
    const MAX_ACTIVE_ZONES = 7;
    const currentActiveZonesCount = activeZones.filter(z => !toArchive.zone_ids?.includes(z.id)).length;
    const slotsAvailable = Math.max(0, MAX_ACTIVE_ZONES - currentActiveZonesCount);
    const zonesToInsert = newZones.slice(0, slotsAvailable);

    for (const zone of zonesToInsert) {
      // 🔍 DEDUPLICATION PROGRAMMATIQUE : vérifier que le label n'existe pas déjà
      const normalizedLabel = zone.label.toLowerCase().trim();
      const isDuplicate = activeZones.some(existing => {
        const existingLabel = existing.label.toLowerCase().trim();
        return existingLabel === normalizedLabel || 
               existingLabel.includes(normalizedLabel) || 
               normalizedLabel.includes(existingLabel);
      });

      if (isDuplicate) {
        console.log(`⏭️ Zone dupliquée ignorée: "${zone.label}"`);
        continue;
      }

      // 🚨 POST-TRAITEMENT VOUVOIEMENT : Garantir "Zéro Tu"
      const { error } = await supabase.from('attention_zones').insert({
        user_id: user.id,
        idea_id: ideaId || null,
        label: enforceVouvoiement(zone.label),
        recommendation: enforceVouvoiement(zone.recommendation),
        severity: zone.severity,
        archived: false,
        generation_version: nextGenerationVersion
      });
      
      if (!error) insertedZonesCount++;
    }

    console.log(`✅ Régénération INTELLIGENTE terminée:
    - ${archivedActionsCount} actions archivées (obsolètes)
    - ${archivedZonesCount} zones archivées (obsolètes)
    - ${insertedActionsCount} NOUVELLES actions ajoutées
    - ${insertedZonesCount} NOUVELLES zones ajoutées
    - Generation version: ${nextGenerationVersion}
    - Actions complétées: ${completedActions.length} (PRÉSERVÉES)
    `);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: parsedResult.analysis,
        archived: {
          actions: archivedActionsCount,
          zones: archivedZonesCount
        },
        added: {
          micro_actions: insertedActionsCount,
          zones_attention: insertedZonesCount
        },
        preserved_completed: completedActions.length,
        generation_version: nextGenerationVersion
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in regenerate-recommendations:', error);
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
