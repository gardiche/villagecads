import { motion } from "framer-motion";
import { Users, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PlanElanTeaser = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-background px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-card rounded-2xl p-8 md:p-12 border border-border shadow-sm overflow-hidden"
        >
          
          <div className="relative z-10 text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Users className="w-4 h-4" />
              Pour celles et ceux qui sont accompagné·es
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold">
              ÉLAN : pour celles et ceux qui sont accompagnés
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Partagez certaines entrées (météo, journal, micro-actions) avec votre mentor 
              pour des échanges plus justes entre vos séances.
            </p>
            
            {/* Note de contrôle */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/80">
              <Lock className="w-4 h-4" />
              <span>Vous gardez le contrôle total sur ce que vous choisissez de partager, entrée par entrée.</span>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/pro')}
                className="group"
              >
                Découvrir l'approche mentors
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlanElanTeaser;
