import { Brain, Users, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const freins = [
  {
    icon: Brain,
    title: "La Surcharge",
    description: "Trop d'infos, trop de tâches, trop de décisions. Le cerveau sature et finit par figer.",
  },
  {
    icon: Users,
    title: "L'Isolement",
    description: "Des doutes que vous n'osez pas exprimer. Un poids que vous portez seul·e.",
  },
  {
    icon: Compass,
    title: "La Perte de Sens",
    description: "Vous avancez, mais vers quoi ? Le cap s'efface sous la pression du quotidien.",
  },
];

const LeVraiFrein = () => {
  return (
    <section className="py-20 md:py-28 bg-background px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 md:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight max-w-3xl mx-auto">
            Entreprendre demande plus qu'une méthode.
            <br />
            <span className="text-primary">Ça demande un moteur.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
            Pensé pour les phases où tout s'accélère : vente, trésorerie, décisions difficiles.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {freins.map((frein, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card className="h-full border-2 border-border hover:border-primary/30 transition-all duration-300 bg-card/50">
                <CardContent className="p-8 text-center space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <frein.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{frein.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {frein.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeVraiFrein;
