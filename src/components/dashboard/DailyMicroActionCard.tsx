import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, Coffee, Trophy, Rocket, RefreshCw, Clock, Tag } from "lucide-react";
import { DailyMicroAction } from "@/hooks/useDailyCheckin";

interface DailyMicroActionCardProps {
  action: DailyMicroAction;
  onComplete: () => void;
  onSkip: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isAIGenerated?: boolean;
}

const DailyMicroActionCard = ({ 
  action, 
  onComplete, 
  onSkip, 
  onRegenerate,
  isRegenerating = false,
  isAIGenerated = true 
}: DailyMicroActionCardProps) => {
  const getActionIcon = () => {
    switch (action.action_type) {
      case "rest":
        return <Coffee className="h-5 w-5 text-blue-500" />;
      case "small_win":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "progress":
        return <Rocket className="h-5 w-5 text-green-500" />;
    }
  };

  const getActionTypeLabel = () => {
    switch (action.action_type) {
      case "rest":
        return "Repos";
      case "small_win":
        return "Petite victoire";
      case "progress":
        return "Progrès";
    }
  };

  const isCompleted = action.status === "done";
  const isSkipped = action.status === "skipped";

  if (isCompleted || isSkipped) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className={`p-4 ${isCompleted ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200' : 'bg-muted/50 border-muted'}`}>
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={`flex-1 ${isSkipped ? 'line-through text-muted-foreground' : ''}`}>
              {action.title}
            </span>
            {action.feeling_after && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                {action.feeling_after === "relieved" && "😌 Soulagé"}
                {action.feeling_after === "proud" && "😊 Fier"}
                {action.feeling_after === "still_stuck" && "😔 Encore bloqué"}
              </span>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 border-2 border-dashed border-primary/30 bg-card hover:border-primary/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            {getActionIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {getActionTypeLabel()}
              </span>
              {action.sujet_detecte && action.sujet_detecte !== "Non détecté" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1 font-medium">
                  <Tag className="h-3 w-3" />
                  {action.sujet_detecte}
                </span>
              )}
              {action.duree && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {action.duree}
                </span>
              )}
              {isAIGenerated && (
                <Badge variant="secondary" className="text-xs gap-1 border">
                  Généré pour vous par Astryd
                </Badge>
              )}
            </div>
            <p className="font-medium">{action.title}</p>
            {action.contexte && (
              <p className="text-xs text-muted-foreground italic">{action.contexte}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={onComplete} 
            className="flex-1"
            size="sm"
            disabled={isRegenerating}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            C'est fait !
          </Button>
          {onRegenerate && (
            <Button 
              onClick={onRegenerate} 
              variant="outline" 
              size="sm"
              disabled={isRegenerating}
              className="text-muted-foreground"
            >
              {isRegenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Changer</span>
            </Button>
          )}
          <Button 
            onClick={onSkip} 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground"
            disabled={isRegenerating}
          >
            Passer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default DailyMicroActionCard;
