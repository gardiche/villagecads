import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TEST_PROFILES = {
  profil1_temps_contraints: {
    name: "Profil 1 : Temps très contraint + Énergie faible",
    equilibreValues: {
      energie: 35,
      temps: 15,
      famille: 80,
      finances: 40
    },
    motivations: [
      "Je veux plus d'autonomie dans mon travail",
      "Je veux créer quelque chose qui a du sens pour moi",
      "Je veux pouvoir gérer mon temps comme je le souhaite"
    ],
    scenarioAnswers: {
      1: "J'ai tendance à procrastiner quand une tâche me semble trop grosse",
      2: "Je préfère travailler seul·e et avancer à mon rythme",
      3: "Je me sens vite débordé·e quand j'ai trop de choses à gérer"
    },
    environnement: {
      reseau: 25,
      mentors: 10,
      competences: 60,
      marge_manoeuvre: 20
    }
  },
  profil2_motivation_elevee: {
    name: "Profil 2 : Motivation élevée + Réseau faible",
    equilibreValues: {
      energie: 75,
      temps: 50,
      famille: 60,
      finances: 55
    },
    motivations: [
      "Je veux prouver que je peux réussir par moi-même",
      "Je veux avoir un impact positif dans mon domaine",
      "Je cherche à développer mes compétences entrepreneuriales"
    ],
    scenarioAnswers: {
      1: "Je fonce directement dans l'action sans trop réfléchir",
      2: "J'aime échanger avec d'autres pour avancer",
      3: "Je doute souvent de ma légitimité à me lancer"
    },
    environnement: {
      reseau: 20,
      mentors: 15,
      competences: 70,
      marge_manoeuvre: 65
    }
  },
  profil3_finances_limitees: {
    name: "Profil 3 : Finances très limitées + Compétences techniques faibles",
    equilibreValues: {
      energie: 60,
      temps: 45,
      famille: 50,
      finances: 15
    },
    motivations: [
      "Je dois absolument générer des revenus rapidement",
      "Je veux sortir d'une situation financière difficile",
      "Je cherche une activité qui demande peu d'investissement initial"
    ],
    scenarioAnswers: {
      1: "J'analyse beaucoup avant de me lancer",
      2: "Je préfère avancer seul·e pour économiser",
      3: "Je me sens limité·e par mon manque de compétences techniques"
    },
    environnement: {
      reseau: 40,
      mentors: 30,
      competences: 30,
      marge_manoeuvre: 50
    }
  }
};

export default function TestMicroActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const testProfile = async (profileKey: string) => {
    setLoading(profileKey);
    const profile = TEST_PROFILES[profileKey as keyof typeof TEST_PROFILES];
    
    try {
      console.log(`Testing profile: ${profile.name}`, profile);
      
      const { data, error } = await supabase.functions.invoke('generate-persona-micro-actions', {
        body: {
          equilibreValues: profile.equilibreValues,
          motivations: profile.motivations,
          scenarioAnswers: profile.scenarioAnswers,
          environnement: profile.environnement
        }
      });

      if (error) throw error;

      console.log(`Results for ${profile.name}:`, data);
      
      setResults(prev => ({
        ...prev,
        [profileKey]: data
      }));
      
      toast.success(`Micro-actions générées pour ${profile.name}`);
    } catch (error) {
      console.error('Error testing profile:', error);
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const testAllProfiles = async () => {
    for (const profileKey of Object.keys(TEST_PROFILES)) {
      await testProfile(profileKey);
      // Petit délai entre chaque test
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Micro-Actions Personnalisées</h1>
          <p className="text-muted-foreground">
            Valider que les micro-actions citent explicitement les contraintes et sont ultra-personnalisées
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button 
            onClick={testAllProfiles}
            disabled={loading !== null}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              "Tester tous les profils"
            )}
          </Button>
        </div>

        <div className="grid gap-6">
          {Object.entries(TEST_PROFILES).map(([key, profile]) => (
            <Card key={key} className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">{profile.name}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                  <div>
                    <strong>Équilibre:</strong> Énergie {profile.equilibreValues.energie}/100, 
                    Temps {profile.equilibreValues.temps}/100, 
                    Finances {profile.equilibreValues.finances}/100
                  </div>
                  <div>
                    <strong>Environnement:</strong> Réseau {profile.environnement.reseau}/100, 
                    Compétences {profile.environnement.competences}/100
                  </div>
                </div>
                <Button
                  onClick={() => testProfile(key)}
                  disabled={loading !== null}
                  variant="outline"
                  size="sm"
                >
                  {loading === key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    "Tester ce profil"
                  )}
                </Button>
              </div>

              {results[key] && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Micro-actions générées
                  </h3>
                  {results[key].micro_actions?.map((action: any, idx: number) => (
                    <Card key={idx} className="p-4 bg-secondary/20">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">{action.titre}</p>
                          <p className="text-sm text-muted-foreground mb-2">{action.duree}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong className="text-foreground">Impact:</strong>
                          <p className="text-muted-foreground mt-1">{action.impact}</p>
                        </div>
                        <div>
                          <strong className="text-foreground">Justification:</strong>
                          <p className="text-muted-foreground mt-1">{action.justification}</p>
                        </div>
                        {/* Validation visuelle */}
                        <div className="mt-3 flex items-start gap-2 text-xs">
                          {(action.justification.includes('/100') || 
                            action.impact.includes('/100') ||
                            /\d+\/100/.test(action.justification) ||
                            /\d+\/100/.test(action.impact)) ? (
                            <>
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-green-600">
                                ✓ Cite des contraintes spécifiques (scores présents)
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                              <span className="text-orange-600">
                                ⚠ Pas de citation explicite de contraintes chiffrées
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
