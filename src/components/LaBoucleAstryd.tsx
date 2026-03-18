import { CloudSun, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";

const etapes = [
  {
    numero: "1",
    icon: CloudSun,
    action: "Déposer",
    headline: "Votre réalité du jour.",
    description:
      "Météo, journaling, blocages : vous videz votre sac. L'outil capte votre niveau d'énergie et vos contraintes réelles.",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    numero: "2",
    icon: Search,
    action: "Comprendre",
    headline: "Ce qui freine vraiment.",
    description:
      "L'IA audite votre contexte — charge, patterns récurrents, échéances, environnement (solo, équipe, accompagné) — et identifie les vrais leviers.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    numero: "3",
    icon: Zap,
    action: "Agir",
    headline: "Une action calibrée pour vous.",
    description:
      "Pas un conseil générique. Une micro-action adaptée à votre état réel, vos contraintes du moment et votre rythme. Aujourd'hui.",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const LaBoucleAstryd = () => {
  return (
    <section className="py-20 md:py-28 bg-background px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-20"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
            Comment ça marche
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight max-w-3xl mx-auto">
            Des actions adaptées à votre réalité.
            <br />
            <span className="text-muted-foreground font-normal text-xl sm:text-2xl md:text-3xl">
              Pas des conseils génériques.
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Astryd analyse votre contexte et vous propose l'action qui fait vraiment avancer. Un rituel simple, chaque jour.
          </p>
        </motion.div>

        {/* Desktop: Horizontal flow */}
        <div className="hidden md:flex items-start justify-center gap-4 relative">
          {etapes.map((etape, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex items-center"
            >
              <div className="relative bg-card rounded-3xl p-8 border-2 border-border hover:border-primary/40 transition-all duration-300 w-80 text-center group">
                {/* Numéro */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                  {etape.numero}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl ${etape.color} flex items-center justify-center mx-auto mb-5 mt-2`}
                >
                  <etape.icon className={`w-8 h-8 ${etape.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-1">{etape.action}</h3>
                <p className="text-sm font-semibold text-foreground/80 mb-3">
                  {etape.headline}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {etape.description}
                </p>
              </div>

              {/* Arrow */}
              {index < etapes.length - 1 && (
                <div className="mx-2 text-muted-foreground/40">
                  <svg
                    width="32"
                    height="24"
                    viewBox="0 0 32 24"
                    fill="none"
                    className="text-primary/40"
                  >
                    <path
                      d="M20 4L28 12L20 20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 12H28"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile: Vertical flow */}
        <div className="md:hidden space-y-6">
          {etapes.map((etape, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="relative bg-card rounded-2xl p-6 border-2 border-border">
                {/* Numéro */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold shadow-lg">
                  {etape.numero}
                </div>

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl ${etape.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <etape.icon className={`w-7 h-7 ${etape.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-bold mb-0.5">{etape.action}</h3>
                    <p className="text-sm font-semibold text-foreground/80 mb-1.5">
                      {etape.headline}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {etape.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connector */}
              {index < etapes.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-6 bg-border" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LaBoucleAstryd;
