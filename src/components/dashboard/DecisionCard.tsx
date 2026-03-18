import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Play, Pause, RefreshCw, StopCircle } from "lucide-react";
import { toast } from "sonner";

interface DecisionCardProps {
  ideaId: string;
  maturityScore?: number;
}

const DecisionCard = ({ ideaId, maturityScore = 0 }: DecisionCardProps) => {
  const [decision, setDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previousScore, setPreviousScore] = useState(maturityScore);
  const [scoreChanged, setScoreChanged] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [ideaId]);

  // Détecter changement de score pour animation
  useEffect(() => {
    if (previousScore !== maturityScore && previousScore !== 0) {
      setScoreChanged(true);
      const timer = setTimeout(() => setScoreChanged(false), 1000);
      return () => clearTimeout(timer);
    }
    setPreviousScore(maturityScore);
  }, [maturityScore]);

  const loadDecision = async () => {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setDecision(data);
    }
    setLoading(false);
  };

  const handleDecisionChange = async (newState: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Insérer la nouvelle décision
      const { error } = await supabase
        .from("decisions")
        .insert({
          user_id: user.id,
          idea_id: ideaId,
          state: newState,
          rationale: null,
        });

      if (error) throw error;

      // Recharger la décision
      await loadDecision();
      toast.success(`Décision mise à jour : ${newState}`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la décision:", error);
      toast.error("Erreur lors de la sauvegarde de la décision");
    } finally {
      setSaving(false);
    }
  };

  const getSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-decision', {
        body: { ideaId, maturityScore }
      });

      if (error) throw error;
      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        toast.success("Suggestion Astryd générée !");
      }
    } catch (error) {
      console.error("Erreur lors de la génération de suggestion:", error);
      toast.error("Erreur lors de la génération de suggestion");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const getDecisionConfig = (state: string) => {
    switch (state) {
      case "GO":
        return {
          icon: Play,
          label: "Go - Lance-toi !",
          color: "bg-success text-success-foreground",
          description: "Feu vert complet, tu es prêt·e à passer à l'action !",
        };
      case "KEEP":
        return {
          icon: Pause,
          label: "Keep - Continue ton élan",
          color: "bg-primary text-primary-foreground",
          description: "Ton alignement est fort, continue d'avancer tout en consolidant.",
        };
      case "PIVOT":
        return {
          icon: RefreshCw,
          label: "Pivot - Ajuste",
          color: "bg-accent text-accent-foreground",
          description: "Prends du recul et ajuste ton approche.",
        };
      case "STOP":
        return {
          icon: StopCircle,
          label: "Stop - Pause nécessaire",
          color: "bg-destructive text-destructive-foreground",
          description: "Ce n'est pas le bon moment, préserve-toi.",
        };
      default:
        return {
          icon: Rocket,
          label: "Aucune décision",
          color: "bg-muted text-muted-foreground",
          description: "Définis ton état actuel.",
        };
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const config = decision ? getDecisionConfig(decision.state) : getDecisionConfig("");
  const Icon = config.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="h-5 w-5 text-accent" />
        <h3 className="font-display font-bold text-lg">Décision actuelle</h3>
      </div>

      <div className="flex flex-col gap-6">
        {/* Score de maturité actuel avec animation */}
        <div className={`p-4 bg-muted/20 rounded-lg border border-border/50 transition-all duration-500 ${
          scoreChanged ? 'ring-2 ring-primary shadow-lg scale-105' : ''
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score de maturité actuel</span>
            <span className={`font-bold text-2xl text-primary transition-all duration-500 ${
              scoreChanged ? 'scale-110' : ''
            }`}>
              {maturityScore}/100
            </span>
          </div>
        </div>

        {/* Suggestion Astryd */}
        {suggestion && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Rocket className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  Suggestion Astryd
                  <Badge variant="outline" className="text-xs">
                    {suggestion.confidence}% confiance
                  </Badge>
                </h4>
                <p className="text-sm text-muted-foreground mb-2">{suggestion.rationale}</p>
                <div className="flex items-center gap-2">
                  <Badge className={getDecisionConfig(suggestion.decision).color}>
                    {suggestion.decision}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-lg">{config.label}</h4>
            </div>
            <p className="text-muted-foreground mb-3">{config.description}</p>
            {decision?.rationale && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {decision.rationale}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={getSuggestion}
              disabled={loadingSuggestion}
              className="w-full sm:w-auto"
            >
              <Rocket className={`h-4 w-4 mr-2 ${loadingSuggestion ? 'animate-spin' : ''}`} />
              {loadingSuggestion ? 'Analyse en cours...' : 'Demander une suggestion Astryd'}
            </Button>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant={decision?.state === "GO" ? "default" : "outline"}
                onClick={() => handleDecisionChange("GO")}
                disabled={saving}
                className={decision?.state === "GO" ? "bg-success hover:bg-success/90" : ""}
              >
                <Play className="h-4 w-4 mr-1" />
                GO
              </Button>
              <Button 
                size="sm" 
                variant={decision?.state === "KEEP" ? "default" : "outline"}
                onClick={() => handleDecisionChange("KEEP")}
                disabled={saving}
              >
                <Pause className="h-4 w-4 mr-1" />
                KEEP
              </Button>
              <Button 
                size="sm" 
                variant={decision?.state === "PIVOT" ? "default" : "outline"}
                onClick={() => handleDecisionChange("PIVOT")}
                disabled={saving}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                PIVOT
              </Button>
              <Button 
                size="sm" 
                variant={decision?.state === "STOP" ? "default" : "outline"}
                onClick={() => handleDecisionChange("STOP")}
                disabled={saving}
                className={decision?.state === "STOP" ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                <StopCircle className="h-4 w-4 mr-1" />
                STOP
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DecisionCard;
