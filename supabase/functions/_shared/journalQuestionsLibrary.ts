/**
 * Bibliothèque de questions de journal catégorisées par frein Alpact
 * Pour personnaliser les questions selon les zones d'attention identifiées
 */

export type AlpactFrein = 
  | "energie" 
  | "temps" 
  | "finances" 
  | "confiance" 
  | "isolement" 
  | "clarte" 
  | "contexte" 
  | "competences";

export const JOURNAL_QUESTIONS_LIBRARY: Record<AlpactFrein, string[]> = {
  energie: [
    "Sur 10, ton niveau d'énergie aujourd'hui quand tu penses à cette idée, et que peux-tu faire pour gagner +1 point ?",
    "Qu'est-ce qui te prend le plus d'énergie actuellement dans ta vie, et comment ça impacte ton projet ?",
    "Si tu devais identifier 3 activités qui te donnent de l'énergie, lesquelles choisirais-tu et pourquoi ?",
    "Quelle micro-décision pourrais-tu prendre cette semaine pour protéger ton énergie vitale ?",
    "Comment as-tu géré ta charge mentale cette semaine ? Qu'as-tu appris sur toi ?",
    "Si ton énergie était une batterie, à combien serait-elle chargée en ce moment, et de quoi as-tu besoin pour la recharger ?",
    "Quel temps de pause ou de récupération t'es-tu accordé cette semaine pour tenir sur la durée ?"
  ],
  
  temps: [
    "Si tu avais 2 heures de plus par semaine, comment les utiliserais-tu pour ce projet ?",
    "Quelle activité actuelle pourrais-tu arrêter, déléguer ou réduire pour libérer du temps ?",
    "Comment as-tu priorisé ton temps cette semaine entre vie perso, pro et projet ?",
    "Qu'est-ce qui t'empêche vraiment de bloquer 2 créneaux de 45 minutes par semaine pour ton projet ?",
    "Si tu regardais ton agenda de la semaine dernière, de quoi es-tu fier·ère et qu'aimerais-tu changer ?",
    "Quelle est la plus petite action que tu pourrais faire en 15 minutes cette semaine pour avancer ?",
    "Comment pourrais-tu mieux protéger ton temps dédié à ce projet face aux sollicitations extérieures ?"
  ],
  
  finances: [
    "Quel montant mensuel pourrais-tu renoncer à dépenser ailleurs pour investir dans ce projet sans te mettre en danger ?",
    "Quelle est ta plus grande peur financière liée à ce projet, et est-elle basée sur des chiffres réels ?",
    "Si tu devais tester ton idée avec 100€, que ferais-tu concrètement ?",
    "Combien de mois de sécurité financière te faudrait-il pour te sentir serein·e face aux risques ?",
    "Quelle conversation financière difficile dois-tu avoir (avec toi, ton conjoint, un associé) pour avancer ?",
    "Comment pourrais-tu réduire le risque financier de ton projet sans renoncer à l'essentiel ?",
    "Quel scénario du pire financier as-tu en tête, et comment pourrais-tu t'en protéger ?"
  ],
  
  confiance: [
    "Si tu enlèves la peur pendant 5 minutes, quelle décision prendrais-tu à propos de ce projet ?",
    "Qu'as-tu déjà réussi dans ta vie qui prouve que tu peux y arriver ?",
    "Quelle petite victoire récente mérites-tu de célébrer, même minuscule ?",
    "Quelle croyance limitante sur toi te freine le plus, et d'où vient-elle vraiment ?",
    "Si un·e ami·e te racontait ton projet avec ton profil, que lui dirais-tu sur sa légitimité ?",
    "Quel retour positif ou encouragement as-tu reçu récemment que tu minimises peut-être ?",
    "Qu'est-ce qui te fait douter de ta capacité à porter ce projet, et cette peur est-elle fondée sur des faits ?"
  ],
  
  isolement: [
    "À qui as-tu parlé de ton projet cette semaine, et qu'as-tu appris de cet échange ?",
    "Quelle personne de ton entourage pourrait vraiment comprendre et soutenir ton projet si tu lui en parlais ?",
    "Quel type de pair ou mentor te manque le plus en ce moment, et où pourrais-tu le trouver ?",
    "Comment pourrais-tu sortir de ta bulle cette semaine pour rencontrer quelqu'un qui comprend ton parcours ?",
    "Qui dans ton réseau actuel pourrait devenir un allié précieux si tu osais demander de l'aide ?",
    "Quel espace (communauté, groupe, événement) pourrais-tu rejoindre pour ne plus avancer seul·e ?",
    "À qui pourrais-tu demander un feedback honnête sur ton idée sans craindre le jugement ?"
  ],
  
  clarte: [
    "Si tu devais expliquer ton projet en une phrase à quelqu'un qui ne te connaît pas, que dirais-tu ?",
    "Quelle question profonde sur ce projet évites-tu de te poser en ce moment ?",
    "Qu'est-ce qui te motive vraiment dans cette idée, au-delà de l'argent ou de la reconnaissance ?",
    "Sur quoi as-tu besoin de clarté en priorité pour avancer : le quoi, le pourquoi, le comment ou le pour qui ?",
    "Quel alignement cherches-tu vraiment à travers ce projet avec tes valeurs personnelles ?",
    "Si ce projet échouait, qu'est-ce qui te manquerait le plus : l'activité, l'impact, la liberté, autre chose ?",
    "Comment ce projet s'inscrit-il dans ta vision de vie à 3 ans ?"
  ],
  
  contexte: [
    "Quelle contrainte de ta vie actuelle pèse le plus sur ton projet, et comment pourrais-tu composer avec ?",
    "Comment ton entourage proche réagit-il face à ton projet, et quel impact ça a sur toi ?",
    "Quel équilibre cherches-tu entre ce projet et les autres sphères de ta vie (famille, couple, santé) ?",
    "Quelle tension actuelle dans ta vie personnelle influence le plus ta capacité à avancer ?",
    "Si tu devais réorganiser une partie de ton quotidien pour faire de la place à ce projet, par quoi commencerais-tu ?",
    "Comment pourrais-tu mieux communiquer avec ton entourage sur tes besoins pour porter ce projet ?",
    "Quel sacrifice ou compromis temporaire es-tu prêt·e à faire, et lequel est une ligne rouge ?"
  ],
  
  competences: [
    "Quelle compétence te manque le plus en ce moment pour passer à l'étape suivante ?",
    "Sur une échelle de 1 à 10, comment évalues-tu ta capacité actuelle à apprendre ce qui te manque ?",
    "Quelle partie du projet te fait le plus peur parce que tu ne sais pas faire, et comment pourrais-tu compenser ?",
    "Qui pourrait t'apprendre rapidement ce dont tu as besoin, ou le faire à ta place temporairement ?",
    "Qu'as-tu appris de nouveau cette semaine qui te rapproche de ton objectif ?",
    "Quelle formation, lecture ou expérience concrète pourrais-tu prévoir dans les 15 jours pour progresser ?",
    "Comment pourrais-tu tester ton idée sans avoir besoin de maîtriser toutes les compétences techniques d'abord ?"
  ]
};

