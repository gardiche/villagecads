import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sun, Battery, Brain, Send, CheckCircle2, Users, BookOpen, ArrowRight } from "lucide-react";
import { useDailyCheckin, DailyCheckin } from "@/hooks/useDailyCheckin";
import DailyMicroActionCard from "./DailyMicroActionCard";
import MicroActionFeedbackModal from "./MicroActionFeedbackModal";

interface DailyPulseProps {
  onCheckinComplete?: (checkin: DailyCheckin) => void;
}

const DailyPulse = ({ onCheckinComplete }: DailyPulseProps) => {
  const navigate = useNavigate();
  const { todayCheckin, todayActions, isLoading, isRegenerating, createCheckin, updateActionStatus, regenerateAction } = useDailyCheckin();
  
  const [energy, setEnergy] = useState(5);
  const [clarity, setClarity] = useState(5);
  const [mood, setMood] = useState(5);
  const [journalEntry, setJournalEntry] = useState("");
  const [shareWithMentor, setShareWithMentor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackActionId, setFeedbackActionId] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const checkin = await createCheckin({
        energy_level: energy,
        clarity_level: clarity,
        mood_level: mood,
        journal_entry: journalEntry || undefined,
        shared_with_mentor: shareWithMentor,
      });
      onCheckinComplete?.(checkin);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionComplete = (actionId: string) => {
    setFeedbackActionId(actionId);
  };

  const handleFeedbackSubmit = (feeling: "relieved" | "proud" | "still_stuck") => {
    if (feedbackActionId) {
      updateActionStatus(feedbackActionId, "done", feeling);
      setFeedbackActionId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check-in déjà fait : afficher le résumé et les micro-actions
  if (todayCheckin) {
    const avgScore = (todayCheckin.energy_level + todayCheckin.clarity_level + todayCheckin.mood_level) / 3;
    const isLowEnergy = avgScore < 5;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`border ${isLowEnergy ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : 'border-green-200 bg-green-50/50 dark:bg-green-950/20'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              {isLowEnergy ? (
                <>
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Battery className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Mode Régénération</span>
                </>
              ) : (
              <>
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Mode Action</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Résumé des niveaux */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Battery className="h-4 w-4" />
                Énergie : {todayCheckin.energy_level}/10
              </div>
              <div className="flex items-center gap-1.5">
                <Brain className="h-4 w-4" />
                Clarté : {todayCheckin.clarity_level}/10
              </div>
              <div className="flex items-center gap-1.5">
                <Sun className="h-4 w-4" />
                Moral : {todayCheckin.mood_level}/10
              </div>
            </div>

            {/* Message personnalisé */}
            <p className="text-sm">
              {isLowEnergy 
                ? "Aujourd'hui, privilégiez les actions douces. Pas de pression, juste des petits pas."
                : "Vous êtes en forme ! C'est le moment idéal pour avancer sur vos priorités."
              }
            </p>

            {/* Micro-actions du jour */}
            {todayActions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Votre action du jour :</h4>
                {todayActions.map((action) => (
                  <DailyMicroActionCard
                    key={action.id}
                    action={action}
                    onComplete={() => handleActionComplete(action.id)}
                    onSkip={() => updateActionStatus(action.id, "skipped")}
                    onRegenerate={() => regenerateAction(action.id)}
                    isRegenerating={isRegenerating}
                  />
                ))}
              </div>
            )}

            {/* Lien vers le Journal avec contexte de l'action */}
            <div className="pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Passer un topic suggéré au Journal (bannière, pas pré-remplissage)
                  const currentAction = todayActions.find(a => a.status === "pending") || todayActions[0];
                  const suggestedTopic = currentAction 
                    ? `Pour aller plus loin sur l'action : "${currentAction.title}"` 
                    : undefined;
                  navigate("/journal", { 
                    state: { suggestedTopic }
                  });
                }}
                className="w-full justify-between text-muted-foreground hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Continuer dans le Journal
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <MicroActionFeedbackModal
          open={!!feedbackActionId}
          onOpenChange={(open) => !open && setFeedbackActionId(null)}
          onSubmit={handleFeedbackSubmit}
        />
      </motion.div>
    );
  }

  // Formulaire de check-in
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-full bg-primary/10">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            Votre check-in du matin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slider Énergie */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-muted-foreground" />
                Niveau d'énergie
              </Label>
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10">
                {energy}/10
              </span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={([v]) => setEnergy(v)}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>😴 Épuisé</span>
              <span>⚡ En forme</span>
            </div>
          </div>

          {/* Slider Clarté */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                Clarté mentale
              </Label>
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10">
                {clarity}/10
              </span>
            </div>
            <Slider
              value={[clarity]}
              onValueChange={([v]) => setClarity(v)}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🌫️ Brouillard</span>
              <span>💡 Limpide</span>
            </div>
          </div>

          {/* Slider Moral */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                Moral
              </Label>
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10">
                {mood}/10
              </span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={([v]) => setMood(v)}
              max={10}
              min={1}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>😔 Difficile</span>
              <span>😊 Confiant</span>
            </div>
          </div>

          {/* Zone de texte */}
          <div className="space-y-2">
            <Label htmlFor="journal">Qu'est-ce qui vous préoccupe le plus ce matin ?</Label>
            <Textarea
              id="journal"
              placeholder="Une réflexion sur votre action du jour ?"
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Switch partage mentor */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="share-mentor" className="text-sm font-medium cursor-pointer">
                  Partager avec mon mentor
                </Label>
                <p className="text-xs text-muted-foreground">Si applicable, votre mentor verra ce ressenti</p>
              </div>
            </div>
            <Switch
              id="share-mentor"
              checked={shareWithMentor}
              onCheckedChange={setShareWithMentor}
            />
          </div>

          {/* Bouton de validation */}
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Enregistrement..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Valider mon check-in
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyPulse;
