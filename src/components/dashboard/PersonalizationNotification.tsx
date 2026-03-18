import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PersonalizationNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const PersonalizationNotification = ({
  isVisible,
  onClose,
}: PersonalizationNotificationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="relative overflow-hidden border border-border">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Personnalisation terminée !
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Votre espace résultats a été adapté à votre idée
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="flex-shrink-0 -mt-1 -mr-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 space-y-2 border border-border/50">
                    <p className="text-sm font-semibold text-foreground">
                      Ce qui a été personnalisé :
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>
                          <strong>Zones d'attention</strong> : Identifiées spécifiquement pour votre projet et votre profil
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>
                          <strong>Micro-actions</strong> : Adaptées à vos compétences et à votre idée pour maximiser votre progression
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>
                          <strong>Coaching IA</strong> : Le journal entrepreneurial comprend maintenant votre projet pour des réponses ultra-ciblées
                        </span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    💡 Votre profil entrepreneurial de base reste intact. Seul le coaching a été affiné pour correspondre à votre projet.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersonalizationNotification;
