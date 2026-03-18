import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Target, Sparkles, BookOpen, AlertTriangle, Zap, CheckCircle2, Clock, Users, Star, Check, Edit, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { useCompleteResults } from "@/hooks/useCompleteResults";
import { useJourneyProgress } from "@/hooks/useJourneyProgress";
import { JourneyCelebration } from "@/components/dashboard/JourneyCelebration";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";


const CapEtParcours = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editedObjective, setEditedObjective] = useState("");
  const [isReformulating, setIsReformulating] = useState(false);

  // Chargement passif depuis localStorage
  const { results, isLoading } = useCompleteResults();
  
  // Hook de tracking automatique des étapes avec détection des nouvelles complétions
  const { steps: journeySteps, newlyCompletedSteps, clearNewlyCompleted } = useJourneyProgress();

  // Charger l'objectif depuis les résultats
  const objective = results?.personaData?.cap2_4semaines || "";
  const isObjectiveValidated = localStorage.getItem("objective_validated") === "true";
  
  const completedCount = journeySteps.filter((step) => step.completed).length;
  const totalCount = journeySteps.length || 6; // Fallback à 6 étapes par défaut

  const handleValidateObjective = () => {
    localStorage.setItem("objective_validated", "true");
    window.dispatchEvent(new Event('astryd-data-update'));
    
    toast({
      title: "Objectif validé",
      description: "Votre objectif a été validé avec succès.",
      duration: 5000,
    });
  };

  const handleStartEdit = () => {
    setEditedObjective(objective);
    setIsEditingObjective(true);
  };

  const handleCancelEdit = () => {
    setIsEditingObjective(false);
    setEditedObjective("");
  };

  const handleSaveObjective = async () => {
    if (!editedObjective.trim()) {
      toast({
        title: "Erreur",
        description: "L'objectif ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    setIsReformulating(true);

    try {
      const { data, error } = await supabase.functions.invoke("reformulate-objective", {
        body: { userInput: editedObjective },
      });

      if (error) throw error;

      const reformulatedObjective = data.reformulatedObjective;

      // Sauvegarder l'objectif reformulé
      const currentResults = JSON.parse(localStorage.getItem("ASTRYD_COMPLETE_RESULTS") || "{}");
      if (currentResults.personaData) {
        currentResults.personaData.cap2_4semaines = reformulatedObjective;
        localStorage.setItem("ASTRYD_COMPLETE_RESULTS", JSON.stringify(currentResults));
        localStorage.setItem("objective_validated", "true");
      }

      setIsEditingObjective(false);
      setEditedObjective("");
      window.dispatchEvent(new Event('astryd-data-update'));

      toast({
        title: "Objectif reformulé et validé",
        description: "Votre objectif a été reformulé et validé avec succès.",
        duration: 5000,
      });

    } catch (error) {
      console.error("Error reformulating objective:", error);
      toast({
        title: "Erreur",
        description: "Impossible de reformuler l'objectif. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsReformulating(false);
    }
  };


  // Déterminer si les données progressives sont encore en chargement
  const isProgressiveLoading = isLoading && journeySteps.length === 0;

  // Pas de skeleton initial si on a au moins le profil
  // On unifie désormais le rendu pour éviter les changements brusques de structure DOM
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />

        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Objectifs et parcours" />

          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
              {!results ? (
                // État skeleton unifié tant que les résultats complets ne sont pas disponibles
                <>
                  <Card className="p-6">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </Card>
                  <Card className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  {/* Section Objectif */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="w-8 h-8 text-primary" />
                        <h2 className="text-2xl font-display font-bold">Votre objectif 2-4 semaines</h2>
                      </div>
                      {isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <p className="text-xs text-muted-foreground mt-3 italic animate-pulse">
                            ⏳ Chargement...
                          </p>
                        </div>
                      ) : objective ? (
                        <div className="space-y-4">
                          {isEditingObjective ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editedObjective}
                                onChange={(e) => setEditedObjective(e.target.value)}
                                placeholder="Modifiez votre objectif..."
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveObjective}
                                  disabled={isReformulating}
                                  size="sm"
                                >
                                  {isReformulating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Astryd reformule...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4 mr-2" />
                                      Valider
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  size="sm"
                                  disabled={isReformulating}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-muted-foreground leading-relaxed">
                                {objective}
                              </p>
                              {isObjectiveValidated ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Objectif validé
                                  </Badge>
                                  <Button
                                    onClick={handleStartEdit}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier l'objectif
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleValidateObjective}
                                    size="sm"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Valider l'objectif
                                  </Button>
                                  <Button
                                    onClick={handleStartEdit}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier l'objectif
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          Votre objectif personnalisé sera généré à partir de vos prochaines données.
                        </p>
                      )}

                    </Card>
                  </motion.div>

                  {/* Section Votre parcours */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card className="p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-display font-bold mb-2">Votre parcours</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {completedCount} / {totalCount} accomplissements
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Vos étapes pour cheminer vers votre objectif. Chaque étape accomplie renforce votre posture entrepreneuriale et vous aide à construire un équilibre durable.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {isProgressiveLoading ? (
                          <>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Skeleton key={i} className="h-20 w-full" />
                            ))}
                            <p className="text-xs text-muted-foreground mt-3 italic text-center animate-pulse">
                              ⏳ Chargement...
                            </p>
                          </>
                         ) : (
                          journeySteps.map((step, index: number) => {
                            // Mapper les icônes dynamiquement selon l'ID de l'étape
                            let icon = <Zap className="w-5 h-5" />;
                            if (step.id.includes("profile")) icon = <Star className="w-5 h-5" />;
                            if (step.id.includes("idea")) icon = <Sparkles className="w-5 h-5" />;
                            if (step.id.includes("objective")) icon = <Target className="w-5 h-5" />;
                            if (step.id.includes("journal")) icon = <BookOpen className="w-5 h-5" />;
                            if (step.id.includes("zones") || step.id.includes("attention")) icon = <AlertTriangle className="w-5 h-5" />;
                            if (step.id.includes("progression") || step.id.includes("history")) icon = <Clock className="w-5 h-5" />;
                            if (step.id.includes("coaching")) icon = <Users className="w-5 h-5" />;

                            // Navigation au clic selon l'étape
                            const getStepRoute = (stepId: string): string | null => {
                              if (stepId.includes("idea")) return "/idea";
                              if (stepId.includes("journal")) return "/journal";
                              if (stepId.includes("zones") || stepId.includes("attention")) return "/attention-zones";
                              if (stepId.includes("micro") || stepId.includes("action")) return "/micro-actions";
                              return null;
                            };
                            
                            const route = getStepRoute(step.id);
                            const isDisabled = !route;

                            return (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                              >
                                <Card
                                  onClick={() => route && navigate(route)}
                                  className={`p-4 transition-all ${route ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : 'opacity-50 cursor-not-allowed'} ${
                                    step.completed
                                      ? "bg-success/5 border-success/30"
                                      : "bg-muted/30 border-muted"
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                        step.completed
                                          ? "bg-success/20 text-success"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {step.completed ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : (
                                        icon
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold mb-1">{step.title}</h4>
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {step.description}
                                      </p>
                                    </div>
                                    {step.completed && (
                                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                        Complété
                                      </Badge>
                                    )}
                                    {isDisabled && !step.completed && (
                                      <Badge variant="outline" className="text-muted-foreground">
                                        Bientôt
                                      </Badge>
                                    )}
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </Card>
                  </motion.div>

                  <CTAFooter
                    onProgressionClick={() => {
                      const hasProgressionAccess = localStorage.getItem("astryd_progression_access") === "granted";
                      if (hasProgressionAccess) {
                        navigate("/history");
                      } else {
                        setShowProgressionModal(true);
                      }
                    }}
                    onCoachingClick={() => setShowCoachingModal(true)}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <ProgressionAccessModal
        open={showProgressionModal}
        onOpenChange={setShowProgressionModal}
      />

      <CoachingComingSoonModal
        open={showCoachingModal}
        onOpenChange={setShowCoachingModal}
      />

      {/* 🎉 Célébration pour nouvelles étapes complétées */}
      <JourneyCelebration 
        newlyCompletedSteps={newlyCompletedSteps}
        onCelebrationComplete={clearNewlyCompleted}
      />
    </SidebarProvider>
  );
};

export default CapEtParcours;
