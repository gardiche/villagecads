import { motion } from "framer-motion";
import { Target, Lightbulb, Rocket } from "lucide-react";

const Purpose = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-muted/20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 md:space-y-6"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-3 md:mb-4">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            À quoi sert Astryd
          </h2>
          
          <div className="space-y-3 md:space-y-4 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
            <p>
              <strong className="text-foreground">Pour celles et ceux qui manquent de sens</strong>, qui veulent entreprendre leur vie mais ne savent pas comment.
            </p>
            <p>
              Astryd vous aide à trouver une <strong className="text-foreground">idée alignée</strong> avec votre personnalité, votre équilibre de vie et votre contexte réel (temps, énergie, entourage).
            </p>
            <p className="flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              En quelques minutes, vous obtenez <strong className="text-foreground">des pistes concrètes et un plan d&apos;action personnalisé</strong> pour dire : &quot;OK, je peux entreprendre.&quot;
            </p>
            <p>
              Ensuite, vous pouvez continuer sur <strong className="text-foreground">Mona Lysa</strong> pour concrétiser votre projet.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Purpose;
