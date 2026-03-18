import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface IdeaEmptyStateProps {
  ideaId: string;
  onAddIdea: () => void;
}

const IdeaEmptyState = ({ ideaId, onAddIdea }: IdeaEmptyStateProps) => {
  const handleAddIdeaClick = () => {
    // On délègue totalement la logique d'auth / modale au parent (DashboardNew)
    onAddIdea();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-8 border border-border">
          <div className="text-center space-y-6">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm text-left max-w-md mx-auto space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Personnalisez votre accompagnement en renseignant votre idée de projet :
              </p>
              <ul className="space-y-1 text-muted-foreground ml-6">
                <li>✓ Des micro-actions ultra-ciblées sur votre projet</li>
                <li>✓ Des zones d'attention spécifiques à votre idée</li>
                <li>✓ Un coaching IA personnalisé à 100%</li>
                <li>✓ Une analyse d'alignement complète idée ⇄ profil</li>
              </ul>
            </div>

            <Button
              size="lg"
              onClick={handleAddIdeaClick}
              className="gap-2 h-auto py-4 px-8 text-base font-semibold"
            >
              Renseigner mon idée de projet
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-xs text-muted-foreground">
              ⏱️ 2 minutes • Vos données restent privées
            </p>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default IdeaEmptyState;
