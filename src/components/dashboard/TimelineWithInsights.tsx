import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, TrendingUp, TrendingDown, Minus, Target, AlertTriangle, 
  CheckCircle2, Calendar, Edit3, Lightbulb, Sparkles, ChevronDown, ChevronUp 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ProgressionCharts } from "./ProgressionCharts";

interface TimelineWithInsightsProps {
  ideaId: string;
  userPlan: string;
}

interface TimelineEvent {
  type: 'alignment' | 'gauge' | 'attention' | 'commitment' | 'idea_update' | 'insight';
  date: string;
  data: any;
}

interface HistoryInsight {
  summary: string;
  majorInsight: string;
  trend: "progression" | "plateau" | "risque";
  suggestedCommitments: string[];
}

export const TimelineWithInsights = ({ ideaId, userPlan }: TimelineWithInsightsProps) => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [insight, setInsight] = useState<HistoryInsight | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [commitmentHistory, setCommitmentHistory] = useState<Array<{ created_at: string; status_after: string }>>([]);
  const [attentionHistory, setAttentionHistory] = useState<Array<{ created_at: string; resolved: boolean }>>([]);
  // Stats from actual tables (not history tables)
  const [completedActionsCount, setCompletedActionsCount] = useState(0);
  const [resolvedZonesCount, setResolvedZonesCount] = useState(0);

  // Charger insight persisté depuis localStorage au mount
  useEffect(() => {
    const savedInsight = localStorage.getItem(`astryd_insight_${ideaId}`);
    if (savedInsight) {
      try {
        setInsight(JSON.parse(savedInsight));
      } catch (e) {
        console.error('Error parsing saved insight:', e);
      }
    }
  }, [ideaId]);

  useEffect(() => {
    if (ideaId) {
      loadTimeline();
    }
  }, [ideaId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysLimit = userPlan === "declic" ? 7 : 365;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysLimit);

      // Charger les VRAIES données depuis les tables principales (pas les historiques)
      const [
        completedActionsRes,
        resolvedZonesRes,
        alignmentRes, 
        gaugeRes, 
        attentionRes, 
        commitmentRes
      ] = await Promise.all([
        // Stats from main tables
        supabase
          .from('micro_commitments')
          .select('id, created_at')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .eq('status', 'done'),
        supabase
          .from('attention_zones')
          .select('id, created_at, archived_at')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .eq('archived', true),
        // History tables for timeline
        supabase
          .from('alignment_history')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('gauge_history')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('attention_history')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('commitment_history')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .gte('created_at', dateLimit.toISOString())
          .order('created_at', { ascending: false })
      ]);

      // Set actual counts from main tables
      setCompletedActionsCount(completedActionsRes.data?.length || 0);
      setResolvedZonesCount(resolvedZonesRes.data?.length || 0);

      // Construire la timeline unifiée
      const events: TimelineEvent[] = [];

      (alignmentRes.data || []).forEach(item => {
        events.push({ type: 'alignment', date: item.created_at, data: item });
      });

      (gaugeRes.data || []).forEach(item => {
        events.push({ type: 'gauge', date: item.created_at, data: item });
      });

      (attentionRes.data || []).forEach(item => {
        events.push({ type: 'attention', date: item.created_at, data: item });
      });

      (commitmentRes.data || []).forEach(item => {
        events.push({ type: 'commitment', date: item.created_at, data: item });
      });

      // Charger les snapshots d'idées
      const { data: ideaSnapshots } = await supabase
        .from('integration_events')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .eq('type', 'idea_version_snapshot')
        .gte('created_at', dateLimit.toISOString())
        .order('created_at', { ascending: false });

      if (ideaSnapshots) {
        ideaSnapshots.forEach(snapshot => {
          events.push({ type: 'idea_update', date: snapshot.created_at, data: snapshot.payload });
        });
      }

      // Trier par date décroissante
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimeline(events);
      
      // Stocker les données pour les graphiques (from history tables)
      setCommitmentHistory((commitmentRes.data || []).map(c => ({
        created_at: c.created_at,
        status_after: c.status_after
      })));
      setAttentionHistory((attentionRes.data || []).map(a => ({
        created_at: a.created_at,
        resolved: a.resolved || false
      })));
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHistory = async () => {
    if (!ideaId) return;

    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const daysLimit = userPlan === "declic" ? 7 : 365;
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysLimit);

      const [alignmentRes, gaugeRes, attentionRes, commitmentRes, journalRes] = await Promise.all([
        supabase.from("alignment_history").select("*").eq("idea_id", ideaId).gte("created_at", dateLimit.toISOString()),
        supabase.from("gauge_history").select("*").eq("idea_id", ideaId).gte("created_at", dateLimit.toISOString()),
        supabase.from("attention_history").select("*").eq("idea_id", ideaId).gte("created_at", dateLimit.toISOString()),
        supabase.from("commitment_history").select("*").eq("idea_id", ideaId).gte("created_at", dateLimit.toISOString()),
        supabase.from("journal_entries").select("*").eq("idea_id", ideaId).gte("created_at", dateLimit.toISOString()).limit(3)
      ]);

      const { data, error } = await supabase.functions.invoke("analyze-history", {
        body: {
          ideaId,
          alignmentHistory: alignmentRes.data || [],
          gaugeHistory: gaugeRes.data || [],
          attentionHistory: attentionRes.data || [],
          commitmentHistory: commitmentRes.data || [],
          journalEntries: journalRes.data || [],
          daysLimit
        }
      });

      if (error) throw error;
      setInsight(data);
      // Persister l'insight pour qu'il survive au refresh
      localStorage.setItem(`astryd_insight_${ideaId}`, JSON.stringify(data));
      localStorage.setItem('astryd_new_insights_available', 'true');
      toast.success("Analyse terminée !");
    } catch (error: any) {
      console.error("Error analyzing history:", error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM yyyy", { locale: fr });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "progression": return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "risque": return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <Minus className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "progression": return "En progression";
      case "risque": return "Point de vigilance";
      default: return "Plateau";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alignment': return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
      case 'gauge': return <Target className="h-3.5 w-3.5 text-accent" />;
      case 'attention': return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
      case 'commitment': return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'idea_update': return <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Calendar className="h-3.5 w-3.5" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'alignment': return 'Score d\'alignement';
      case 'gauge': return 'Jauge';
      case 'attention': return 'Zone d\'attention';
      case 'commitment': return 'Micro-action';
      case 'idea_update': return 'Idée modifiée';
      default: return 'Événement';
    }
  };

  const renderEventSummary = (event: TimelineEvent) => {
    switch (event.type) {
      case 'alignment':
        return (
          <span className="text-muted-foreground">
            {event.data.previous_score ?? '?'} → <span className="font-medium text-foreground">{event.data.new_score}</span>
          </span>
        );
      case 'gauge':
        return (
          <span className="text-muted-foreground capitalize">
            {event.data.gauge_name}: {event.data.previous_value ?? '?'} → <span className="font-medium text-foreground">{event.data.new_value}</span>
          </span>
        );
      case 'attention':
        return (
          <span className="text-muted-foreground">
            {event.data.label}
            {event.data.resolved && <Badge variant="secondary" className="ml-2 text-xs">Résolue</Badge>}
          </span>
        );
      case 'commitment':
        return (
          <span className="text-muted-foreground">
            {event.data.text?.substring(0, 50)}{event.data.text?.length > 50 ? '...' : ''}
            <Badge variant="outline" className="ml-2 text-xs">{event.data.status_after}</Badge>
          </span>
        );
      case 'idea_update':
        return <span className="text-muted-foreground">Pivot vers "{event.data.new_title}"</span>;
      default:
        return null;
    }
  };

  const displayedEvents = showAll ? timeline : timeline.slice(0, 5);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Votre progression
        </h2>
        <Button 
          onClick={analyzeHistory}
          disabled={analyzing}
          size="sm"
          variant={insight ? "outline" : "default"}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyse...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4 mr-2" />
              {insight ? "Ré-analyser" : "Analyser avec l'IA"}
            </>
          )}
        </Button>
      </div>

      {/* Graphiques de progression */}
      <ProgressionCharts
        commitmentHistory={commitmentHistory}
        attentionHistory={attentionHistory}
        timeline={timeline}
        completedActionsCount={completedActionsCount}
        resolvedZonesCount={resolvedZonesCount}
      />

      {/* Insights IA (quand disponibles) */}
      {insight && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-3 mb-3">
            {getTrendIcon(insight.trend)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{getTrendLabel(insight.trend)}</span>
                <Badge variant="secondary" className="text-xs">Insight IA</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{insight.summary}</p>
            </div>
          </div>
          
          {insight.majorInsight && (
            <div className="p-3 bg-background/60 rounded-md mt-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                {insight.majorInsight}
              </p>
            </div>
          )}

          {insight.suggestedCommitments && insight.suggestedCommitments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Actions suggérées :</p>
              <div className="flex flex-wrap gap-2">
                {insight.suggestedCommitments.slice(0, 3).map((action, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {action.length > 40 ? action.substring(0, 40) + '...' : action}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline des événements */}
      {timeline.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Aucun historique disponible. Votre parcours s'enrichira au fil de vos actions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedEvents.map((event, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
            >
              <div className="p-1.5 rounded-md bg-muted/70">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{getEventLabel(event.type)}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  {renderEventSummary(event)}
                </div>
              </div>
              <time className="text-xs text-muted-foreground shrink-0">
                {formatDate(event.date)}
              </time>
            </div>
          ))}

          {timeline.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-2"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Voir les {timeline.length - 5} événements restants
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
