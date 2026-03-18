import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, Sun, Flame } from "lucide-react";
import { Link } from "react-router-dom";

const pricingTiers = [
  {
    icon: Star,
    name: "Déclic",
    emoji: "🌙",
    tagline: "Réveillez votre envie",
    price: "Gratuit",
    description: "Pour explorer et commencer votre parcours",
    features: [
      "Bilan IA (5 min)",
      "3 idées personnalisées",
      "Premiers conseils d'action",
    ],
    cta: "Commencer gratuitement",
    highlight: false,
    color: "bg-muted/50",
    borderColor: "border-border",
    recommended: false,
    current: false,
  },
  {
    icon: Sun,
    name: "Cap",
    emoji: "☀️",
    tagline: "Suivez votre progression",
    price: "19 €/mois",
    description: "Pour accéder à l'historique complet et suivre votre cheminement",
    features: [
      "Historique complet illimité",
      "Export PDF récapitulatif",
      "Insights IA sur votre évolution",
      "Analyse de progression détaillée",
    ],
    cta: "Obtenir Cap",
    highlight: true,
    color: "bg-primary/5",
    borderColor: "border-primary",
    recommended: true,
    current: false,
  },
  {
    icon: Flame,
    name: "Élan",
    emoji: "🔥",
    tagline: "Accompagnement humain",
    price: "Sur mesure",
    description: "Pour être accompagné·e par un coach entrepreneurial",
    features: [
      "Séances de coaching 1-to-1",
      "Accompagnement personnalisé continu",
      "Suivi de votre posture entrepreneuriale",
      "Accès à un réseau de mentors",
      "Ateliers collectifs exclusifs",
    ],
    cta: "Premium + (Bientôt)",
    highlight: false,
    color: "bg-accent/5",
    borderColor: "border-border",
    recommended: false,
    current: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-background px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Les formules Astryd
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            De la découverte à l'action : choisissez votre parcours vers le feu vert entrepreneurial
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${tier.highlight ? 'md:scale-105' : ''}`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-primary px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold text-primary-foreground shadow-sm">
                    Recommandé
                  </div>
                </div>
              )}
              
              <div className={`h-full p-6 md:p-8 rounded-2xl ${tier.color} border-2 ${tier.borderColor} hover:shadow-sm transition-all`}>
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                    <tier.icon className={`w-6 h-6 ${tier.highlight ? 'text-primary' : 'text-foreground'}`} />
                  </div>
                  <div>
                    <div className="text-2xl">{tier.emoji}</div>
                  </div>
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm md:text-base font-medium text-muted-foreground mb-4 italic">
                  {tier.tagline}
                </p>
                
                {/* Price */}
                <div className="mb-4">
                  <div className="text-3xl md:text-4xl font-bold mb-1">{tier.price}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">{tier.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/onboarding" className="block">
                  <Button
                    size="lg"
                    variant={tier.highlight ? "default" : "outline"}
                    className="w-full text-sm md:text-base font-semibold"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 md:mt-16 space-y-2"
        >
        <p className="text-sm md:text-base text-muted-foreground">
          <strong className="text-foreground">Déclic</strong> → réveillez votre envie • <strong className="text-foreground">Cap</strong> → trouvez votre axe • <strong className="text-foreground">Élan</strong> → passez à l'action
        </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
