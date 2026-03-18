import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, KeyRound, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GuestCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  expiresAt: string;
}

export const GuestCodeModal = ({
  open,
  onOpenChange,
  code,
  expiresAt
}: GuestCodeModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Code copié ! 📋",
      description: "Le code a été copié dans le presse-papiers",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpiryTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Vos résultats sont sauvegardés !
          </DialogTitle>
          <DialogDescription>
            Notez ce code pour retrouver vos résultats pendant 24h
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Code de récupération */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Code de récupération :</p>
            <div className="flex gap-2">
              <Input
                value={code}
                readOnly
                className="font-mono text-2xl text-center tracking-wider font-bold"
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

          {/* Validité */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Valable jusqu'au {formatExpiryTime(expiresAt)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce code expirera automatiquement après 24 heures
            </p>
          </div>

          {/* Avertissement */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Important</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Notez ce code dans un endroit sûr</li>
                  <li>• Vous pourrez récupérer vos résultats sur /retrieve-results</li>
                  <li>• Pour conserver définitivement vos résultats, créez un compte</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleCopy} variant="outline" className="w-full">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Code copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le code
                </>
              )}
            </Button>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              J'ai noté mon code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};