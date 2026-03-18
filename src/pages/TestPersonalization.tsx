import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";

type TestScenario = {
  id: string;
  name: string;
  description: string;
  profileData: {
    equilibreValues: Record<string, number>;
    motivations: string[];
    scenarioAnswers: Record<number, string>;
    environnement: Record<string, number>;
  };
  ideaData?: {
    title: string;
    description: string;
  };
};

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: "dynamique-presse",
    name: "Le Dynamique Pressé",
    description: "Profil haute énergie, temps limité, agit vite",
    profileData: {
      equilibreValues: { energie: 75, temps: 30, soutien: 60, famille: 50 },
      motivations: ["accomplissement", "stimulation", "autonomie"],
      scenarioAnswers: {
        0: "B", // Expérimenter face à l'incertitude
        1: "B", // Se lancer directement
        2: "A"  // Insister seul
      },
      environnement: { reseau: 55, contextePro: 60, margeManoeuvre: 65 }
    },
    ideaData: {
      title: "Application mobile de coaching fitness",
      description: "Une app qui propose des séances de sport personnalisées de 15 minutes pour les professionnels pressés"
    }
  },
  {
    id: "prudent-bloque",
    name: "Le Prudent Bloqué",
    description: "Profil analytique, prudent, peur de se lancer",
    profileData: {
      equilibreValues: { energie: 55, temps: 60, soutien: 70, famille: 60 },
      motivations: ["securite", "bienveillance", "conformite"],
      scenarioAnswers: {
        0: "A", // Attendre face à l'incertitude
        1: "A", // Planifier longuement
        2: "C"  // Prendre du recul
      },
      environnement: { reseau: 40, contextePro: 50, margeManoeuvre: 45 }
    },
    ideaData: {
      title: "Plateforme de mentorat pour entrepreneurs",
      description: "Un service qui connecte entrepreneurs débutants avec mentors expérimentés"
    }
  },
  {
    id: "equilibriste-surcharge",
    name: "L'Équilibriste Surchargé",
    description: "Profil surchargé, temps et énergie limités, contraintes familiales",
    profileData: {
      equilibreValues: { energie: 35, temps: 25, soutien: 50, famille: 30 },
      motivations: ["securite", "bienveillance", "tradition"],
      scenarioAnswers: {
        0: "C", // Se renseigner
        1: "A", // Planifier
        2: "B"  // En parler
      },
      environnement: { reseau: 45, contextePro: 40, margeManoeuvre: 35 }
    },
    ideaData: {
      title: "E-commerce de produits artisanaux locaux",
      description: "Boutique en ligne vendant des créations d'artisans de la région"
    }
  },
  {
    id: "creatif-disperse",
    name: "Le Créatif Dispersé",
    description: "Profil créatif, plein d'idées, difficulté à choisir",
    profileData: {
      equilibreValues: { energie: 70, temps: 55, soutien: 45, famille: 60 },
      motivations: ["stimulation", "autonomie", "hedonisme"],
      scenarioAnswers: {
        0: "B", // Expérimenter
        1: "B", // Se lancer
        2: "A"  // Insister seul
      },
      environnement: { reseau: 50, contextePro: 60, margeManoeuvre: 70 }
    },
    ideaData: {
      title: "Studio de création de contenu vidéo",
      description: "Agence créative spécialisée dans les vidéos courtes pour réseaux sociaux"
    }
  },
  {
    id: "autonome-isole",
    name: "L'Autonome Isolé",
    description: "Profil indépendant, réseau limité, avance seul",
    profileData: {
      equilibreValues: { energie: 60, temps: 50, soutien: 30, famille: 55 },
      motivations: ["autonomie", "accomplissement", "securite"],
      scenarioAnswers: {
        0: "C", // Se renseigner
        1: "A", // Planifier
        2: "A"  // Insister seul
      },
      environnement: { reseau: 25, contextePro: 50, margeManoeuvre: 60 }
    },
    ideaData: {
      title: "SaaS de gestion de projet pour freelances",
      description: "Outil de gestion et facturation simplifié pour travailleurs indépendants"
    }
  },
];

type TestResult = {
  scenarioId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  personaDetected?: string;
  hasNanoBanana?: boolean;
  zonesCount?: number;
  microActionsCount?: number;
  isUnique?: boolean;
  error?: string;
  duration?: number;
};

