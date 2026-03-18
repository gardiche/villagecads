import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Zap, ArrowRight, Target, TrendingUp, Shield, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonaRestitutionProps {
  equilibreValues: Record<string, number>;
  motivations: string[];
  scenarioAnswers: Record<number, string>;
  environnement: Record<string, number>;
  onContinue: () => void;
}

interface Persona {
  id: string;
  titre: string;
  synthese: string;
  forces: string[];
  verrous: string[];
  microActions: Array<{
    titre: string;
    duree: string;
    impact: string;
    jauge: string;
  }>;
  cap2_4semaines: string;
  gardeFou: string;
}

const PERSONAS: Record<string, Persona> = {
  dynamique_presse: {
    id: "dynamique_presse",
    titre: "Le Dynamique Pressé",
    synthese: "Vous avancez vite, vous voulez concrétiser, mais votre temps est sous tension. On va vous aider à agir sans vous épuiser.",
    forces: [
      "Vous avez une énergie naturelle pour avancer",
      "Vous savez identifier les opportunités rapidement",
      "Votre capacité d'exécution est un vrai atout"
    ],
    verrous: [
      "Vous risquez de vous surcharger en voulant tout faire",
      "Le manque de temps peut vous faire perdre de vue l'essentiel",
      "Vous pouvez vous sentir frustré si les résultats tardent"
    ],
    microActions: [
      {
        titre: "Bloquer 2h fixes dans votre semaine",
        duree: "15 min",
        impact: "Vous reprenez le contrôle de votre agenda",
        jauge: "temps"
      },
      {
        titre: "Identifier 1 tâche mini qui fait avancer l'essentiel",
        duree: "20 min",
        impact: "Vous progressez sans vous disperser",
        jauge: "clarte"
      },
      {
        titre: "Lister 3 choses à NE PAS faire cette semaine",
        duree: "10 min",
        impact: "Vous libérez de l'espace mental",
        jauge: "energie"
      }
    ],
    cap2_4semaines: "En 2-4 semaines, vous aurez défini un rythme tenable, avancé sur 1-2 jalons clés, et senti que vous pouvez tenir sur la durée.",
    gardeFou: "Si vous sentez que vous courez dans tous les sens : STOP. Prenez 1h pour clarifier votre priorité #1 des 7 prochains jours. Le reste peut attendre."
  },
  prudent_bloque: {
    id: "prudent_bloque",
    titre: "Le Prudent Bloqué",
    synthese: "Vous voyez clair, vous maîtrisez les risques, mais vous vous retenez trop. On va sécuriser vos premiers pas.",
    forces: [
      "Vous analysez les situations en profondeur",
      "Vous anticipez les obstacles potentiels",
      "Votre réflexion vous protège des erreurs évitables"
    ],
    verrous: [
      "Vous attendez d'être 100% prêt avant d'agir",
      "Le perfectionnisme peut vous paralyser",
      "Vous doutez de votre légitimité à vous lancer"
    ],
    microActions: [
      {
        titre: "Identifier 1 compétence que vous avez déjà et qui sert votre projet",
        duree: "15 min",
        impact: "Vous voyez ce que vous apportez déjà",
        jauge: "competences"
      },
      {
        titre: "Envoyer 1 message à 1 personne pour tester votre idée",
        duree: "30 min",
        impact: "Vous gagnez en confiance",
        jauge: "soutien"
      },
      {
        titre: "Lister 3 preuves que vous avez déjà résolu des problèmes similaires",
        duree: "20 min",
        impact: "Vous ancrez votre légitimité dans le réel",
        jauge: "motivation"
      }
    ],
    cap2_4semaines: "En 2-4 semaines, vous aurez validé quelques hypothèses clés, pris 1-2 décisions concrètes, et commencé à construire votre confiance pas à pas.",
    gardeFou: "Si vous vous surprenez à reporter encore : posez-vous cette question : 'Quelle est LA plus petite action que je peux faire maintenant ?'. Et faites-la."
  },
  equilibriste_surcharge: {
    id: "equilibriste_surcharge",
    titre: "L'Équilibriste Surchargé",
    synthese: "Vous savez gérer beaucoup de choses en même temps, mais votre bande passante est limitée. On va avancer petit mais régulier.",
    forces: [
      "Vous avez développé une excellente capacité d'organisation",
      "Vous savez jongler entre plusieurs responsabilités",
      "Votre résilience face aux contraintes est remarquable"
    ],
    verrous: [
      "Vous risquez l'épuisement si vous ne posez pas de limites",
      "L'équilibre vie pro/perso est fragile",
      "Vous pouvez culpabiliser de prendre du temps pour vous"
    ],
    microActions: [
      {
        titre: "Identifier 1 créneau de 30min dans votre semaine pour votre projet",
        duree: "10 min",
        impact: "Vous créez un espace dédié sans tout chambouler",
        jauge: "temps"
      },
      {
        titre: "Noter 3 signes qui montrent que vous êtes en surcharge",
        duree: "15 min",
        impact: "Vous reconnaissez vos limites avant la rupture",
        jauge: "energie"
      },
      {
        titre: "Choisir 1 chose à déléguer ou abandonner temporairement",
        duree: "20 min",
        impact: "Vous libérez de l'espace pour l'essentiel",
        jauge: "equilibre"
      }
    ],
    cap2_4semaines: "En 2-4 semaines, vous aurez trouvé un rythme soutenable, avancé sur quelques micro-jalons sans sacrifier votre équilibre, et senti que c'est possible.",
    gardeFou: "Si vous sentez que tout déborde : STOP. Prenez 30min pour lister ce qui peut attendre. Votre projet doit s'intégrer dans votre vie, pas la dévorer."
  },
  creatif_disperse: {
    id: "creatif_disperse",
    titre: "Le Créatif Dispersé",
    synthese: "Vous avez mille idées, c'est une force rare, mais vous changez trop vite. On va vous aider à ancrer une seule piste durablement.",
    forces: [
      "Votre créativité est une richesse exceptionnelle",
      "Vous voyez des possibilités là où d'autres ne voient rien",
      "Votre curiosité vous permet d'explorer des territoires inédits"
    ],
    verrous: [
      "Vous passez d'une idée à l'autre sans finir",
      "La diversité de vos intérêts peut vous disperser",
      "Vous risquez de ne jamais concrétiser faute de focus"
    ],
    microActions: [
      {
        titre: "Choisir UNE idée et noter pourquoi celle-là aujourd'hui",
        duree: "20 min",
        impact: "Vous ancrez un choix conscient",
        jauge: "clarte"
      },
      {
        titre: "Créer un 'parking à idées' pour les autres projets",
        duree: "15 min",
        impact: "Vous libérez votre esprit sans perdre vos pépites",
        jauge: "organisation"
      },
      {
        titre: "Définir 1 critère simple pour savoir si vous avancez sur la bonne idée",
        duree: "25 min",
        impact: "Vous gardez un fil conducteur clair",
        jauge: "motivation"
      }
    ],
    cap2_4semaines: "En 2-4 semaines, vous aurez tenu sur UNE idée, avancé sur 2-3 jalons concrets, et senti qu'approfondir vaut mieux que multiplier.",
    gardeFou: "Si une nouvelle idée surgit : notez-la dans votre parking. Revenez-y dans 1 mois. Si elle est toujours là, c'est qu'elle mérite vraiment votre attention."
  },
  autonome_isole: {
    id: "autonome_isole",
    titre: "L'Autonome Isolé",
    synthese: "Vous savez avancer seul, mais vous manquez de retour extérieur. On va vous aider à créer un minimum d'appuis autour de vous.",
    forces: [
      "Vous êtes capable de travailler de façon indépendante",
      "Vous n'avez pas besoin d'être rassuré en permanence",
      "Votre capacité à avancer seul est une force précieuse"
    ],
    verrous: [
      "L'isolement peut créer des angles morts",
      "Vous manquez de feedback pour ajuster votre trajectoire",
      "Vous risquez de tourner en rond sans vous en rendre compte"
    ],
    microActions: [
      {
        titre: "Identifier 1 personne qui pourrait vous donner un avis constructif",
        duree: "15 min",
        impact: "Vous sortez de votre bulle",
        jauge: "soutien"
      },
      {
        titre: "Rejoindre 1 communauté (en ligne ou physique) liée à votre projet",
        duree: "30 min",
        impact: "Vous créez des points de contact réguliers",
        jauge: "reseau"
      },
      {
        titre: "Partager 1 avancée ou 1 doute avec quelqu'un cette semaine",
        duree: "20 min",
        impact: "Vous rompez l'isolement progressivement",
        jauge: "confiance"
      }
    ],
    cap2_4semaines: "En 2-4 semaines, vous aurez créé 2-3 liens de confiance, reçu des retours qui vous font avancer, et senti qu'un peu d'appui externe change tout.",
    gardeFou: "Si vous sentez que vous stagnez : posez-vous cette question : 'À qui pourrais-je en parler pour avoir un regard neuf ?'. Et contactez cette personne dans les 48h."
  }
};

