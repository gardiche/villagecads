import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

interface LoginGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "micro-action" | "journal" | "idea-questionnaire" | "share-profile" | "historique" | "coaching";
}

const actionMessages = {
  "micro-action": "Pour valider vos micro-actions et suivre votre progression dans le temps",
  "journal": "Pour échanger avec votre coach IA et enrichir votre journal entrepreneurial",
  "idea-questionnaire": "Pour renseigner votre idée et recevoir des recommandations personnalisées",
  "share-profile": "Pour générer et partager votre page de profil entrepreneurial",
  "historique": "Pour accéder à l'historique complet de votre progression entrepreneuriale",
  "coaching": "Pour découvrir notre offre de mentorat hybride avec un coach certifié",
};

export const LoginGateModal = ({ open, onOpenChange, action }: LoginGateModalProps) => {
  const navigate = useNavigate();

  const handleGoToAuth = () => {
    // Sauvegarder l'intention ET le chemin actuel pour rediriger après login
    localStorage.setItem('astryd_return_action', action);
    localStorage.setItem('astryd_return_path', window.location.pathname + window.location.search);
    navigate('/auth?tab=signup');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Créez votre compte pour continuer
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {actionMessages[action]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            En créant votre compte, vous pourrez :
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>✓ Sauvegarder vos résultats et suivre votre progression</li>
            <li>✓ Interagir avec votre coach IA personnalisé</li>
            <li>✓ Suivre vos micro-actions dans la durée</li>
            <li>✓ Générer une page de partage de votre profil</li>
          </ul>
          
          <p className="text-xs text-muted-foreground pt-4">
            En continuant, vous acceptez nos{" "}
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              conditions d'utilisation
            </a>.
          </p>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleGoToAuth} className="w-full">
              Créer mon compte gratuitement
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
