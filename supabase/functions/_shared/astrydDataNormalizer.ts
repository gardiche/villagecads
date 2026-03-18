/**
 * ASTRYD DATA NORMALIZER
 * Normalise toutes les échelles en 0-100 pour garantir cohérence et hyper-personnalisation
 */

export interface MotivationBlock {
  motivations_schwartz: {
    pouvoir: number;
    accomplissement: number;
    hedonisme: number;
    stimulation: number;
    autonomie: number;
    universalisme: number;
    bienveillance: number;
    tradition: number;
    conformite: number;
    securite: number;
  };
  energie: number;
  sante: number;
  famille: number;
  finances_perso: number;
  temps_disponible: number;
  soutien: number;
}

export interface BehaviorBlock {
  big5_ouverture: number;
  big5_conscienciosite: number;
  big5_extraversion: number;
  big5_agreabilite: number;
  big5_stabilite_emotionnelle: number;
  reseau: number;
  mentors: number;
  competences_cles: number;
  marge_manoeuvre: number;
  contexte_pro: number;
}

export interface SkillsBlock {
  riasec_scores: {
    realiste: number;
    investigateur: number;
    artistique: number;
    social: number;
    entreprenant: number;
    conventionnel: number;
  };
  cv_competences_deduites: string[];
  cv_experiences_clefs: string[];
  cv_points_forts: string[];
  cv_points_a_surveiller: string[];
  cv_coherence_score: number; // 0-100
}

export interface IdeaBlock {
  idea_title: string;
  idea_summary: string;
  idea_details: string;
  idea_documents_parsed: string[];
}

export interface InteractionBlock {
  journal_last_entries: Array<{
    sender: string;
    content: string;
    created_at: string;
  }>;
  micro_actions_completed: number;
  zones_attention_levees: number;
}

export interface AstrydPayload {
  user: {
    motivation_block: MotivationBlock;
    behavior_block: BehaviorBlock;
    skills_block: SkillsBlock;
  };
  idea: {
    idea_block: IdeaBlock;
  };
  interactions: InteractionBlock;
}

/**
 * Normalise les valeurs Schwartz (échelle variable) en 0-100
 */
export function normalizeSchwartzValues(values: any): MotivationBlock['motivations_schwartz'] {
  return {
    pouvoir: normalizeValue(values.pouvoir, 0, 100),
    accomplissement: normalizeValue(values.accomplissement, 0, 100),
    hedonisme: normalizeValue(values.hedonisme, 0, 100),
    stimulation: normalizeValue(values.stimulation, 0, 100),
    autonomie: normalizeValue(values.autonomie, 0, 100),
    universalisme: normalizeValue(values.universalisme, 0, 100),
    bienveillance: normalizeValue(values.bienveillance, 0, 100),
    tradition: normalizeValue(values.tradition, 0, 100),
    conformite: normalizeValue(values.conformite, 0, 100),
    securite: normalizeValue(values.securite, 0, 100),
  };
}

/**
 * Normalise les valeurs Big Five en 0-100
 */
export function normalizeBigFiveTraits(traits: any): Partial<BehaviorBlock> {
  return {
    big5_ouverture: normalizeValue(traits.ouverture, 0, 100),
    big5_conscienciosite: normalizeValue(traits.conscienciosite, 0, 100),
    big5_extraversion: normalizeValue(traits.extraversion, 0, 100),
    big5_agreabilite: normalizeValue(traits.agreabilite, 0, 100),
    big5_stabilite_emotionnelle: normalizeValue(100 - (traits.nevrosisme || 0), 0, 100), // Inverser névrosisme
  };
}

/**
 * Normalise les scores RIASEC en 0-100
 */
export function normalizeRiasecScores(scores: any): SkillsBlock['riasec_scores'] {
  return {
    realiste: normalizeValue(scores.realiste, 0, 100),
    investigateur: normalizeValue(scores.investigateur, 0, 100),
    artistique: normalizeValue(scores.artistique, 0, 100),
    social: normalizeValue(scores.social, 0, 100),
    entreprenant: normalizeValue(scores.entreprenant, 0, 100),
    conventionnel: normalizeValue(scores.conventionnel, 0, 100),
  };
}

/**
 * Normalise une valeur sur une échelle 0-100
 */
function normalizeValue(value: number | undefined | null, min: number, max: number): number {
  if (value === undefined || value === null) return 50; // Valeur par défaut si manquante
  
  // Clamp la valeur entre min et max
  const clamped = Math.max(min, Math.min(max, value));
  
  // Normalise sur 0-100
  if (max === min) return 50;
  return Math.round(((clamped - min) / (max - min)) * 100);
}

/**
 * Construit le bloc Motivations
 */
export function buildMotivationBlock(
  schwartzValues: any,
  lifeSpheres: any
): MotivationBlock {
  return {
    motivations_schwartz: normalizeSchwartzValues(schwartzValues || {}),
    energie: normalizeValue(lifeSpheres?.soi, 0, 100),
    sante: normalizeValue(lifeSpheres?.soi, 0, 100),
    famille: normalizeValue(lifeSpheres?.famille, 0, 100),
    finances_perso: normalizeValue(lifeSpheres?.pro, 0, 100), // Approximation
    temps_disponible: normalizeValue(lifeSpheres?.loisirs, 0, 100),
    soutien: normalizeValue(lifeSpheres?.amis, 0, 100),
  };
}

