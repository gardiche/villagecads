import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, Send, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoachingComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CoachingComingSoonModal = ({ open, onOpenChange }: CoachingComingSoonModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyMentored, setIsAlreadyMentored] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    challenge: "",
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Pré-remplir avec les données utilisateur si disponibles + vérifier si déjà accompagné
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
          prenom: user.user_metadata?.prenom || user.user_metadata?.first_name || "",
          nom: user.user_metadata?.nom || user.user_metadata?.last_name || "",
        }));

        // Vérifier si l'entrepreneur est déjà accompagné (invité via un compte B2B Pro)
        const { data: sharing } = await supabase
          .from("mentor_sharing")
          .select("is_active")
          .eq("entrepreneur_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        setIsAlreadyMentored(!!sharing);
      }
    };
    if (open) {
      loadUserData();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prenom || !formData.nom || !formData.email || !formData.telephone || !formData.challenge) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("send-mentorat-request", {
        body: {
          ...formData,
          userId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erreur lors de l'envoi");
      }

      toast.success("Candidature envoyée avec succès ! Nous vous recontacterons sous 48h.");
      onOpenChange(false);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        telephone: "",
        challenge: "",
      }));
    } catch (error: any) {
      console.error("Erreur envoi candidature:", error);
      toast.error(error.message || "Erreur lors de l'envoi de la candidature");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-muted rounded-lg">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <DialogTitle className="text-xl font-display">
              Mentorat Astryd — plan Premium+
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm pt-2 leading-relaxed">
            {isAlreadyMentored
              ? "Votre espace est déjà partagé avec votre mentor, qui suit vos actions et zones d'attention en temps réel."
              : "Ne restez pas seul face à vos doutes. Un mentor Alpact accède à votre Espace Astryd pour auditer votre profil et débloquer vos nœuds stratégiques."}
          </DialogDescription>
        </DialogHeader>

        {isAlreadyMentored ? (
          <div className="py-6 space-y-5">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-base">Vous êtes déjà accompagné ✓</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre mentor a accès à votre historique d'actions, vos zones d'attention et votre progression. Vous bénéficiez déjà du plan Premium+.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            {/* Prénom & Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Email (read-only si connecté) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                readOnly={!!userId}
                className={userId ? "bg-muted cursor-not-allowed" : ""}
                required
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                required
              />
            </div>

            {/* Challenge actuel */}
            <div className="space-y-2">
              <Label htmlFor="challenge">Votre challenge actuel</Label>
              <Textarea
                id="challenge"
                placeholder="Je bloque sur... / Mon principal défi est..."
                value={formData.challenge}
                onChange={(e) => setFormData(prev => ({ ...prev, challenge: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Info rareté justifiée */}
            <p className="text-xs text-muted-foreground italic text-center">
              Pour garantir un accompagnement de qualité, nous limitons les places à 5 entrepreneurs par mois.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full text-base font-semibold h-14 rounded-xl gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer ma candidature
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Nous reviendrons vers vous sous 48h pour évaluer si le programme vous correspond.
            </p>

            {/* Fermer */}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Plus tard
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoachingComingSoonModal;
