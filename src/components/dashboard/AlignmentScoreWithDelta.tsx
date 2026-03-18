import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AlignmentScoreWithDeltaProps {
  ideaId: string;
  hideGlobalScore?: boolean;
}

const AlignmentScoreWithDelta = ({ ideaId, hideGlobalScore = false }: AlignmentScoreWithDeltaProps) => {
  const [currentScore, setCurrentScore] = useState<any>(null);
  const [initialScore, setInitialScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadScore();
  }, [ideaId]);

  const loadScore = async () => {
    // Get all scores ordered by creation date
    const { data: scores } = await supabase
      .from("alignment_scores")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true });

    console.log('Loaded alignment scores:', scores);

    if (scores && scores.length > 0) {
      // First score = initial (from questionnaire)
      setInitialScore(scores[0]);
      // Latest score = current
      setCurrentScore(scores[scores.length - 1]);
      console.log('Initial score:', scores[0].details);
      console.log('Current score:', scores[scores.length - 1].details);
    }
    setLoading(false);
  };

  const calculateAlignment = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('astryd-analyse', {
        body: { ideaId }
      });

      if (error) throw error;
      
      await loadScore();
      toast.success("Analyse actualisée avec succès !");
    } catch (error: any) {
      console.error('Error calculating alignment:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setCalculating(false);
    }
  };

  const getDelta = (current: number, previous: number | undefined) => {
    if (!previous) return 0;
    return current - previous;
  };

  const renderDeltaBadge = (delta: number) => {
    if (delta === 0) return null;
    const isPositive = delta > 0;
    return (
      <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-orange-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? '+' : ''}{delta}
      </span>
    );
  };

  const renderProgressWithDelta = (
    current: number, 
    initial: number | undefined, 
    label: string
  ) => {
    const delta = getDelta(current, initial || 0);
    
    return (
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Initial: {initial || 0}</span>
            <span className="text-xs font-medium">→</span>
            <span className="font-medium">{current}/100</span>
            {renderDeltaBadge(delta)}
          </div>
        </div>
        <div className="relative h-2">
          {/* Initial value (ghost - lighter color) */}
          {initial !== undefined && (
            <div className="absolute top-0 left-0 right-0 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div 
                className="h-full bg-muted-foreground/30"
                initial={{ width: 0 }}
                animate={{ width: `${initial}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          )}
          {/* Current value (main color on top) */}
          <div className="absolute top-0 left-0 right-0 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: initial !== undefined ? `${initial}%` : 0 }}
              animate={{ width: `${current}%` }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!currentScore) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Score d'alignement</h3>
          </div>
          <Button 
            onClick={calculateAlignment} 
            disabled={calculating}
            size="sm"
          >
            {calculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calcul...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Calculer
              </>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">Aucun score disponible. Lance une première analyse pour voir ton alignement.</p>
      </Card>
    );
  }

  const currentDetails = currentScore.details || {};
  const initialDetails = initialScore?.details || {};
  const globalScore = currentScore.score_global || 0;
  const initialGlobalScore = initialScore?.score_global || 0;
  const globalDelta = getDelta(globalScore, initialGlobalScore);

  console.log('Rendering scores - Global:', globalScore, 'Current Details:', currentDetails, 'Initial Details:', initialDetails);

  return (
    <div className="space-y-4">

      {/* Global Score */}
      {!hideGlobalScore && (
        <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border/50">
          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Score initial (questionnaire)</span>
              <span className="font-semibold">{initialGlobalScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">+ Progression</span>
              <span className="font-semibold text-success">+{Math.max(0, globalScore - initialGlobalScore)}</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">= Score global actuel</span>
              <span className="font-bold text-lg">{globalScore}/100</span>
            </div>
          </div>
          <div className="relative h-3">
            <div className="absolute top-0 left-0 right-0 h-3 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/30"
                style={{ width: `${initialGlobalScore}%` }}
              />
            </div>
            <div className="absolute top-0 left-0 right-0 h-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${globalScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Scores */}
      <div className="space-y-3">
        {renderProgressWithDelta(currentDetails.energie || 0, initialDetails.energie, "Énergie")}
        {renderProgressWithDelta(currentDetails.temps || 0, initialDetails.temps, "Temps")}
        {renderProgressWithDelta(currentDetails.finances || 0, initialDetails.finances, "Finances")}
        {renderProgressWithDelta(currentDetails.soutien || 0, initialDetails.soutien, "Soutien")}
        {renderProgressWithDelta(currentDetails.competences || 0, initialDetails.competences, "Compétences")}
        {renderProgressWithDelta(currentDetails.motivation || 0, initialDetails.motivation, "Motivation")}
      </div>
    </div>
  );
};

export default AlignmentScoreWithDelta;
