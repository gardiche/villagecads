import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle } from "lucide-react";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingModal = ({ open, onOpenChange }: PricingModalProps) => {
  const handleOpenChat = (message: string) => {
    onOpenChange(false);
    // Ouvrir le chat avec un délai pour que la modale se ferme
    setTimeout(() => {
      const chatButton = document.querySelector('[class*="fixed bottom-6 right-6"]') as HTMLButtonElement;
      chatButton?.click();
      // TODO: Pré-remplir le message dans le chat si possible
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Plans d'abonnement Astryd
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            Choisissez la formule qui correspond à vos besoins
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {/* Déclic */}
          <Card className="p-4 space-y-4 relative">
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                Actuel
              </Badge>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl">🌙</div>
              <h3 className="text-xl font-bold">Déclic</h3>
              <p className="text-xs text-muted-foreground">Gratuit</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">0€</div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Profil entrepreneurial complet</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Zones d'attention</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Micro-actions adaptées</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Journal entrepreneurial</span>
              </li>
            </ul>

            <Button variant="outline" className="w-full text-sm" disabled>
              Formule actuelle
            </Button>
          </Card>

          {/* Cap */}
          <Card className="p-4 space-y-4 border-2 border-primary relative">
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-white text-xs">
                Populaire
              </Badge>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl">☀️</div>
              <h3 className="text-xl font-bold">Cap</h3>
              <p className="text-xs text-muted-foreground">Premium</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">19€</div>
              <div className="text-xs text-muted-foreground">/mois</div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold">Tout Déclic</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Historique complet</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Export PDF</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Insights IA</span>
              </li>
            </ul>

            <Button 
              className="w-full text-sm gap-2"
              onClick={() => handleOpenChat("Je souhaite obtenir un code d'accès au plan Cap")}
            >
              <MessageCircle className="h-4 w-4" />
              Demander un code
            </Button>
          </Card>

          {/* Élan */}
          <Card className="p-4 space-y-4 relative">
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="text-xs">
                Premium +
              </Badge>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl">🔥</div>
              <h3 className="text-xl font-bold">Élan</h3>
              <p className="text-xs text-muted-foreground">Coaching</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">49€</div>
              <div className="text-xs text-muted-foreground">/mois</div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold">Tout Cap</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Accès coach certifié</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Coaching personnalisé</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Suivi continu</span>
              </li>
            </ul>

            <Button 
              className="w-full text-sm gap-2"
              onClick={() => handleOpenChat("Je souhaite être accompagné par un coach certifié (plan Élan)")}
            >
              <MessageCircle className="h-4 w-4" />
              Parler à un coach
            </Button>
          </Card>
        </div>

        <div className="text-center mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Une question ?{" "}
            <button
              onClick={() => handleOpenChat("J'ai une question sur les formules d'abonnement")}
              className="text-primary hover:underline font-medium"
            >
              Contactez-nous par le chat
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
