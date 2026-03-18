import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface RecalculateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const RecalculateModal = ({ open, onOpenChange, onConfirm }: RecalculateModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <AlertDialogTitle className="text-xl">Recalculer ton alignement ?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3 pt-2">
            <p>
              Pour recalculer ton <strong>score d'alignement</strong>, tu vas être redirigé vers le questionnaire complet.
            </p>
            <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-2">⚠️ Attention :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Toutes tes réponses actuelles seront écrasées</li>
                <li>• Ton score d'alignement sera recalculé</li>
                <li>• Ton historique de progression sera préservé</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Note : Ton <strong>score de maturité</strong> (jauge "vers le feu vert") ne sera pas affecté et continuera d'évoluer avec tes actions.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary">
            Reprendre le questionnaire
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RecalculateModal;
