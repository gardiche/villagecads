import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import RecalculateModal from "./RecalculateModal";

interface AlignmentScoreCardProps {
  ideaId: string;
}

const AlignmentScoreCard = ({ ideaId }: AlignmentScoreCardProps) => {
  const navigate = useNavigate();
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);

  useEffect(() => {
    loadScore();
  }, [ideaId]);

  // Force refresh on mount to see latest changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadScore();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadScore = async () => {
    const { data, error } = await supabase
      .from("alignment_scores")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setScore(data);
    }
    setLoading(false);
  };

  const handleRecalculate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      setLoading(true);
      toast.info("Recalcul en cours...");

      const { data, error } = await supabase.functions.invoke('astryd-analyse', {
        body: { ideaId }
      });

      if (error) {
        console.error('Error recalculating:', error);
        toast.error("Erreur lors du recalcul");
        setLoading(false);
        return;
      }

      toast.success("Analyse terminée !");
      await loadScore();
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors du recalcul");
      setLoading(false);
    }
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

  if (!score) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Score d'alignement</h3>
          </div>
          <Button 
            onClick={handleRecalculate} 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Calculer
          </Button>
        </div>
        <div className="space-y-4">
          <p className="text-muted-foreground">Aucun score disponible. Cliquez sur "Calculer" pour analyser l'alignement entre votre profil et votre idée.</p>
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <p className="font-semibold">Comment c'est calculé ?</p>
            <p className="text-muted-foreground">L'IA analyse l'alignement entre votre idée et votre profil sur 6 dimensions : énergie (réservoirs de vie), temps disponible, finances (sécurité personnelle et tolérance au risque), soutien de l'entourage, compétences (CV/expérience), et motivation (valeurs + personnalité).</p>
          </div>
        </div>
      </Card>
    );
  }

  const details = score.details || {};
  const globalScore = score.score_global || 0;
  const explications = details.explications_jauges || {};

  return (
    <Card className="p-6">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-display font-bold text-lg">Score d'alignement</h3>
          </div>
          <Button 
            onClick={handleRecalculate} 
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculer
          </Button>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
          <p><span className="font-semibold">Comment c'est calculé ?</span> L'IA croise votre profil complet (valeurs, personnalité, réservoirs de vie, contexte, CV) avec les besoins de votre idée pour analyser l'alignement sur 6 dimensions.</p>
        </div>
      </div>

      {/* Global Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Global</span>
          <span className="font-bold text-2xl">{globalScore}/100</span>
        </div>
        <Progress value={globalScore} className="h-3" />
      </div>

      {/* Detailed Scores */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Énergie</span>
            <span className="font-medium">{details.energie || 0}/100</span>
          </div>
          <Progress value={details.energie || 0} className="h-2" />
          {explications.explication_energie && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_energie}
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Temps</span>
            <span className="font-medium">{details.temps || 0}/100</span>
          </div>
          <Progress value={details.temps || 0} className="h-2" />
          {explications.explication_temps && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_temps}
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Finances</span>
            <span className="font-medium">{details.finances || 0}/100</span>
          </div>
          <Progress value={details.finances || 0} className="h-2" />
          {explications.explication_finances && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_finances}
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Soutien</span>
            <span className="font-medium">{details.soutien || 0}/100</span>
          </div>
          <Progress value={details.soutien || 0} className="h-2" />
          {explications.explication_soutien && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_soutien}
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Compétences</span>
            <span className="font-medium">{details.competences || 0}/100</span>
          </div>
          <Progress value={details.competences || 0} className="h-2" />
          {explications.explication_competences && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_competences}
            </p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Motivation</span>
            <span className="font-medium">{details.motivation || 0}/100</span>
          </div>
          <Progress value={details.motivation || 0} className="h-2" />
          {explications.explication_motivation && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              {explications.explication_motivation}
            </p>
          )}
        </div>
      </div>

      <RecalculateModal 
        open={showRecalculateModal}
        onOpenChange={setShowRecalculateModal}
        onConfirm={() => {
          setShowRecalculateModal(false);
          navigate(`/onboarding?prefill=true&ideaId=${ideaId}`);
        }}
      />
    </Card>
  );
};

export default AlignmentScoreCard;
