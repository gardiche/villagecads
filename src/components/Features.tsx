import { Zap, TrendingUp, Users, Upload, Heart } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Salarié·e en manque de temps mais motivé·e",
    description: "Vous jonglez entre votre emploi et votre projet.",
  },
  {
    icon: Heart,
    title: "Parent.e ou aidant.e avec une bande passante limitée",
    description: "Votre vie perso est remplie mais vous voulez avancer.",
  },
  {
    icon: TrendingUp,
    title: "En transition pro, reconversion ou quête de sens",
    description: "Vous cherchez votre prochaine étape.",
  },
  {
    icon: Users,
    title: "Multi-idées, dispersé·e, besoin d'un cap",
    description: "Vous avez plein d'idées mais vous ne savez pas par où commencer.",
  },
  {
    icon: Upload,
    title: "Bloqué·e par la légitimité ou le manque de confiance",
    description: "Vous doutez de votre capacité à entreprendre.",
  },
  {
    icon: Heart,
    title: "Seul·e face à votre projet et en boucle mentale",
    description: "Vous vous sentez isolé·e et vous aimeriez être accompagné·e.",
  },
];

const Features = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-background px-4">
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
            Pour qui ?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Astryd est parfait si vous êtes :
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full p-5 md:p-6 lg:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-sm">
                {/* Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
