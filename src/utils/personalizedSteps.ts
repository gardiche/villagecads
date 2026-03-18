interface LifeSphere {
  name: string;
  key: string;
  level: number;
}

interface SchwartzValue {
  name: string;
  level: number;
}

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  category: "introspection" | "project" | "action";
  actionType?: "complete" | "navigate";
  navigateTo?: "results" | "simulator" | "steps";
}

// Conseils personnalisés par sphère faible
const getSphereAction = (sphereKey: string): { title: string; description: string } => {
  const actions: Record<string, { title: string; description: string }> = {
    soi: {
      title: "Prendre soin de toi",
      description: "Bloque 30 minutes par jour pour une activité qui te ressource (sport, méditation, lecture). Note dans un carnet ce qui te fait du bien et reproduis-le régulièrement.",
    },
    famille: {
      title: "Renforcer tes liens familiaux",
      description: "Organise un moment de qualité avec ta famille cette semaine (repas, appel vidéo, activité). Partage-leur ton projet entrepreneurial et écoute leurs retours.",
    },
    couple: {
      title: "Nourrir ta relation de couple",
      description: "Planifie une date ou un moment privilégié avec ton/ta partenaire pour discuter de vos projets respectifs. Assure-toi qu'il/elle comprenne ton envie d'entreprendre.",
    },
    amis: {
      title: "Reconnecter avec ton cercle social",
      description: "Contacte 2-3 amis cette semaine pour prendre des nouvelles. Parle-leur de ton envie d'entreprendre, ils pourraient avoir des idées ou des contacts utiles.",
    },
    pro: {
      title: "Optimiser ton temps professionnel",
      description: "Identifie 3 heures dans ta semaine que tu pourrais dégager pour travailler sur ton projet. Discute avec ton manager si besoin d'aménager ton temps de travail.",
    },
    loisirs: {
      title: "Retrouver du temps pour tes passions",
      description: "Réserve 1-2 heures cette semaine pour une activité qui te passionne. Tes loisirs peuvent être une source d'inspiration pour ton projet entrepreneurial.",
    },
  };
  
  return actions[sphereKey] || actions.soi;
};

// Conseils basés sur les valeurs Schwartz
const getValueBasedAction = (values: SchwartzValue[]): { title: string; description: string } => {
  if (!values || values.length === 0) {
    return {
      title: "Explorer tes motivations profondes",
      description: "Réfléchis à ce qui te motive vraiment dans la vie et note 3 valeurs fondamentales qui guident tes choix.",
    };
  }
  
  const topValue = values[0].name.toLowerCase();
  
  const valueActions: Record<string, { title: string; description: string }> = {
    autonomie: {
      title: "Définir ta vision personnelle",
      description: "Tu valorises l'autonomie : écris en 10 lignes le projet idéal qui te permettrait d'être ton propre patron et de décider de ton emploi du temps.",
    },
    accomplissement: {
      title: "Fixer ton premier objectif concret",
      description: "Tu es motivé(e) par l'accomplissement : définis 1 objectif SMART (Spécifique, Mesurable, Atteignable, Réaliste, Temporel) pour les 30 prochains jours.",
    },
    bienveillance: {
      title: "Identifier comment aider les autres",
      description: "Tu es guidé(e) par la bienveillance : liste 3 problèmes que rencontrent les gens autour de toi et que tu aimerais résoudre à travers ton projet.",
    },
    stimulation: {
      title: "Explorer de nouvelles opportunités",
      description: "Tu aimes la stimulation : passe 1 heure à découvrir 5 projets entrepreneuriaux innovants dans des domaines qui t'intriguent (podcasts, articles, vidéos).",
    },
    universalisme: {
      title: "Penser ton impact positif",
      description: "Tu veux contribuer au bien commun : réfléchis à comment ton projet pourrait avoir un impact social ou environnemental positif et note 3 idées.",
    },
    pouvoir: {
      title: "Construire ton leadership",
      description: "Tu vises l'influence : identifie 3 compétences de leadership que tu dois développer et trouve 1 ressource (livre, formation, mentor) pour chacune.",
    },
    hedonisme: {
      title: "Allier plaisir et projet",
      description: "Le plaisir te motive : liste 5 activités que tu aimes vraiment faire et réfléchis comment en faire un business qui te fait vibrer au quotidien.",
    },
  };
  
  return valueActions[topValue] || valueActions.autonomie;
};

