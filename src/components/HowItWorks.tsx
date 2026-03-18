import { FileText, Brain, Target, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: FileText,
    title: "Répondez à quelques questions",
    description: "Sur votre énergie, votre temps disponible, votre situation et ce qui compte pour vous.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Brain,
    title: "Voyez ce qui vous aide et ce qui vous freine",
    description: "L'IA analyse votre situation et vous montre clairement où vous en êtes.",
    color: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Target,
    title: "Passez à l'action avec des petits pas",
    description: "Des actions concrètes adaptées à votre vie, un journal pour avancer à votre rythme.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Suivez votre progression",
    description: "Votre historique vous montre le chemin parcouru et ce qui change pour vous.",
    color: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Users,
    title: "Allez plus loin avec un coach",
    description: "Si vous en avez besoin, un accompagnement humain personnalisé pour franchir un cap.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
];

const HowItWorks = () => {

  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-24 lg:py-32 bg-muted/30 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Comment ça marche
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            De votre diagnostic à l'action concrète, un chemin fluide et personnalisé
          </p>
        </motion.div>

        {/* Steps - Mobile vertical */}
        <div className="space-y-4 md:hidden">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl p-5 border-2 border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                {/* Number badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-3`}>
                  <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-4 bg-border" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Steps - Desktop horizontal */}
        <div className="hidden md:grid md:grid-cols-5 gap-6 relative">
          {/* Connecting line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="relative bg-card rounded-2xl p-6 border-2 border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full">
                {/* Number badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm z-10">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-4 mt-6`}>
                  <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12 md:mt-16 px-4"
        >
          <p className="text-sm md:text-base text-muted-foreground mb-2">Une fois votre posture renforcée</p>
          <p className="text-base md:text-lg font-semibold">
            Passage fluide vers{" "}
            <a
              href="https://monalysa.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-primary transition-colors underline decoration-2 underline-offset-4"
            >
              Mona Lysa
            </a>
            {" "}pour tester et exécuter votre idée 🚀
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
