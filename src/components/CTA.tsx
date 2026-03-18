import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CTA = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl bg-card border border-border shadow-sm"
      >
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Prêt·e à{" "}
            <span className="text-primary">
              avancer avec clarté ?
            </span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            Déposez votre première météo et commencez à transformer votre charge mentale en actions concrètes.
          </p>
        </div>

        <Link to="/onboarding">
          <Button
            size="lg"
            className="group h-auto min-h-[3rem] md:min-h-[3.5rem] px-5 sm:px-6 md:px-8 py-3 text-sm sm:text-base font-semibold rounded-full shadow-sm hover:shadow-md transition-all whitespace-normal leading-tight"
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
            Démarrer mon parcours
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        <p className="text-xs md:text-sm text-muted-foreground" style={{ color: '#6B7280' }}>
          2 minutes pour personnaliser ton accompagnement
        </p>
      </motion.div>
    </section>
  );
};

export default CTA;