export default function TestPersonalization() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);

  const updateResult = (scenarioId: string, updates: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [scenarioId]: { ...prev[scenarioId], scenarioId, ...updates }
    }));
  };

  const runSingleScenario = async (scenario: TestScenario): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      updateResult(scenario.id, { status: 'running' });
      setCurrentScenario(scenario.id);

      // 1. Generate persona + micro-actions (simule l'onboarding profil)
      console.log(`[${scenario.name}] Calling generate-persona-micro-actions...`);
      const { data: personaData, error: personaError } = await supabase.functions.invoke(
        'generate-persona-micro-actions',
        {
          body: {
            equilibreValues: scenario.profileData.equilibreValues,
            motivations: scenario.profileData.motivations,
            scenarioAnswers: scenario.profileData.scenarioAnswers,
            environnement: scenario.profileData.environnement,
          }
        }
      );

      if (personaError || !personaData) {
        throw new Error(`Persona generation failed: ${personaError?.message || 'No data'}`);
      }

      const personaDetected = personaData.persona_profil?.titre || personaData.titre || "Unknown";
      const hasNanoBanana = !!personaData.visual_url || !!personaData.persona_profil?.visualUrl;

      console.log(`[${scenario.name}] Persona detected:`, personaDetected);
      console.log(`[${scenario.name}] Has Nano Banana:`, hasNanoBanana);

      // 2. Si ideaData fourni, créer l'idée et appeler astryd-analyse
      let zonesCount = personaData.attention_zones?.length || 0;
      let microActionsCount = personaData.micro_actions?.length || 0;

      if (scenario.ideaData) {
        console.log(`[${scenario.name}] Creating idea and calling astryd-analyse...`);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Créer l'idée
        const { data: idea, error: ideaError } = await supabase
          .from('ideas')
          .insert({
            user_id: user.id,
            title: `[TEST] ${scenario.ideaData.title}`,
            description: scenario.ideaData.description,
          })
          .select()
          .single();

        if (ideaError) throw new Error(`Idea creation failed: ${ideaError.message}`);

        // Appeler astryd-analyse
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
          'astryd-analyse',
          {
            body: {
              ideaId: idea.id,
              userId: user.id,
              personaData: personaData.persona_profil || {
                titre: personaDetected,
                synthese: personaData.synthese,
                forces: personaData.forces,
                verrous: personaData.verrous,
              }
            }
          }
        );

        if (analysisError) {
          throw new Error(`Astryd analyse failed: ${analysisError.message}`);
        }

        console.log(`[${scenario.name}] Analysis completed:`, analysisData);

        // Vérifier ce qui a été écrit en base
        const { data: zones } = await supabase
          .from('attention_zones')
          .select('*')
          .eq('idea_id', idea.id);

        const { data: microActions } = await supabase
          .from('micro_commitments')
          .select('*')
          .eq('idea_id', idea.id);

        zonesCount = zones?.length || 0;
        microActionsCount = microActions?.length || 0;

        console.log(`[${scenario.name}] Zones in DB:`, zonesCount);
        console.log(`[${scenario.name}] Micro-actions in DB:`, microActionsCount);

        // Cleanup: supprimer l'idée de test
        await supabase.from('ideas').delete().eq('id', idea.id);
      }

      const duration = Date.now() - startTime;

      // Vérifier l'unicité (pas de contenu générique répété)
      const isUnique = 
        personaDetected !== "Unknown" &&
        zonesCount > 0 &&
        microActionsCount > 0;

      updateResult(scenario.id, {
        status: 'success',
        personaDetected,
        hasNanoBanana,
        zonesCount,
        microActionsCount,
        isUnique,
        duration
      });

      return {
        scenarioId: scenario.id,
        status: 'success',
        personaDetected,
        hasNanoBanana,
        zonesCount,
        microActionsCount,
        isUnique,
        duration
      };

    } catch (error: any) {
      console.error(`[${scenario.name}] Test failed:`, error);
      updateResult(scenario.id, {
        status: 'error',
        error: error.message
      });
      return {
        scenarioId: scenario.id,
        status: 'error',
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults({});

    for (const scenario of TEST_SCENARIOS) {
      await runSingleScenario(scenario);
      // Pause entre les tests pour éviter rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsRunning(false);
    setCurrentScenario(null);
    toast.success("Tests terminés !");
  };

  const runSingleTest = async (scenarioId: string) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setIsRunning(true);
    await runSingleScenario(scenario);
    setIsRunning(false);
    setCurrentScenario(null);
  };

  const resetTests = () => {
    setResults({});
    toast.info("Résultats réinitialisés");
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/30 bg-green-500/5';
      case 'error':
        return 'border-destructive/30 bg-destructive/5';
      case 'running':
        return 'border-primary/30 bg-primary/5';
      default:
        return 'border-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Tests de personnalisation" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tests automatisés de personnalisation</h1>
          <p className="text-muted-foreground">
            Vérifie la cohérence complète du pipeline : persona, Nano Banana, zones d'attention, micro-actions et hyper-personnalisation
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contrôles</CardTitle>
            <CardDescription>
              Lance les tests pour valider le système de personnalisation
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Lancer tous les tests
                </>
              )}
            </Button>
            <Button
              onClick={resetTests}
              disabled={isRunning}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="scenarios" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scenarios">Scénarios de test</TabsTrigger>
            <TabsTrigger value="summary">Résumé</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            {TEST_SCENARIOS.map(scenario => {
              const result = results[scenario.id];
              
              return (
                <Card key={scenario.id} className={`transition-all ${result ? getStatusColor(result.status) : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result?.status || 'pending')}
                        <div>
                          <CardTitle className="text-lg">{scenario.name}</CardTitle>
                          <CardDescription>{scenario.description}</CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleTest(scenario.id)}
                        disabled={isRunning}
                      >
                        Tester
                      </Button>
                    </div>
                  </CardHeader>

                  {result && result.status !== 'pending' && (
                    <CardContent className="space-y-3">
                      {result.status === 'running' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Test en cours...
                        </div>
                      )}

                      {result.status === 'success' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Persona détecté</span>
                            <div className="font-medium mt-1">{result.personaDetected}</div>
                            {result.personaDetected === scenario.name && (
                              <Badge variant="outline" className="mt-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                                ✓ Correct
                              </Badge>
                            )}
                            {result.personaDetected !== scenario.name && (
                              <Badge variant="outline" className="mt-1 text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                                ⚠ Attendu: {scenario.name}
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Nano Banana</span>
                            <div className="font-medium mt-1">
                              {result.hasNanoBanana ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                                  ✓ Présent
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
                                  ✗ Absent
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Zones d'attention</span>
                            <div className="font-medium mt-1">
                              {result.zonesCount || 0} zone(s)
                              {(result.zonesCount || 0) >= 3 && (
                                <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                                  ✓ OK
                                </Badge>
                              )}
                              {(result.zonesCount || 0) < 3 && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                                  ⚠ Minimum 3
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Micro-actions</span>
                            <div className="font-medium mt-1">
                              {result.microActionsCount || 0} action(s)
                              {(result.microActionsCount || 0) >= 3 && (
                                <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                                  ✓ OK
                                </Badge>
                              )}
                              {(result.microActionsCount || 0) < 3 && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                                  ⚠ Minimum 3
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Hyper-personnalisé</span>
                            <div className="font-medium mt-1">
                              {result.isUnique ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                                  ✓ Unique
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 dark:text-red-400">
                                  ✗ Générique
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Durée</span>
                            <div className="font-medium mt-1">
                              {result.duration ? `${(result.duration / 1000).toFixed(1)}s` : '-'}
                            </div>
                          </div>
                        </div>
                      )}

                      {result.status === 'error' && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium mb-1">Erreur</div>
                            <div className="text-xs opacity-90">{result.error}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Résumé des tests</CardTitle>
                <CardDescription>
                  Vue d'ensemble des résultats de personnalisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(results).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun test exécuté. Lancez les tests pour voir les résultats.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Statistiques globales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">
                          {Object.values(results).filter(r => r.status === 'success').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Tests réussis</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">
                          {Object.values(results).filter(r => r.status === 'error').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Tests échoués</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">
                          {Object.values(results).filter(r => r.hasNanoBanana).length} / {Object.keys(results).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Nano Banana OK</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">
                          {Object.values(results).filter(r => (r.zonesCount || 0) >= 3 && (r.microActionsCount || 0) >= 3).length} / {Object.keys(results).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Données complètes</div>
                      </div>
                    </div>

                    {/* Détection des problèmes récurrents */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm">Problèmes détectés</h3>
                      
                      {Object.values(results).filter(r => !r.hasNanoBanana).length > 0 && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">Nano Banana manquant</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Object.values(results).filter(r => !r.hasNanoBanana).length} scénario(s) sans visuel généré
                          </p>
                        </div>
                      )}

                      {Object.values(results).filter(r => (r.zonesCount || 0) < 3).length > 0 && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">Zones d'attention insuffisantes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Object.values(results).filter(r => (r.zonesCount || 0) < 3).length} scénario(s) avec moins de 3 zones
                          </p>
                        </div>
                      )}

                      {Object.values(results).filter(r => (r.microActionsCount || 0) < 3).length > 0 && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">Micro-actions insuffisantes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {Object.values(results).filter(r => (r.microActionsCount || 0) < 3).length} scénario(s) avec moins de 3 actions
                          </p>
                        </div>
                      )}

                      {Object.values(results).every(r => r.personaDetected === "Le Prudent Bloqué") && Object.keys(results).length > 1 && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium">Bug algorithmique détecté</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tous les scénarios retournent "Le Prudent Bloqué" - l'algorithme de détection ne fonctionne pas correctement
                          </p>
                        </div>
                      )}

                      {Object.values(results).filter(r => r.status === 'success').length > 0 &&
                       Object.values(results).filter(r => !r.hasNanoBanana).length === 0 &&
                       Object.values(results).filter(r => (r.zonesCount || 0) < 3).length === 0 &&
                       Object.values(results).filter(r => (r.microActionsCount || 0) < 3).length === 0 &&
                       new Set(Object.values(results).map(r => r.personaDetected)).size === Object.keys(results).length && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Tous les tests sont au vert !</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Le système de personnalisation fonctionne correctement avec des résultats uniques pour chaque profil
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
