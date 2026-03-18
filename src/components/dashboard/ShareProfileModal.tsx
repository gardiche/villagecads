import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Share2, Copy, Check, ExternalLink } from "lucide-react";

interface ShareProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personaTitre: string;
  personaSynthese: string;
  personaVisualUrl: string | null;
  forces: string[];
  verrous: string[];
}

export const ShareProfileModal = ({
  open,
  onOpenChange,
  personaTitre,
  personaSynthese,
  personaVisualUrl,
  forces,
  verrous
}: ShareProfileModalProps) => {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerateShare = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-profile-share', {
        body: {
          personaTitre,
          personaSynthese,
          personaVisualUrl,
          forces,
          verrous
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Erreur lors de la génération du lien");
      }

      const url = `${window.location.origin}/share/${data.shareCode}`;
      setShareUrl(url);

      toast({
        title: "Lien de partage créé ! 🎉",
        description: "Vous pouvez maintenant partager votre profil",
      });
    } catch (err: any) {
      console.error('Error generating share link:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer le lien de partage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copié ! 📋",
        description: "Le lien a été copié dans le presse-papiers",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Partager votre profil entrepreneurial
          </DialogTitle>
          <DialogDescription>
            Créez un lien public pour partager votre profil avec d'autres personnes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!shareUrl ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Ce qui sera partagé :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Votre profil entrepreneurial ({personaTitre})</li>
                  <li>✓ Vos forces et freins à lever</li>
                  <li>✓ Votre synthèse personnalisée</li>
                </ul>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Note :</strong> Les détails de votre idée et vos micro-actions ne seront pas partagés, uniquement votre profil entrepreneurial.
                </p>
              </div>

              <Button 
                onClick={handleGenerateShare} 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération du lien...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Générer le lien de partage
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm font-medium">Votre lien de partage :</p>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(shareUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir la page
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1"
                >
                  Terminé
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};