/**
 * Construit le bloc Comportement
 */
export function buildBehaviorBlock(
  bigFiveTraits: any,
  userContext: any
): BehaviorBlock {
  const bigFiveNormalized = normalizeBigFiveTraits(bigFiveTraits || {});
  
  return {
    big5_ouverture: bigFiveNormalized.big5_ouverture || 50,
    big5_conscienciosite: bigFiveNormalized.big5_conscienciosite || 50,
    big5_extraversion: bigFiveNormalized.big5_extraversion || 50,
    big5_agreabilite: bigFiveNormalized.big5_agreabilite || 50,
    big5_stabilite_emotionnelle: bigFiveNormalized.big5_stabilite_emotionnelle || 50,
    reseau: mapContextToScore(userContext?.reseau_professionnel),
    mentors: 50, // Pas de donnée directe, à estimer
    competences_cles: 50, // À calculer depuis CV
    marge_manoeuvre: mapContextToScore(userContext?.temps_disponible),
    contexte_pro: mapContextToScore(userContext?.situation_pro),
  };
}

/**
 * Construit le bloc Compétences (avec CV)
 */
export function buildSkillsBlock(
  riasecScores: any,
  cvInsights?: any
): SkillsBlock {
  return {
    riasec_scores: normalizeRiasecScores(riasecScores || {}),
    cv_competences_deduites: cvInsights?.hard_skills || [],
    cv_experiences_clefs: cvInsights?.experiences?.map((e: any) => 
      `${e.role || e.position} - ${e.sector || ''} (${e.duration || e.years || ''})`
    ) || [],
    cv_points_forts: cvInsights?.soft_skills || [],
    cv_points_a_surveiller: cvInsights?.warnings || [],
    cv_coherence_score: cvInsights?.coherence_score || 50,
  };
}

/**
 * Construit le bloc Idée
 */
export function buildIdeaBlock(
  idea: any,
  documentsSummaries: string[] = []
): IdeaBlock {
  return {
    idea_title: idea.title || '',
    idea_summary: idea.description || '',
    idea_details: idea.description || '',
    idea_documents_parsed: documentsSummaries,
  };
}

/**
 * Construit le bloc Interactions
 */
export function buildInteractionBlock(
  journalEntries: any[] = [],
  microActionsCompleted: number = 0,
  zonesLevees: number = 0
): InteractionBlock {
  // Prendre les 3 dernières entrées
  const lastEntries = journalEntries
    .slice(-6) // 3 user + 3 assistant = 6 au total
    .map(entry => ({
      sender: entry.sender,
      content: entry.content,
      created_at: entry.created_at,
    }));

  return {
    journal_last_entries: lastEntries,
    micro_actions_completed: microActionsCompleted,
    zones_attention_levees: zonesLevees,
  };
}

/**
 * Construit le payload complet Astryd normalisé
 */
export function buildAstrydPayload(data: {
  schwartzValues: any;
  lifeSpheres: any;
  bigFiveTraits: any;
  userContext: any;
  riasecScores: any;
  cvInsights?: any;
  idea: any;
  documentsSummaries?: string[];
  journalEntries?: any[];
  microActionsCompleted?: number;
  zonesLevees?: number;
}): AstrydPayload {
  return {
    user: {
      motivation_block: buildMotivationBlock(data.schwartzValues, data.lifeSpheres),
      behavior_block: buildBehaviorBlock(data.bigFiveTraits, data.userContext),
      skills_block: buildSkillsBlock(data.riasecScores, data.cvInsights),
    },
    idea: {
      idea_block: buildIdeaBlock(data.idea, data.documentsSummaries),
    },
    interactions: buildInteractionBlock(
      data.journalEntries,
      data.microActionsCompleted,
      data.zonesLevees
    ),
  };
}

/**
 * Mapper les réponses textuelles du contexte en scores 0-100
 */
function mapContextToScore(value: string | undefined): number {
  if (!value) return 50;
  
  const lowerValue = value.toLowerCase();
  
  // Temps disponible
  if (lowerValue.includes('très peu') || lowerValue.includes('aucun')) return 20;
  if (lowerValue.includes('peu')) return 35;
  if (lowerValue.includes('modéré') || lowerValue.includes('quelques heures')) return 50;
  if (lowerValue.includes('beaucoup') || lowerValue.includes('temps plein')) return 75;
  if (lowerValue.includes('énormément') || lowerValue.includes('illimité')) return 90;
  
  // Situation pro
  if (lowerValue.includes('précaire') || lowerValue.includes('difficile')) return 25;
  if (lowerValue.includes('stable') || lowerValue.includes('cdi')) return 70;
  if (lowerValue.includes('indépendant') || lowerValue.includes('freelance')) return 60;
  
  // Réseau
  if (lowerValue.includes('très faible') || lowerValue.includes('inexistant')) return 20;
  if (lowerValue.includes('faible')) return 35;
  if (lowerValue.includes('moyen')) return 50;
  if (lowerValue.includes('bon') || lowerValue.includes('développé')) return 70;
  if (lowerValue.includes('excellent') || lowerValue.includes('très développé')) return 85;
  
  return 50; // Défaut
}
