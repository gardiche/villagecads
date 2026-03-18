import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sun, Flame, Lock } from "lucide-react";
import { motion } from "framer-motion";

type Tier = "declic" | "cap" | "elan";

interface PricingUpgradeProps {
  currentTier: Tier;
  onUpgrade: (tier: Tier) => void;
}

const tiers = {
  declic: {
    name: "Déclic",
    emoji: "🌙",
    icon: Star,
    price: "Gratuit",
    tagline: "Découvre ce qui t'inspire",
    features: [
      "Bilan IA (5 min)",
      "Simulateur (5 idées max)",
      "Aperçu du plan d'action",
    ],
    color: "bg-muted/50",
    current: true,
    recommended: false,
  },
  cap: {
    name: "Cap",
    emoji: "☀️",
    icon: Sun,
    price: "19 €/mois",
    tagline: "Accédez à l'historique complet et suivez votre progression",
    features: [
      "✅ Tout Déclic, plus :",
      "Historique complet illimité",
      "Export PDF récapitulatif",
      "Insights IA sur votre évolution",
      "Analyse de progression détaillée",
    ],
    color: "bg-primary/5",
    recommended: true,
    current: false,
  },
  elan: {
    name: "Élan",
    emoji: "🔥",
    icon: Flame,
    price: "Sur mesure",
    tagline: "Franchissez le cap avec un accompagnement humain",
    features: [
      "✅ Tout Cap, plus :",
      "Séances de coaching 1-to-1",
      "Accompagnement personnalisé continu",
      "Suivi de votre posture entrepreneuriale",
      "Accès à un réseau de mentors",
      "Ateliers collectifs exclusifs"
    ],
    color: "bg-accent/5",
    recommended: false,
    current: false,
  },
};

export const PricingUpgrade = ({ currentTier, onUpgrade }: PricingUpgradeProps) => {
  const availableTiers = Object.entries(tiers).filter(
    ([key]) => key !== currentTier
  );

  if (currentTier === "elan") {
    // User is already at the highest tier
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Badge */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
        <Badge variant="outline" className="text-sm">
          Formule actuelle : {tiers[currentTier].name} {tiers[currentTier].emoji}
        </Badge>
      </div>

      {/* Upgrade Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {availableTiers.map(([key, tier]) => {
          const TierIcon = tier.icon;
          const tierKey = key as Tier;
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card
                className={`relative overflow-hidden border-2 hover:border-primary/50 transition-all ${
                  tier.recommended ? "border-primary/30 md:scale-105" : "border-border"
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-primary px-4 py-1 rounded-full text-xs font-semibold text-primary-foreground">
                      Recommandé
                    </div>
                  </div>
                )}

                <div className={`p-6 ${tier.color}`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-border">
                      <TierIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl">{tier.emoji}</div>
                  </div>

                  <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground italic mb-3">
                    {tier.tagline}
                  </p>

                  {/* Price */}
                  <div className="text-3xl font-bold mb-4">{tier.price}</div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => onUpgrade(tierKey)}
                    size="lg"
                    variant={tier.recommended ? "default" : "outline"}
                    className="w-full"
                  >
                    Passer à {tier.name}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong className="text-foreground">Note :</strong> La création de compte est obligatoire pour les formules payantes. Vous pourrez sauvegarder votre profil et accéder à vos résultats à tout moment.
        </p>
      </div>
    </div>
  );
};
