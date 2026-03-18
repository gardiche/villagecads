import { motion } from "framer-motion";
import { Users, Mail } from "lucide-react";
import { Button } from "./ui/button";

const Examples = () => {
  const mailtoLink = "mailto:tbo@alpact.vc?subject=Intérêt%20pour%20le%20coaching%20Astryd&body=Bonjour%20%2C%0A%0AJe%20souhaite%20être%20recontacté·e%20au%20sujet%20du%20coaching%20entrepreneurial%20avec%20Astryd.%0A%0ANom%20:%0AIdée%20de%20projet%20:%0ASituation%20actuelle%20:%0A%0AMerci%20!";

  const handleContactClick = () => {
    // Track analytics
    const event = {
      type: "coaching_contact_clicked_landing",
      timestamp: new Date().toISOString(),
    };
    
    const analytics = JSON.parse(localStorage.getItem("astryd_coaching_analytics") || "[]");
    analytics.push(event);
    localStorage.setItem("astryd_coaching_analytics", JSON.stringify(analytics));
    
    window.location.href = mailtoLink;
  };

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12 space-y-3 md:space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold mb-4">
            <Users className="w-4 h-4 text-primary" />
            <span>Bientôt disponible</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Bientôt : un mélange puissant IA + humain
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Pour aller plus loin, vous pourrez bientôt travailler avec un coach certifié qui pourra :
          </p>
        </motion.div>

        <div className="space-y-4 mb-8">
          {[
            { emoji: "🤝", text: "lire votre journal (si vous l'autorisez)," },
            { emoji: "🧠", text: "enrichir vos zones d'attention," },
            { emoji: "🎯", text: "personnaliser vos micro-actions," },
            { emoji: "🚀", text: "vous aider à franchir un cap précis," },
            { emoji: "📈", text: "suivre vos progrès avec vous." },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border"
            >
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <p className="text-sm md:text-base text-foreground pt-1">{item.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Button
            size="lg"
            variant="outline"
            onClick={handleContactClick}
            className="group h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Mail className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Être informé·e dès l'ouverture
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Examples;
