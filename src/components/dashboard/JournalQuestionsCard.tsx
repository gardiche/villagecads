import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Activity, Clock, DollarSign, Users, Brain, Zap } from "lucide-react";

interface JournalQuestionsCardProps {
  ideaId: string;
}

interface JournalQuestion {
  question: string;
  objectif: string;
  jauges_ciblees: string[];
}

const JournalQuestionsCard = ({ ideaId }: JournalQuestionsCardProps) => {
  const [questions, setQuestions] = useState<JournalQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [ideaId]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("astryd_sessions")
      .select("journal_questions")
      .eq("idea_id", ideaId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.journal_questions) {
      const questionsData = data.journal_questions as any;
      
      // Handle both array and object formats
      if (Array.isArray(questionsData) && questionsData.length > 0) {
        setQuestions(questionsData);
      }
    }
    setLoading(false);
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

  if (questions.length === 0) {
    return null; // Don't show card if no questions
  }

  return (
    <Card className="p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Questions de réflexion</h3>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="bg-background/80 rounded-lg p-4 space-y-3">
            <p className="font-medium">{q.question}</p>
            <p className="text-sm text-muted-foreground italic">{q.objectif}</p>
            <div className="flex flex-wrap gap-2">
              {q.jauges_ciblees.map((jauge) => (
                <Badge key={jauge} variant="secondary" className="gap-1">
                  {getJaugeIcon(jauge)}
                  {getJaugeLabel(jauge)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default JournalQuestionsCard;
