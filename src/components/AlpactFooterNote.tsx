import { motion } from "framer-motion";

const AlpactFooterNote = () => {
  return (
    <section className="py-12 sm:py-16 px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4 max-w-3xl mx-auto"
      >
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Commencez avec <strong>Déclic</strong> pour réveiller votre envie • Passez à <strong>Cap</strong> pour trouver votre axe • Choisissez <strong>Élan</strong> pour passer à l'action
        </p>
        <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border/50 max-w-xl mx-auto">
          Une initiative d'<a href="https://alpact.studio" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors">Alpact</a>, le venture studio des entrepreneurs du réel.
        </p>
      </motion.div>
    </section>
  );
};

export default AlpactFooterNote;
