// Types pour le bilan d'évaluation

export interface SchwartzResponses extends Record<string, number> {
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
}

export interface BigFiveResponses extends Record<string, number> {
  ouverture: number;
  conscienciosite: number;
  extraversion: number;
  agreabilite: number;
  nevrosisme: number;
}

export interface RiasecResponses extends Record<string, number> {
  realiste: number;
  investigateur: number;
  artistique: number;
  social: number;
  entreprenant: number;
  conventionnel: number;
}

export interface LifeSpheresResponses extends Record<string, number> {
  soi: number;
  couple: number;
  famille: number;
  amis: number;
  loisirs: number;
  pro: number;
}

export interface CompetencesResponses {
  niveauEtudes: string;
  domainesFormation: string[];
  anneesExperience: string;
  domainesExperience: string[];
  competencesTransverses: string[];
}

export interface ContextResponses {
  tempsDisponible: string;
  situationPro: string;
  situationFinanciere: string;
  reseauProfessionnel: string;
  experienceEntrepreneuriat: string;
  competencesTechniques: string[];
  energieSociale: string;
  budgetTest30j: string;
  soutienEntourage: string;
  toleranceRisque: string;
  chargeMentale: string;
}

export interface AssessmentResponses {
  firstName: string;
  schwartz: SchwartzResponses;
  bigFive: BigFiveResponses;
  riasec: RiasecResponses;
  lifeSpheres: LifeSpheresResponses;
  competences: CompetencesResponses;
  context: ContextResponses;
}
