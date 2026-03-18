import { motion } from 'framer-motion';
import { RefreshCw, Users, ShieldCheck } from 'lucide-react';

const arguments_confiance = [
  {
    icon: Users,
    text: "Conception par des entrepreneurs : un espace de réflexion conçu pour le réel, par des pairs qui connaissent vos enjeux.",
  },
  {
    icon: ShieldCheck,
    text: "Gestion de l'urgence : quand un sujet critique apparaît (cash, client), l'outil vous aide à structurer la priorité et à préparer l'action la plus sûre, sans jugement.",
  },
  {
    icon: RefreshCw,
    text: "Zéro injonction : vous gardez la main et pouvez régénérer une action en un clic.",
  },
];

const ADNAstryd = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4 leading-tight">
            Calibrée par le terrain.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Astryd est née au sein d'<a href="https://alpact.studio" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors">Alpact</a>. Elle est conçue pour le réel : transformer votre quotidien (charge, énergie, blocages) en micro-actions concrètes, grâce à l'analyse de centaines de retours d'entrepreneurs.
          </p>
        </motion.div>

        <div className="space-y-3">
          {arguments_confiance.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-4 bg-background border border-border/60 rounded-xl p-4 md:p-5"
            >
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <p className="text-foreground text-sm md:text-base">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ADNAstryd;
