import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, Zap, Clock, DollarSign, Users, Brain, Activity, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAstrydSession } from "@/hooks/useAstrydSession";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MicroCommitmentsCardProps {
  ideaId: string;
  onCommitmentToggled?: () => void;
}

const MicroCommitmentsCard = ({ ideaId, onCommitmentToggled }: MicroCommitmentsCardProps) => {
  const [commitments, setCommitments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logMicroActionCompleted } = useAstrydSession();

  useEffect(() => {
    loadCommitments();
  }, [ideaId]);

  const loadCommitments = async () => {
    const { data, error } = await supabase
      .from("micro_commitments")
      .select("*")
      .eq("idea_id", ideaId)
      .or('archived.is.null,archived.eq.false')
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCommitments(data);
    }
    setLoading(false);
  };

  const toggleCommitment = async (commitmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    
    const { error } = await supabase
      .from("micro_commitments")
      .update({ status: newStatus })
      .eq("id", commitmentId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    setCommitments(commitments.map(c => 
      c.id === commitmentId ? { ...c, status: newStatus } : c
    ));

    if (newStatus === "done") {
      toast.success("Bravo ! Micro-action complétée 🎉", {
        description: "De nouvelles actions vont être générées. Actualisez pour voir les résultats mis à jour.",
        action: {
          label: "Actualiser",
          onClick: () => window.location.reload()
        },
        duration: 8000
      });
      
      // 📊 LOG: User completed a micro-action
      await logMicroActionCompleted(ideaId);
    } else {
      toast.info("Micro-action marquée comme non complétée", {
        description: "Actualisez pour voir les résultats mis à jour.",
        action: {
          label: "Actualiser",
          onClick: () => window.location.reload()
        },
        duration: 8000
      });
    }

    // Trigger parent callback immediately
    if (onCommitmentToggled) {
      onCommitmentToggled();
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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-success" />
          <h3 className="font-display font-bold text-lg">Micro-actions</h3>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {commitments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune action pour le moment</p>
          <p className="text-sm mt-2">Créez vos premières micro-actions hebdomadaires</p>
        </div>
      ) : (
      <div className="space-y-3">
        {commitments.filter(c => c.status !== "done").slice(0, 5).concat(commitments.filter(c => c.status === "done").slice(0, 5)).map((commitment) => (
          <Collapsible key={commitment.id}>
            <Card className="hover:shadow-md transition-all">
              <CollapsibleTrigger className="w-full text-left">
                <div className="flex items-start gap-3 p-4">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCommitment(commitment.id, commitment.status);
                    }}
                  >
                    <Checkbox
                      checked={commitment.status === "done"}
                      className="mt-0.5"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className={`font-medium leading-relaxed ${commitment.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {commitment.text}
                      </p>
                      <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {commitment.duree && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {commitment.duree}
                        </Badge>
                      )}
                      {commitment.jauge_ciblee && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          {getJaugeIcon(commitment.jauge_ciblee)}
                          {getJaugeLabel(commitment.jauge_ciblee)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 ml-9 space-y-3 border-t border-border/50 pt-4">
                  {commitment.objectif && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Objectif</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{commitment.objectif}</p>
                    </div>
                  )}
                  {commitment.impact_attendu && commitment.status !== "done" && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Impact attendu</h4>
                      <p className="text-xs text-primary/70 leading-relaxed">💡 {commitment.impact_attendu}</p>
                    </div>
                  )}
                  {commitment.period && (
                    <p className="text-xs text-muted-foreground">
                      {commitment.period === "weekly" ? "Hebdomadaire" : "Mensuel"}
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
      )}
    </Card>
  );
};

export default MicroCommitmentsCard;
