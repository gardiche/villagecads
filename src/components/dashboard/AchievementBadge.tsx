import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Target, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type AchievementType = 
  | 'first_micro_action'
  | 'all_critical_zones_resolved'
  | 'first_journal_entry'
  | 'document_added'
  | 'milestone_reached';

interface AchievementConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  gradient: string;
}

const achievementConfigs: Record<AchievementType, AchievementConfig> = {
  first_micro_action: {
    icon: <CheckCircle2 className="w-8 h-8 text-success" />,
    title: 'Première action accomplie ! 🎯',
    message: 'Vous avez franchi le premier pas. Continuez sur cette lancée.',
    gradient: 'bg-muted border-border',
  },
  all_critical_zones_resolved: {
    icon: <Star className="w-8 h-8 text-primary" />,
    title: 'Freins majeurs levés ! ✨',
    message: 'Vous avez résolu toutes vos zones d\'attention critiques. Bravo !',
    gradient: 'bg-muted border-border',
  },
  first_journal_entry: {
    icon: <MessageSquare className="w-8 h-8 text-accent" />,
    title: 'Premier échange avec votre coach ! 💬',
    message: 'Vous avez commencé votre journal entrepreneurial.',
    gradient: 'bg-muted border-border',
  },
  document_added: {
    icon: <FileText className="w-8 h-8 text-primary" />,
    title: 'Document enrichi ! 📄',
    message: 'Votre idée est maintenant mieux documentée.',
    gradient: 'bg-muted border-border',
  },
  milestone_reached: {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: 'Cap franchi ! 🚀',
    message: 'Vous avancez régulièrement vers votre feu vert.',
    gradient: 'bg-muted border-border',
  },
};

interface AchievementBadgeProps {
  achievement: AchievementType | null;
  onDismiss: () => void;
}

export const AchievementBadge = ({ achievement, onDismiss }: AchievementBadgeProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (achievement) {
      setShow(true);
      // Auto-dismiss après 5 secondes
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300); // Attendre la fin de l'animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const config = achievementConfigs[achievement];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] max-w-md w-full mx-4"
        >
          <Card className={`p-6 ${config.gradient} border shadow-sm backdrop-blur-sm`}>
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="p-3 rounded-full bg-background/80"
              >
                {config.icon}
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.message}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