export const PersonaRestitution = ({ 
  equilibreValues, 
  motivations, 
  scenarioAnswers, 
  environnement, 
  onContinue 
}: PersonaRestitutionProps) => {
  const [personaImages, setPersonaImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingImage, setLoadingImage] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [personalizedActions, setPersonalizedActions] = useState<Array<{
    titre: string;
    duree: string;
    impact: string;
    justification?: string;
  }>>([]);
  
  // Détecter le persona basé sur les données du questionnaire
  const detectPersona = (): Persona => {
    // Extraction des valeurs clés
    const energie = equilibreValues.energie || 50;
    const temps = equilibreValues.temps || 50;
    const soutien = equilibreValues.soutien || 50;
    const soi = equilibreValues.soi || 50; // Énergie personnelle/santé
    
    // Analyser les comportements via scenarioAnswers
    // Carte 1 (scenario 0): "je doute" vs "j'agis vite" vs autre
    // Carte 2 (scenario 1): "je me disperse" vs "j'avance seul" vs autre
    // Carte 3 (scenario 2): "j'ai besoin d'un cadre" vs autre
    const reponse1 = scenarioAnswers[0] || "";
    const reponse2 = scenarioAnswers[1] || "";
    
    // Analyser le réseau depuis environnement
    const reseau = environnement.reseau || 50;
    
    // Règles d'inférence basées sur les 3 premières questions
    // PRIORITÉ AUX RÉPONSES EXPLICITES (scenarioAnswers) avant les valeurs calculées
    
    // 1. Prudent Bloqué: "Je doute souvent" (réponse explicite prioritaire)
    if (reponse1.includes("doute") || reponse1.includes("peur") || reponse1.includes("stress") || reponse1 === "A") {
      return PERSONAS.prudent_bloque;
    }
    
    // 2. Dynamique Pressé: "J'agis vite" + énergie haute + temps bas
    if (reponse1.includes("agis vite") || reponse1.includes("action") || reponse1 === "C") {
      if (energie > 60 && temps < 40) {
        return PERSONAS.dynamique_presse;
      }
    }
    
    // 3. Créatif Dispersé: "Je me disperse" (réponse explicite)
    if (reponse2.includes("disperse") || reponse2.includes("idées") || reponse2.includes("plusieurs") || reponse2 === "B") {
      return PERSONAS.creatif_disperse;
    }
    
    // 4. Équilibriste Surchargé: Charge mentale élevée + manque d'énergie personnelle/santé
    // CORRECTION: Basé sur soi (énergie personnelle/santé) plutôt que temps
    if (soi < 40 || (equilibreValues.famille && equilibreValues.famille < 40)) {
      return PERSONAS.equilibriste_surcharge;
    }
    
    // 5. Autonome Isolé: Réseau faible + pas de besoin de pair
    if (reseau < 40 || soutien < 40) {
      return PERSONAS.autonome_isole;
    }
    
    // Fallback: si aucun pattern ne correspond, on choisit le plus pertinent selon l'énergie
    if (energie > 60 && motivations.length > 0) {
      return PERSONAS.dynamique_presse;
    }
    
    // Default: Prudent Bloqué (le plus commun)
    return PERSONAS.prudent_bloque;
  };

  const persona = detectPersona();

  // Save persona data (including visual) for reuse in dashboard and sharing
  useEffect(() => {
    try {
      const existingStr = sessionStorage.getItem('astryd_persona_data');
      let previousVisualUrl: string | null = null;
      if (existingStr) {
        try {
          const existing = JSON.parse(existingStr);
          previousVisualUrl = existing.visualUrl || null;
        } catch (e) {
          console.error('Error parsing existing persona data from localStorage:', e);
        }
      }

      const visualUrl = personaImages.length > 0
        ? personaImages[selectedImageIndex]
        : previousVisualUrl || null;

      const personaData = {
        titre: persona.titre,
        synthese: persona.synthese,
        forces: persona.forces,
        verrous: persona.verrous,
        cap2_4semaines: persona.cap2_4semaines,
        gardeFou: persona.gardeFou,
        visualUrl,
      };

      sessionStorage.setItem('astryd_persona_data', JSON.stringify(personaData));
    } catch (e) {
      console.error('Error saving persona data to sessionStorage:', e);
    }
  }, [persona, personaImages, selectedImageIndex]);

  // Generate personalized micro-actions via AI
  useEffect(() => {
    const generateActions = async () => {
      try {
        setLoadingActions(true);
        console.log('Calling generate-persona-micro-actions with data:', {
          equilibreValues,
          motivations,
          scenarioAnswers,
          environnement
        });

        const { data, error } = await supabase.functions.invoke('generate-persona-micro-actions', {
          body: { 
            equilibreValues, 
            motivations, 
            scenarioAnswers, 
            environnement 
          }
        });
        
        if (error) {
          console.error('Error generating actions:', error);
          toast.error("Erreur lors de la génération des actions");
          // Fallback sur les actions statiques du persona
          setPersonalizedActions(persona.microActions.map(a => ({
            titre: a.titre,
            duree: a.duree,
            impact: a.impact
          })));
        } else if (data?.micro_actions && Array.isArray(data.micro_actions)) {
          console.log('Personalized actions received:', data.micro_actions);
          setPersonalizedActions(data.micro_actions);

          try {
            sessionStorage.setItem('astryd_attention_zones_profile', JSON.stringify(data.attention_zones || []));
            sessionStorage.setItem('astryd_micro_actions_profile', JSON.stringify(data.micro_actions || []));

            // Enrichir aussi les données persona existantes avec le visuel retourné par l'API
            const existingStr = sessionStorage.getItem('astryd_persona_data');
            const existing = existingStr ? JSON.parse(existingStr) : {};
            const enrichedPersona = {
              ...existing,
              titre: data.titre || existing.titre,
              synthese: data.synthese || existing.synthese,
              forces: data.forces || existing.forces,
              verrous: data.verrous || existing.verrous,
              cap2_4semaines: data.cap2_4semaines || existing.cap2_4semaines,
              gardeFou: data.gardeFou || existing.gardeFou,
              // Normaliser le nom de la propriété en visualUrl (pas visual_url)
              visualUrl: data.visual_url || data.visualUrl || existing.visualUrl || null,
            };
            sessionStorage.setItem('astryd_persona_data', JSON.stringify(enrichedPersona));
            console.log('✅ Persona data enriched with visual:', enrichedPersona.visualUrl);
          } catch (e) {
            console.error('Error saving persona/micro-actions to localStorage:', e);
          }
        } else {
          // Fallback sur les actions statiques
          setPersonalizedActions(persona.microActions.map(a => ({
            titre: a.titre,
            duree: a.duree,
            impact: a.impact
          })));
        }
      } catch (error) {
        console.error('Error in generateActions:', error);
        // Fallback sur les actions statiques
        setPersonalizedActions(persona.microActions.map(a => ({
          titre: a.titre,
          duree: a.duree,
          impact: a.impact
        })));
      } finally {
        setLoadingActions(false);
      }
    };

    generateActions();
  }, []);

  // Generate persona visual variations
  useEffect(() => {
    const generateVisuals = async () => {
      try {
        setLoadingImage(true);
        const { data, error } = await supabase.functions.invoke('generate-persona-visual', {
          body: { personaId: persona.id }
        });
        
        if (error) throw error;
        if (data?.imageUrls && Array.isArray(data.imageUrls)) {
          setPersonaImages(data.imageUrls);
        }
      } catch (error) {
        console.error('Error generating persona visuals:', error);
      } finally {
        setLoadingImage(false);
      }
    };

    generateVisuals();
  }, [persona.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section avec visuel IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 px-4 py-2 text-base bg-primary text-primary-foreground border-0">
            Profil détecté
          </Badge>
          
          {/* Images générées par IA avec sélection */}
          <div className="mb-6 w-full max-w-2xl mx-auto">
            {loadingImage ? (
              <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-muted flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Génération de 3 variations visuelles...</p>
                </div>
              </div>
            ) : personaImages.length > 0 ? (
              <div className="space-y-4">
                {/* Image principale sélectionnée */}
                <motion.div 
                  key={selectedImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full rounded-2xl overflow-hidden shadow-sm"
                >
                  <img 
                    src={personaImages[selectedImageIndex]} 
                    alt={`${persona.titre} - Variation ${selectedImageIndex + 1}`}
                    className="w-full h-auto object-contain"
                  />
                </motion.div>
                
                {/* Miniatures de sélection */}
                <div className="flex gap-3 justify-center">
                  {personaImages.map((imageUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative w-28 h-20 rounded-lg overflow-hidden transition-all ${
                        selectedImageIndex === index 
                          ? 'ring-3 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-lg' 
                          : 'opacity-50 hover:opacity-80 hover:scale-105'
                      }`}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Variation ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Cliquez sur une variation pour changer le visuel
                </p>
              </div>
            ) : (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-sm bg-muted" />
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {persona.titre}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {persona.synthese}
          </p>
        </motion.div>

        {/* Forces & Verrous */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-2 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Vos forces</h3>
              </div>
              <ul className="space-y-3">
                {persona.forces.map((force, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{force}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-2 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Vos verrous</h3>
              </div>
              <ul className="space-y-3">
                {persona.verrous.map((verrou, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{verrou}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>

        {/* Micro-actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              3 micro-actions pour commencer
            </h2>
            <p className="text-muted-foreground">
              Des actions concrètes, adaptées à votre profil, pour débloquer votre élan
            </p>
          </div>
          
          <div className="grid gap-4">
            {loadingActions ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Génération de vos micro-actions personnalisées...
                </p>
              </Card>
            ) : (
              personalizedActions.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-foreground">{action.titre}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{action.impact}</p>
                        <div className="flex gap-3 text-xs">
                          <Badge variant="outline" className="gap-1">
                            <Zap className="w-3 h-3" />
                            {action.duree}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Cap 2-4 semaines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <Card className="p-6 bg-secondary border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Cap 2–4 semaines</h3>
                <p className="text-foreground/90">{persona.cap2_4semaines}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Garde-fou */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <Card className="p-6 bg-orange-50/50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Votre garde-fou</h3>
                <p className="text-foreground/90">{persona.gardeFou}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={onContinue}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-sm group"
          >
            Continuer et préciser mes résultats
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Précise ton idée et tes compétences pour un diagnostic complet personnalisé
          </p>
        </motion.div>
      </div>
    </div>
  );
};
