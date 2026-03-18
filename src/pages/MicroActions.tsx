import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Target, Clock, Zap, DollarSign, Users, Brain, Activity, ChevronDown, StickyNote, Play, CheckCircle2, Battery, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { toast } from "sonner";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { LoginGateModal } from "@/components/dashboard/LoginGateModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompleteResults } from "@/hooks/useCompleteResults";
import { useLazyMicroActions } from "@/hooks/useLazyMicroActions";
import { useActiveRecommendations } from "@/hooks/useActiveRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { useAstrydSession } from "@/hooks/useAstrydSession";
import { trackEvent } from "@/hooks/usePageTracking";
import DailyPulse from "@/components/dashboard/DailyPulse";
import { useDailyCheckin } from "@/hooks/useDailyCheckin";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const MicroActions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId") || undefined;
  const { logMicroActionCompleted } = useAstrydSession();

  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  // Déclenche le chargement/génération lazy des micro-actions / zones / parcours
  const { isGenerating } = useLazyMicroActions();

  // Chargement passif depuis localStorage (guest) OU DB filtrée archived=false (auth)
  const { results, isLoading: loadingLocalStorage } = useCompleteResults();
  const { microActions: dbActions, isLoading: loadingDB, isAuthenticated, isFromDatabase } = useActiveRecommendations();

  // Sauvegarde auto des notes (debounced via blur)
  const saveNote = useCallback(async (actionId: string, note: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isFromDatabase) return;

    const { error } = await supabase
      .from('micro_commitments')
      .update({ user_notes: note || null })
      .eq('id', actionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur sauvegarde note:', error);
      toast.error("Erreur de sauvegarde");
    }
  }, [isFromDatabase]);

  // Utiliser DB si authentifié ET données viennent de la DB, sinon localStorage
  const isLoading = isAuthenticated ? loadingDB : loadingLocalStorage;
  const rawActions = (isAuthenticated && isFromDatabase) ? dbActions : (results?.micro_actions || []);

  // Adapter les anciennes micro-actions (sans statut) au nouveau modèle
  const hasStatus = rawActions.some((a: any) => a.status);
  const actions = rawActions.map((a: any, index: number) => ({
    status: a.status ?? "todo",
    text: a.text ?? a.titre ?? "",
    objectif: a.objectif,
    duree: a.duree,
    jauge_ciblee: a.jauge_ciblee,
    period: a.period,
    impact_attendu: a.impact_attendu ?? a.impact,
    conseil_pratique: a.conseil_pratique,
    user_notes: a.user_notes ?? null,
    id: a.id ?? `${a.titre ?? a.text}_${index}`,
    idea_id: a.idea_id ?? null,
  }));
  
  // Séparer les actions en 3 catégories: Cette semaine (todo), En cours (in_progress), Terminées (done)
  const allWeeklyActions = hasStatus ? actions.filter((a: any) => a.status === "todo") : actions;
  // 🔒 CAP: Afficher max 5 actions "À faire" pour réduire la charge mentale
  const weeklyActions = allWeeklyActions.slice(0, 5);
  const inProgressActions = hasStatus ? actions.filter((a: any) => a.status === "in_progress") : [];
  const doneActions = hasStatus ? actions.filter((a: any) => a.status === "done") : [];
  
  // Combiner weekly et in_progress pour le toggle (actions non terminées)
  const todoActions = [...weeklyActions, ...inProgressActions];

  const toggleAction = async (actionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Mode invité : afficher la modal de connexion
      setShowLoginGate(true);
      return;
    }

    // Trouver l'action actuelle pour toggle son état
    const currentAction = actions.find((a: any) => a.id === actionId);
    const newStatus = currentAction?.status === "done" ? "todo" : "done";
    const previousStatus = currentAction?.status || "todo";

    // ✅ Mettre à jour en DB pour les users authentifiés
    const { error } = await supabase
      .from('micro_commitments')
      .update({ status: newStatus })
      .eq('id', actionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur mise à jour micro-action:', error);
      toast.error("Erreur", {
        description: "Impossible de mettre à jour la micro-action.",
      });
      return;
    }

    // 📊 Écrire dans commitment_history pour alimenter la timeline
    const actionIdeaId = ideaId || currentAction?.idea_id || localStorage.getItem('ASTRYD_CURRENT_IDEA_ID');
    if (actionIdeaId) {
      const { error: historyError } = await supabase
        .from('commitment_history')
        .insert({
          user_id: user.id,
          idea_id: actionIdeaId,
          text: currentAction?.text || '',
          status_before: previousStatus,
          status_after: newStatus
        });
      
      if (historyError) {
        console.error('Erreur écriture historique commitment:', historyError);
      } else {
        console.log('✅ Historique commitment enregistré');
      }
    }

    // Notifier le reste de l'app (parcours, jauges, etc.)
    window.dispatchEvent(new Event("astryd-data-update"));
    
    if (newStatus === "done") {
      logMicroActionCompleted(actionIdeaId || "");
      
      // Track micro-action completed event
      trackEvent("micro_action_completed", {
        action_id: actionId,
        jauge_ciblee: currentAction?.jauge_ciblee,
        idea_id: actionIdeaId,
      });
    }

    toast.success(newStatus === "done" ? "Micro-action complétée ✓" : "Micro-action réactivée", {
      description: newStatus === "done" 
        ? "Bravo ! Continuez sur votre lancée." 
        : "Cette action est de nouveau dans votre liste.",
    });

    // 🔄 RÉGÉNÉRER zones et micro-actions après complétion micro-action (seulement si done)
    if (newStatus === "done") {
      console.log('🔄 Déclenchement régénération après complétion micro-action...');
      try {
        const regenResponse = await supabase.functions.invoke('regenerate-recommendations', {
          body: {
            ideaId: actionIdeaId || null,
            trigger: 'micro_action_completed'
          }
        });
        
        const regenData = regenResponse.data;
        if (regenData?.added?.micro_actions > 0) {
          setTimeout(() => {
            toast.info("Prochaines étapes débloquées 🚀", {
              description: "Nouvelles micro-actions générées suite à votre progression.",
              duration: 8000
            });
          }, 2000);
        }
      } catch (regenError) {
        console.error('Erreur régénération (non-bloquant):', regenError);
      }
    }
  };
  const getJaugeIcon = (jauge: string) => {
    switch (jauge) {
      case "energie": return <Zap className="h-3 w-3" />;
      case "temps": return <Clock className="h-3 w-3" />;
      case "finances": return <DollarSign className="h-3 w-3" />;
      case "soutien": return <Users className="h-3 w-3" />;
      case "competences": return <Brain className="h-3 w-3" />;
      case "motivation": return <Activity className="h-3 w-3" />;
      default: return null;
    }
  };

  const getJaugeLabel = (jauge: string) => {
    switch (jauge) {
      case "energie": return "Énergie";
      case "temps": return "Temps";
      case "finances": return "Finances";
      case "soutien": return "Soutien";
      case "competences": return "Compétences";
      case "motivation": return "Motivation";
      default: return jauge;
    }
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Mes actions" />
          
          <main className="flex-1 flex flex-col p-3 md:p-8 max-w-5xl mx-auto w-full min-h-0">
            <div className="flex flex-col flex-1 min-h-0 space-y-6">
              {/* En-tête centré entrepreneur */}
              <div className="flex-shrink-0">
                <h1 className="font-display text-xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  Mes actions
                </h1>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Étapes concrètes et réalisables pour avancer sur votre projet. Pour les constats de posture (énergie, clarté, soutien), consultez <button onClick={() => navigate("/attention-zones")} className="text-primary underline hover:text-primary/80">Zones d'attention</button>.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/journal")}
                    className="gap-2 text-primary hover:text-primary hover:bg-primary/5 border-primary/30"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Journal</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Check-in matinal intégré */}
              <DailyPulse />

              {(isLoading || isGenerating) ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-muted rounded w-20"></div>
                          <div className="h-6 bg-muted rounded w-24"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">
                    Chargement...
                  </p>
                </div>
              ) : actions.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Aucune micro-action pour le moment.</p>
                </Card>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                    {/* Section: À faire cette semaine */}
                    {weeklyActions.length > 0 && (
                      <div>
                        <h2 className="font-display font-bold text-lg md:text-xl mb-3 flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                          <Target className="h-5 w-5 text-primary" />
                          À faire cette semaine ({weeklyActions.length}{allWeeklyActions.length > 5 ? ` / ${allWeeklyActions.length}` : ''})
                          </h2>
                        <div className="space-y-3">
                          {weeklyActions.map((action) => (
                            <Collapsible key={action.id}>
                              <Card className="hover:shadow-md transition-all">
                                <CollapsibleTrigger className="w-full text-left">
                                  <div className="p-4 flex items-start gap-3">
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAction(action.id);
                                      }}
                                    >
                                      <Checkbox
                                        checked={action.status === "done"}
                                        className="mt-0.5"
                                      />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-start justify-between">
                                        <p className="font-medium leading-relaxed text-sm md:text-base">{action.text}</p>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {action.duree && (
                                          <Badge variant="outline" className="text-xs">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {action.duree}
                                          </Badge>
                                        )}
                                        {action.jauge_ciblee && (
                                          <Badge variant="secondary" className="text-xs gap-1">
                                            {getJaugeIcon(action.jauge_ciblee)}
                                            {getJaugeLabel(action.jauge_ciblee)}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="px-4 pb-4 ml-9 space-y-3 border-t border-border/50 pt-4">
                                    {action.objectif && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-1">Objectif</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{action.objectif}</p>
                                      </div>
                                    )}
                                    {action.impact_attendu && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-1">Impact attendu</h4>
                                        <p className="text-xs text-primary/70 leading-relaxed">💡 {action.impact_attendu}</p>
                                      </div>
                                    )}
                                    {action.conseil_pratique && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-1">Comment faire</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{action.conseil_pratique}</p>
                                      </div>
                                    )}
                                    {isAuthenticated && isFromDatabase && (
                                      <div className="pt-2 border-t border-border/30">
                                        <div className="flex items-center gap-2 mb-2">
                                          <StickyNote className="h-4 w-4 text-primary/70" />
                                          <h4 className="font-semibold text-sm">Mes notes</h4>
                                        </div>
                                        <Textarea
                                          placeholder="Notez votre progression..."
                                          value={localNotes[action.id] ?? action.user_notes ?? ""}
                                          onChange={(e) => setLocalNotes(prev => ({ ...prev, [action.id]: e.target.value }))}
                                          onBlur={(e) => saveNote(action.id, e.target.value)}
                                          rows={2}
                                          className="text-sm bg-muted/30"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: En cours */}
                    {inProgressActions.length > 0 && (
                      <div>
                        <h2 className="font-display font-bold text-lg md:text-xl mb-3 flex items-center gap-2 text-amber-600 sticky top-0 bg-background py-2 z-10">
                          <Play className="h-5 w-5" />
                          En cours ({inProgressActions.length})
                        </h2>
                        <div className="space-y-3">
                          {inProgressActions.map((action) => (
                            <Card key={action.id} className="p-4 border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 hover:shadow-md transition-all">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={false}
                                  onCheckedChange={() => toggleAction(action.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 space-y-2">
                                  <p className="font-medium leading-relaxed text-sm md:text-base">{action.text}</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {action.duree && (
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {action.duree}
                                      </Badge>
                                    )}
                                    {action.jauge_ciblee && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        {getJaugeIcon(action.jauge_ciblee)}
                                        {getJaugeLabel(action.jauge_ciblee)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Terminées — dropdown caché par défaut */}
                    {doneActions.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="w-full">
                          <h2 className="font-display font-bold text-lg md:text-xl mb-3 flex items-center gap-2 text-success sticky top-0 bg-background py-2 z-10 cursor-pointer">
                            <CheckCircle2 className="h-5 w-5" />
                            Terminées ({doneActions.length})
                            <ChevronDown className="h-4 w-4 ml-auto transition-transform data-[state=open]:rotate-180" />
                          </h2>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-3">
                            {doneActions.map((action) => (
                              <Card key={action.id} className="p-4 bg-success/5 border-success/20 hover:shadow-md transition-all">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={true}
                                    onCheckedChange={() => toggleAction(action.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 space-y-2">
                                    <p className="font-medium line-through text-muted-foreground leading-relaxed">{action.text}</p>
                                    {action.objectif && (
                                      <p className="text-sm text-muted-foreground/70 line-through leading-relaxed">{action.objectif}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 opacity-60">
                                      {action.duree && (
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {action.duree}
                                        </Badge>
                                      )}
                                      {action.jauge_ciblee && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                          {getJaugeIcon(action.jauge_ciblee)}
                                          {getJaugeLabel(action.jauge_ciblee)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    </div>
                </>
              )}
            </div>

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
      <LoginGateModal
        open={showLoginGate}
        onOpenChange={setShowLoginGate}
        action="micro-action"
      />
    </SidebarProvider>
  );
};

export default MicroActions;
