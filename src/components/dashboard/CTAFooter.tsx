import { Button } from "@/components/ui/button";
import { TrendingUp, Users } from "lucide-react";

interface CTAFooterProps {
  onProgressionClick: () => void;
  onCoachingClick: () => void;
  hideProgression?: boolean;
}

const CTAFooter = ({ onProgressionClick, onCoachingClick, hideProgression = false }: CTAFooterProps) => {
  return (
    <div className={`mt-12 mb-8 grid ${hideProgression ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2 max-w-4xl'} gap-4 mx-auto px-4`}>
      {/* CTA Progression */}
      {!hideProgression && (
        <div className="flex flex-col gap-2 p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">Suivre votre progression</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Accédez à votre historique d'évolution complet et exportez un récapitulatif PDF.
          </p>
          <Button 
            onClick={onProgressionClick}
            className="mt-2 w-full sm:w-auto"
          >
            Accéder à l'historique de mes actions
          </Button>
        </div>
      )}

      {/* CTA Coaching */}
      <div className="flex flex-col gap-2 p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Parler à un humain</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bénéficiez d'un accompagnement personnalisé par un coach professionnel.
        </p>
        <Button 
          onClick={onCoachingClick}
          variant="outline"
          className="mt-2 w-full sm:w-auto"
        >
          Découvrir le coaching
        </Button>
      </div>
    </div>
  );
};

export default CTAFooter;