/**
 * Sélectionne 3 questions pertinentes selon les freins identifiés
 * @param freins - Liste des freins Alpact à cibler (par ordre de priorité)
 * @param scoreMotivation - Score de motivation (pour adapter le ton si besoin)
 * @returns 3 questions de journal personnalisées
 */
export function selectJournalQuestions(
  freins: AlpactFrein[],
  scoreMotivation?: number
): string[] {
  const selectedQuestions: string[] = [];
  
  // Toujours au moins 1 question du frein principal (le plus critique)
  if (freins.length > 0 && JOURNAL_QUESTIONS_LIBRARY[freins[0]]) {
    const mainFreinQuestions = JOURNAL_QUESTIONS_LIBRARY[freins[0]];
    selectedQuestions.push(
      mainFreinQuestions[Math.floor(Math.random() * mainFreinQuestions.length)]
    );
  }
  
  // 1 question d'un frein secondaire si disponible
  if (freins.length > 1 && JOURNAL_QUESTIONS_LIBRARY[freins[1]]) {
    const secondaryFreinQuestions = JOURNAL_QUESTIONS_LIBRARY[freins[1]];
    let question: string;
    do {
      question = secondaryFreinQuestions[Math.floor(Math.random() * secondaryFreinQuestions.length)];
    } while (selectedQuestions.includes(question) && secondaryFreinQuestions.length > 1);
    selectedQuestions.push(question);
  }
  
  // 1 question liée à la motivation ou clarté (toujours pertinent)
  const motivationOrClarteFrein: AlpactFrein = scoreMotivation && scoreMotivation < 50 ? "confiance" : "clarte";
  const thirdQuestions = JOURNAL_QUESTIONS_LIBRARY[motivationOrClarteFrein];
  let thirdQuestion: string;
  do {
    thirdQuestion = thirdQuestions[Math.floor(Math.random() * thirdQuestions.length)];
  } while (selectedQuestions.includes(thirdQuestion) && thirdQuestions.length > 1);
  selectedQuestions.push(thirdQuestion);
  
  return selectedQuestions.slice(0, 3);
}

/**
 * Mappe une zone d'attention à un frein Alpact
 */
export function mapZoneToFrein(zoneLabel: string): AlpactFrein {
  const label = zoneLabel.toLowerCase();
  
  if (label.includes("énergie") || label.includes("charge mentale") || label.includes("fatigue")) {
    return "energie";
  }
  if (label.includes("temps") || label.includes("priorité") || label.includes("agenda")) {
    return "temps";
  }
  if (label.includes("finance") || label.includes("budget") || label.includes("argent")) {
    return "finances";
  }
  if (label.includes("confiance") || label.includes("légitimité") || label.includes("peur") || label.includes("doute")) {
    return "confiance";
  }
  if (label.includes("isolement") || label.includes("réseau") || label.includes("soutien") || label.includes("seul")) {
    return "isolement";
  }
  if (label.includes("clarté") || label.includes("cap") || label.includes("direction") || label.includes("objectif")) {
    return "clarte";
  }
  if (label.includes("contexte") || label.includes("vie") || label.includes("famille") || label.includes("contrainte")) {
    return "contexte";
  }
  if (label.includes("compétence") || label.includes("skill") || label.includes("savoir")) {
    return "competences";
  }
  
  // Par défaut, clarté (toujours pertinent)
  return "clarte";
}