export const generatePersonalizedSteps = (
  lifeSpheres: LifeSphere[],
  schwartzValues: SchwartzValue[],
  readyScore: number
): Step[] => {
  const steps: Step[] = [];
  
  // INTROSPECTION STEPS (débloquées après avoir vu les résultats)
  
  // Étape 1 : Équilibre personnel basé sur la sphère la plus faible
  if (lifeSpheres && lifeSpheres.length > 0) {
    const weakestSphere = lifeSpheres.reduce((min, sphere) => 
      sphere.level < min.level ? sphere : min
    );
    
    const sphereAction = getSphereAction(weakestSphere.key);
    steps.push({
      id: "balance-life-sphere",
      title: `${sphereAction.title} (${weakestSphere.name})`,
      description: `Ta sphère "${weakestSphere.name}" nécessite de l'attention (${weakestSphere.level}%). ${sphereAction.description}`,
      completed: false,
      locked: false,
      category: "introspection",
    });
  }
  
  // Étape 2 : Action basée sur les valeurs
  const valueAction = getValueBasedAction(schwartzValues);
  steps.push({
    id: "align-with-values",
    title: valueAction.title,
    description: valueAction.description,
    completed: false,
    locked: false,
    category: "introspection",
  });
  
  // PROCHAINES ÉTAPES (projet et action - débloquées après introspection et interaction avec simulateur)
  
  // Étape 3 : Explorer les projets dans le simulateur
  steps.push({
    id: "explore-projects",
    title: "Découvrir des projets qui te correspondent",
    description: "Utilise le simulateur pour swiper au moins 10 projets. Like ceux qui résonnent avec toi, passe ceux qui ne te parlent pas. L'algorithme va apprendre tes préférences.",
    completed: false,
    locked: false,
    category: "project",
    actionType: "navigate",
    navigateTo: "simulator",
  });
  
  // Étape 4 : Approfondir un projet liké
  steps.push({
    id: "deep-dive-project",
    title: "Analyser en profondeur 1 projet qui te plaît",
    description: "Choisis ton projet coup de cœur et réponds à ces questions : Pourquoi ce projet m'attire ? Quelles compétences dois-je développer ? Combien de temps puis-je y consacrer par semaine ?",
    completed: false,
    locked: true,
    category: "project",
  });
  
  // Étape 5 : Première action concrète
  steps.push({
    id: "first-concrete-action",
    title: "Réaliser ta première micro-action",
    description: "Choisis LA plus petite action possible pour avancer sur ton projet (ex: parler à 1 personne du domaine, lire 1 article, regarder 1 tuto, créer 1 post sur les réseaux). Fais-le cette semaine.",
    completed: false,
    locked: true,
    category: "action",
  });
  
  // Étape 6 : Validation externe
  steps.push({
    id: "get-feedback",
    title: "Obtenir 3 retours extérieurs",
    description: "Présente ton idée à 3 personnes différentes (ami, famille, inconnu dans le domaine). Note leurs questions et objections, c'est précieux pour affiner ton projet.",
    completed: false,
    locked: true,
    category: "action",
  });
  
  // Étape 7 : Définir le MVP (Minimum Viable Product)
  steps.push({
    id: "define-mvp",
    title: "Définir ta version minimale viable",
    description: "Décris en 5 lignes maximum la version la plus simple de ton projet que tu pourrais tester rapidement (en 1-2 mois max). Qu'est-ce qui est vraiment essentiel ?",
    completed: false,
    locked: true,
    category: "action",
  });
  
  return steps;
};
