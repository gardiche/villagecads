import { motion } from "framer-motion";
import { CheckCircle2, Shield } from "lucide-react";

const benefits = [
  "Avancer sans vous épuiser - Astryd détecte les signaux de surcharge et vous aide à avancer à votre rythme.",
  "Retrouver de la clarté rapidement - Découvrez où mettre votre énergie maintenant, sans vous disperser.",
  "Passer à l'action en 48–72 h - Des micro-actions guidées, concrètes et adaptées à votre emploi du temps.",
  "Savoir quand décider - Chaque mois, une recommandation : Go — Keep — Pivot — Stop pour avancer avec sérénité.",
];

const Benefits = () => {

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-background px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12 space-y-3 md:space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Les bénéfices
          </h2>
        </motion.div>

        <div className="space-y-3 md:space-y-4 mb-10 md:mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base lg:text-lg text-foreground">{benefit}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto"
        >
          <div className="p-4 md:p-6 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">100 % personnalisé</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Votre bilan, votre contexte, votre alignement</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">Sans engagement</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Vos données restent privées</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Benefits;
