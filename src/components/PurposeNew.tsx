import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PurposeNew = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4 md:space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight px-4">
            Entreprendre ne manque pas d'idées.{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Il manque un cadre qui respecte votre vie.
            </span>
          </h2>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6 md:space-y-8"
        >
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-3xl mx-auto px-4">
            Astryd part de vous, pas d'un business plan. Parce qu'entreprendre, c'est aligner une idée avec votre énergie, votre temps, vos valeurs — et votre vie réelle.
          </p>
        </motion.div>

        {/* Abstract illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative h-48 sm:h-64 md:h-80 max-w-2xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-glow/10 rounded-3xl backdrop-blur-3xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-4 text-center p-6">
              <div className="inline-flex items-center gap-3 text-4xl md:text-6xl">
                <span>✨</span>
                <span>→</span>
                <span>💡</span>
                <span>→</span>
                <span>🚀</span>
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                Alignement • Clarté • Action
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link to="/onboarding">
            <Button
              size="lg"
              className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Commencer mon diagnostic
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PurposeNew;
