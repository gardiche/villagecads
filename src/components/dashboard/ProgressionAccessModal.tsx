import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProgressionAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccessGranted?: () => void;
}

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/dRm28t8dM3hr32BbU00gw00";

const ProgressionAccessModal = ({ open, onOpenChange, onAccessGranted }: ProgressionAccessModalProps) => {
  const [accessCode, setAccessCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const handleStripeCheckout = () => {
    window.open(STRIPE_CHECKOUT_URL, '_blank');
  };

  const handleCheckCode = async () => {
    setIsChecking(true);
    
    try {
      // Vérifier le code dans la base de données
      const { data: codeData, error: codeError } = await supabase
        .from('beta_access_codes')
        .select('*')
        .eq('code', accessCode)
        .eq('revoked', false)
        .maybeSingle();

      if (codeError) throw codeError;

      if (!codeData) {
        toast.error("Code incorrect. Veuillez réessayer.");
        setIsChecking(false);
        setAccessCode("");
        return;
      }

      // Vérifier si le code est épuisé
      if (codeData.used_count >= codeData.max_uses) {
        toast.error("Ce code a atteint sa limite d'utilisation.");
        setIsChecking(false);
        setAccessCode("");
        return;
      }

      // Vérifier si le code est expiré
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("Ce code a expiré.");
        setIsChecking(false);
        setAccessCode("");
        return;
      }

      // Code valide - sauvegarder dans localStorage pour accès immédiat
      localStorage.setItem("astryd_progression_access", "granted");
      
      // Mettre à jour la base de données pour persistance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Incrémenter le compteur d'utilisation du code
        await supabase
          .from('beta_access_codes')
          .update({ used_count: codeData.used_count + 1 })
          .eq('id', codeData.id);

        // Logger l'utilisation du code
        await supabase
          .from('beta_code_usage')
          .insert({
            code_id: codeData.id,
            user_id: user.id,
            user_email: user.email,
          });

        // Mettre à jour l'abonnement utilisateur
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            plan: 'cap',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
          }, {
            onConflict: 'user_id'
          });
        
        if (error) {
          console.error('Error updating subscription:', error);
        }
      }
      
      toast.success("Code valide ! Accès Premium Cap débloqué.");
      onAccessGranted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error validating code:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsChecking(false);
      setAccessCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl font-display">
              Passez le Cap
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm pt-2 leading-relaxed">
            L'entrepreneuriat demande de la régularité. Offrez-vous le miroir dont vous avez besoin pour avancer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Avantages */}
          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg flex-shrink-0">📊</span>
              <p><span className="font-medium">Historique illimité</span> de votre évolution</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg flex-shrink-0">🤖</span>
              <p><span className="font-medium">Insights IA</span> sur votre progression</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-lg flex-shrink-0">📄</span>
              <p><span className="font-medium">Export PDF</span> à partager</p>
            </div>
          </div>

          {/* CTA Principal - Stripe */}
          <Button 
            size="lg"
            className="w-full text-base font-semibold h-14 rounded-xl bg-gradient-to-r from-primary via-primary-glow to-accent hover:opacity-90 shadow-md gap-2"
            onClick={handleStripeCheckout}
          >
            <ExternalLink className="h-4 w-4" />
            Activer mon espace (19€/mois)
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Sans engagement. Vos données vous appartiennent.
          </p>

          {/* Code partenaire - Accordéon discret */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCodeInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              J'ai un code partenaire
            </button>
            
            {showCodeInput && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <Input
                  type="text"
                  placeholder="Entrez votre code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && accessCode.trim()) {
                      handleCheckCode();
                    }
                  }}
                />
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleCheckCode}
                  disabled={!accessCode.trim() || isChecking}
                >
                  {isChecking ? "Vérification..." : "Valider le code"}
                </Button>
              </div>
            )}
          </div>

          {/* Fermer */}
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressionAccessModal;