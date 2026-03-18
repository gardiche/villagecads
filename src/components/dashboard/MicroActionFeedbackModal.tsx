import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Smile, Heart, CloudRain } from "lucide-react";

interface MicroActionFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feeling: "relieved" | "proud" | "still_stuck") => void;
}

const MicroActionFeedbackModal = ({ open, onOpenChange, onSubmit }: MicroActionFeedbackModalProps) => {
  const feelings = [
    {
      id: "relieved" as const,
      label: "Soulagé",
      emoji: "😌",
      icon: Heart,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/50 dark:hover:bg-blue-900/50",
      iconColor: "text-blue-500",
    },
    {
      id: "proud" as const,
      label: "Fier",
      emoji: "😊",
      icon: Smile,
      color: "bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/50 dark:hover:bg-green-900/50",
      iconColor: "text-green-500",
    },
    {
      id: "still_stuck" as const,
      label: "Toujours bloqué",
      emoji: "😔",
      icon: CloudRain,
      color: "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/50",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mb-4"
          >
            <div className="text-5xl">🎉</div>
          </motion.div>
          <DialogTitle className="text-xl">Bien joué !</DialogTitle>
          <DialogDescription className="text-base">
            Comment vous sentez-vous après cette action ?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {feelings.map((feeling, index) => (
            <motion.div
              key={feeling.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className={`w-full justify-start h-auto py-4 px-4 ${feeling.color} border-2`}
                onClick={() => onSubmit(feeling.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{feeling.emoji}</span>
                  <div className="text-left">
                    <span className="font-medium">{feeling.label}</span>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MicroActionFeedbackModal;
