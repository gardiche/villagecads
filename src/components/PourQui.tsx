import { motion } from "framer-motion";
import { Clock, Heart, Compass, Sparkles, Shield, MessageCircle } from "lucide-react";

const personas = [
  {
    icon: Clock,
    title: "Salarié·e en manque de temps mais motivé·e",
    description: "Vous jonglez entre votre emploi et votre projet."
  },
  {
    icon: Heart,
    title: "Parent·e ou aidant·e avec une bande passante limitée",
    description: "Votre vie perso est remplie mais vous voulez avancer."
  },
  {
    icon: Compass,
    title: "En transition pro, reconversion ou quête de sens",
    description: "Vous cherchez votre prochaine étape."
  },
  {
    icon: Sparkles,
    title: "Multi-idées, dispersé·e, besoin d'un cap",
    description: "Vous avez plein d'idées mais vous ne savez pas par où commencer."
  },
  {
    icon: Shield,
    title: "Bloqué·e par la légitimité ou le manque de confiance",
    description: "Vous doutez de votre capacité à entreprendre."
  },
  {
    icon: MessageCircle,
    title: "Seul·e face à votre projet et en boucle mentale",
    description: "Vous vous sentez isolé·e et vous aimeriez être accompagné·e."
  }
];

const PourQui = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-secondary/10 to-background px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
            Pour qui ?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Astryd est parfait si vous êtes :
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-border/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground leading-tight">
                      {persona.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {persona.description}
                    </p>
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

export default PourQui;
