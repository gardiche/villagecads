import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, CheckCircle2, ChevronDown, RefreshCw, StickyNote, BookOpen, ArrowRight, Eye } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { useCompleteResults } from "@/hooks/useCompleteResults";
import { useLazyMicroActions } from "@/hooks/useLazyMicroActions";
import { useActiveRecommendations } from "@/hooks/useActiveRecommendations";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoginGateModal } from "@/components/dashboard/LoginGateModal";

const AttentionZones = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [localResolvedZones, setLocalResolvedZones] = useState<Set<string>>(new Set());
  const [showResolvedSection, setShowResolvedSection] = useState(false);
  const [isFillingRecommendations, setIsFillingRecommendations] = useState(false);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const { isGenerating } = useLazyMicroActions();
  const { results, isLoading: loadingLocalStorage } = useCompleteResults();
  const { attentionZones: dbZones, isLoading: loadingDB, isAuthenticated, isFromDatabase, reload } = useActiveRecommendations();

  const isLoading = isAuthenticated ? loadingDB : loadingLocalStorage;
  const zones = (isAuthenticated && isFromDatabase) ? dbZones : (results?.zones_attention || []);

  useEffect(() => {
    localStorage.setItem('ASTRYD_ZONES_VISITED', 'true');
  }, []);

  const getIdeaId = () => {
    const storedIdea = localStorage.getItem('ASTRYD_CURRENT_IDEA_ID');
    if (storedIdea) return storedIdea;
    const firstZoneWithId = (zones as any[]).find((z) => z.idea_id);
    return firstZoneWithId?.idea_id || null;
  };

  const zonesWithoutRecommendation = zones.filter((z: any) => !z.recommendation);

  const saveNote = useCallback(async (zoneId: string, note: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isFromDatabase) return;

    // Save note to attention_zones table (using recommendation field as fallback for notes)
    const { error } = await supabase
      .from('attention_zones')
      .update({ recommendation: note || null })
      .eq('id', zoneId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur sauvegarde note:', error);
    }
  }, [isFromDatabase]);

  const fillMissingRecommendations = async () => {
    const ideaId = getIdeaId();
    if (!ideaId) {
      toast({
        title: "Erreur",
        description: "Aucune idée de projet trouvée.",
        variant: "destructive",
      });
      return;
    }

    setIsFillingRecommendations(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setShowLoginGate(true);
        return;
      }

      const response = await supabase.functions.invoke('fill-missing-recommendations', {
        body: { ideaId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Recommandations générées ✓",
        description: `${response.data.updated} zone(s) enrichie(s) avec des recommandations personnalisées.`,
      });

      if (reload) reload();
      window.dispatchEvent(new Event("astryd-data-update"));
    } catch (error) {
      console.error('Error filling recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les recommandations.",
        variant: "destructive",
      });
    } finally {
      setIsFillingRecommendations(false);
    }
  };

  const toggleZoneResolved = async (zoneId: string, currentResolved: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowLoginGate(true);
      return;
    }

    const newResolved = !currentResolved;
    const currentZone = zones.find((z: any) => (z.id ?? z.label) === zoneId) as any;
    const zoneIdeaId = currentZone?.idea_id || getIdeaId();
    const previousSeverity = currentZone?.severity || 1;

    const { error } = await supabase
      .from('attention_zones')
      .update({
        archived: newResolved,
        archived_at: newResolved ? new Date().toISOString() : null
      })
      .eq('id', zoneId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur mise à jour zone:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la zone d'attention.",
        variant: "destructive",
      });
      return;
    }

    if (zoneIdeaId) {
      await supabase.from('attention_history').insert({
        user_id: user.id,
        idea_id: zoneIdeaId,
        label: currentZone?.label || '',
        previous_severity: previousSeverity,
        new_severity: newResolved ? 0 : previousSeverity,
        resolved: newResolved
      });
    }

    setLocalResolvedZones(prev => {
      const newSet = new Set(prev);
      if (newResolved) newSet.add(zoneId);
      else newSet.delete(zoneId);
      return newSet;
    });

    window.dispatchEvent(new Event("astryd-data-update"));
    if (reload) reload();

    toast({
      title: newResolved ? "Zone résolue ✓" : "Zone réouverte",
      description: newResolved
        ? "Bravo ! Cette zone d'attention est maintenant résolue."
        : "Cette zone d'attention est de nouveau active.",
    });
  };

  const getSeverityBadge = (severity: number) => {
    if (severity === 3) return <Badge variant="destructive" className="text-xs">Critique</Badge>;
    if (severity === 2) return <Badge variant="default" className="text-xs">Attention</Badge>;
    return <Badge variant="secondary" className="text-xs">Info</Badge>;
  };

  const activeZones = zones.filter((z: any) => !localResolvedZones.has(z.id ?? z.label) && !z.resolved && !z.archived);
  const resolvedZones = zones.filter((z: any) => localResolvedZones.has(z.id ?? z.label) || z.resolved || z.archived);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />

        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Zones d'attention" />

          <main className="flex-1 flex flex-col p-3 md:p-8 max-w-5xl mx-auto w-full min-h-0">
            <div className="flex flex-col flex-1 min-h-0 space-y-6">
              {/* En-tête — même structure que Mes actions */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h1 className="font-display text-xl md:text-3xl font-bold flex items-center gap-2">
                    <Eye className="h-6 w-6 text-primary" />
                    Zones d'attention
                  </h1>
                  {zonesWithoutRecommendation.length > 0 && isAuthenticated && (
                    <Button
                      onClick={fillMissingRecommendations}
                      disabled={isFillingRecommendations}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isFillingRecommendations ? 'animate-spin' : ''}`} />
                      {isFillingRecommendations ? 'Génération...' : 'Enrichir'}
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Constats de posture : énergie, clarté, soutien, équilibre. Ce sont des observations, pas des tâches. Pour les étapes concrètes, consultez <button onClick={() => navigate("/micro-actions")} className="text-primary underline hover:text-primary/80">Mes actions</button>.
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

              {(isLoading || isGenerating) ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="animate-pulse space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-muted rounded w-20"></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">Chargement...</p>
                </div>
              ) : activeZones.length === 0 && resolvedZones.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Aucune zone d'attention pour le moment.</p>
                </Card>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                    {/* Zones actives */}
                    {activeZones.length > 0 && (
                      <div>
                        <h2 className="font-display font-bold text-lg md:text-xl mb-3 flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                          <AlertTriangle className="h-5 w-5 text-primary" />
                          À surveiller ({activeZones.length})
                        </h2>
                        <div className="space-y-3">
                          {activeZones.map((zone: any) => {
                            const zoneKey = zone.id ?? zone.label;
                            return (
                              <Collapsible key={zoneKey}>
                                <Card className="hover:shadow-md transition-all">
                                  <CollapsibleTrigger className="w-full text-left">
                                    <div className="p-4 flex items-start gap-3">
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleZoneResolved(zoneKey, false);
                                        }}
                                      >
                                        <Checkbox checked={false} className="mt-0.5" />
                                      </div>
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                          <p className="font-medium leading-relaxed text-sm md:text-base">{zone.label}</p>
                                          <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {getSeverityBadge(zone.severity)}
                                        </div>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="px-4 pb-4 ml-9 space-y-3 border-t border-border/50 pt-4">
                                      {zone.recommendation && (
                                        <div>
                                          <h4 className="font-semibold text-sm mb-1">Recommandation</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed">{zone.recommendation}</p>
                                        </div>
                                      )}
                                      {zone.impact_concret && (
                                        <div>
                                          <h4 className="font-semibold text-sm mb-1">Pourquoi c'est important</h4>
                                          <p className="text-xs text-primary/70 leading-relaxed">💡 {zone.impact_concret}</p>
                                        </div>
                                      )}
                                      {!zone.recommendation && !zone.impact_concret && (
                                        <p className="text-muted-foreground text-sm italic">
                                          Cliquez sur "Enrichir" pour générer des recommandations personnalisées.
                                        </p>
                                      )}
                                      {isAuthenticated && isFromDatabase && (
                                        <div className="pt-2 border-t border-border/30">
                                          <div className="flex items-center gap-2 mb-2">
                                            <StickyNote className="h-4 w-4 text-primary/70" />
                                            <h4 className="font-semibold text-sm">Mes notes</h4>
                                          </div>
                                          <Textarea
                                            placeholder="Notez vos réflexions..."
                                            value={localNotes[zoneKey] ?? ""}
                                            onChange={(e) => setLocalNotes(prev => ({ ...prev, [zoneKey]: e.target.value }))}
                                            onBlur={(e) => saveNote(zoneKey, e.target.value)}
                                            rows={2}
                                            className="text-sm bg-muted/30"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Card>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section: Zones résolues — dropdown */}
                    {resolvedZones.length > 0 && (
                      <Collapsible open={showResolvedSection} onOpenChange={setShowResolvedSection}>
                        <CollapsibleTrigger className="w-full">
                          <h2 className="font-display font-bold text-lg md:text-xl mb-3 flex items-center gap-2 text-success sticky top-0 bg-background py-2 z-10 cursor-pointer">
                            <CheckCircle2 className="h-5 w-5" />
                            Résolues ({resolvedZones.length})
                            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showResolvedSection ? 'rotate-180' : ''}`} />
                          </h2>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-3">
                            {resolvedZones.map((zone: any) => {
                              const zoneKey = zone.id ?? zone.label;
                              return (
                                <Card key={zoneKey} className="p-4 bg-success/5 border-success/20 hover:shadow-md transition-all">
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      checked={true}
                                      onCheckedChange={() => toggleZoneResolved(zoneKey, true)}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <p className="font-medium line-through text-muted-foreground leading-relaxed">{zone.label}</p>
                                      {zone.recommendation && (
                                        <p className="text-sm text-muted-foreground/70 line-through leading-relaxed">{zone.recommendation}</p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-2 opacity-60">
                                        {getSeverityBadge(zone.severity)}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
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

      <ProgressionAccessModal open={showProgressionModal} onOpenChange={setShowProgressionModal} />
      <CoachingComingSoonModal open={showCoachingModal} onOpenChange={setShowCoachingModal} />
      <LoginGateModal open={showLoginGate} onOpenChange={setShowLoginGate} action="micro-action" />
    </SidebarProvider>
  );
};

export default AttentionZones;
