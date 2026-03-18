import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Check } from "lucide-react";

interface UpgradePromptProps {
  tier: "cap" | "elan";
  title: string;
  description: string;
  features: string[];
  onUpgrade: () => void;
  className?: string;
}

export const UpgradePrompt = ({
  tier,
  title,
  description,
  features,
  onUpgrade,
  className = "",
}: UpgradePromptProps) => {
  const tierConfig = {
    cap: {
      name: "Cap",
      emoji: "☀️",
      price: "19 €/mois",
      gradient: "bg-muted/30",
    },
    elan: {
      name: "Élan",
      emoji: "🔥",
      price: "Sur mesure",
      gradient: "bg-muted/30",
    },
  };

  const config = tierConfig[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className={`relative overflow-hidden border border-border ${config.gradient}`}>
        <div className="p-4 md:p-6 lg:p-8 text-center space-y-3 md:space-y-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
          </div>

          <Badge variant="outline" className="text-xs md:text-sm">
            Fonctionnalité Premium
          </Badge>

          <div className="space-y-2 px-4">
            <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
            <p className="text-sm md:text-base text-muted-foreground">{description}</p>
          </div>

          <div className="space-y-2 max-w-md mx-auto text-left px-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-xs md:text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 md:pt-4 px-4">
            <Button size="lg" onClick={onUpgrade} className="gap-2 w-full">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">Passer à {config.name} {config.emoji} — {config.price}</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Création de compte requise pour les formules payantes
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
