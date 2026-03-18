import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, Sun, Flame } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    icon: Star,
    name: "Déclic",
    emoji: "🌙",
    tagline: "Réveillez votre envie",
    price: "0€",
    features: [
      "Diagnostic IA personnalisé",
      "Bilan de votre alignement",
      "3 zones d'attention prioritaires",
      "Découvrez si votre idée vous correspond"
    ],
    cta: "Commencer",
    popular: false,
    comingSoon: false,
  },
  {
    icon: Sun,
    name: "Cap",
    emoji: "☀️",
    tagline: "Suivez votre progression",
    price: "19€/mois",
    features: [
      "Tout Déclic",
      "Historique complet illimité",
      "Export PDF récapitulatif",
      "Insights IA sur votre évolution",
      "Analyse de progression détaillée"
    ],
    cta: "Obtenir Cap",
    popular: true,
    comingSoon: false,
  },
  {
    icon: Flame,
    name: "Élan",
    emoji: "🔥",
    tagline: "Accompagnement humain",
    price: "Sur mesure",
    features: [
      "L'alliance de l'IA et de votre mentor humain."
    ],
    cta: "Voir comment ça marche",
    popular: false,
    comingSoon: true,
    mailto: "tbo@alpact.vc",
  },
];

const PricingNew = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20 space-y-3 md:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold px-4">
            Choisissez votre formule
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            De la découverte à l'action : votre parcours vers l'entrepreneuriat
          </p>
        </motion.div>

        {/* Journey visual indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-center gap-3 md:gap-4 mb-12 sm:mb-16 px-4"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">🌙</span>
            <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:inline">Déclic</span>
          </div>
          <div className="h-px w-8 md:w-12 bg-border"></div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">☀️</span>
            <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:inline">Cap</span>
          </div>
          <div className="h-px w-8 md:w-12 bg-border"></div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">🔥</span>
            <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:inline">Élan</span>
          </div>
        </motion.div>

        {/* Pricing Cards - Vertical on mobile, grid on tablet+ */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-primary px-4 py-1 rounded-full text-xs font-bold text-primary-foreground">
                      Le plus populaire
                    </div>
                  </div>
                )}

                {/* Coming Soon badge */}
                {tier.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-muted-foreground px-4 py-1 rounded-full text-xs font-bold text-white">
                      Bientôt disponible
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`relative h-full rounded-2xl overflow-hidden transition-all duration-200 ${
                  tier.popular 
                    ? 'bg-card border-2 border-primary shadow-sm' 
                    : 'bg-card border border-border shadow-sm'
                }`}>
                  <div className="p-6 sm:p-7 md:p-8 space-y-6 md:space-y-7">
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl md:text-5xl">{tier.emoji}</span>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-display font-bold mb-1">{tier.name}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground italic">{tier.tagline}</p>
                      </div>

                      <div className="pt-2">
                        <span className="text-4xl sm:text-5xl font-bold">{tier.price}</span>
                        {tier.name === "Cap" && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Sans engagement. Vos données vous appartiennent.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border"></div>

                    {/* Features */}
                    <ul className="space-y-3 md:space-y-4">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base text-foreground/90 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="pt-2 space-y-3">
                      {tier.comingSoon ? (
                        <Button
                          size="lg"
                          className="w-full text-sm sm:text-base md:text-lg font-semibold h-auto min-h-[3rem] sm:min-h-[3.5rem] py-3 rounded-xl transition-all whitespace-normal leading-tight"
                          onClick={() => {
                            document.getElementById('elan-teaser')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {tier.cta}
                        </Button>
                      ) : tier.popular ? (
                        <Link to="/onboarding" className="block">
                          <Button
                            size="lg"
                            className="w-full text-sm sm:text-base md:text-lg font-semibold h-auto min-h-[3rem] sm:min-h-[3.5rem] py-3 rounded-xl transition-all whitespace-normal leading-tight"
                          >
                            {tier.cta}
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/onboarding" className="block">
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full text-sm sm:text-base md:text-lg font-semibold h-auto min-h-[3rem] sm:min-h-[3.5rem] py-3 rounded-xl transition-all border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 text-primary whitespace-normal leading-tight"
                          >
                            {tier.cta}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingNew;
