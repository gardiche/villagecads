import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface ProgressionStep {
  id: string;
  label: string;
  completed: boolean;
  icon?: React.ReactNode;
}

interface ProgressionJourneyProps {
  steps: ProgressionStep[];
  currentPhase: string;
  personaCap?: string;
}

export const ProgressionJourney = ({ steps, currentPhase, personaCap }: ProgressionJourneyProps) => {
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  const displayCap = personaCap || "Clarifier votre posture entrepreneuriale";

  return (
    <Card className="p-6 border border-border">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Votre parcours
          </h3>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {steps.length} étapes
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Phase actuelle : <span className="font-medium text-foreground">{currentPhase}</span>
        </p>
        <p className="text-sm font-medium text-primary">
          🎯 Cap : {displayCap}
        </p>
      </div>

      {/* Barre de progression visuelle */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-6">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Liste des étapes */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`flex-shrink-0 ${step.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${step.completed ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message encourageant selon la phase */}
      <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/50">
        <p className="text-sm text-center text-muted-foreground">
          {progressPercent === 100 ? (
            <>🎉 Vous avez complété toutes les étapes ! Continuez à échanger avec votre coach pour affiner votre parcours.</>
          ) : progressPercent >= 75 ? (
            <>✨ Vous approchez du feu vert ! Quelques étapes encore et vous serez prêt(e).</>
          ) : progressPercent >= 50 ? (
            <>💪 Belle progression ! Vous êtes sur la bonne voie.</>
          ) : progressPercent >= 25 ? (
            <>🌱 Bon démarrage ! Continuez à avancer pas à pas.</>
          ) : (
            <>👋 Bienvenue ! Découvrez votre parcours entrepreneurial personnalisé.</>
          )}
        </p>
      </div>
    </Card>
  );
};
