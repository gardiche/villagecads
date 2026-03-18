import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

interface ConfirmRecalculateMaturityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  ideaId: string;
  currentMaturityScore: number;
  currentBaseScore: number;
  currentProgressionBonus: number;
}

export default function ConfirmRecalculateMaturityModal({
  open,
  onOpenChange,
  onConfirm,
  ideaId,
  currentMaturityScore,
  currentBaseScore,
  currentProgressionBonus,
}: ConfirmRecalculateMaturityModalProps) {
  const [loading, setLoading] = useState(true);
  const [newBaseScore, setNewBaseScore] = useState(0);
  const [calculatedBonus, setCalculatedBonus] = useState(0);
  const [newMaturityScore, setNewMaturityScore] = useState(0);

  useEffect(() => {
    if (open && ideaId) {
      loadExpectedValues();
    }
  }, [open, ideaId]);

  const loadExpectedValues = async () => {
    setLoading(true);
    try {
      // Get latest alignment score (which should be the base)
      const { data: latestAlignment } = await supabase
        .from('alignment_scores')
        .select('score_global')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const expectedBase = latestAlignment?.score_global || currentBaseScore;

      // Calculate progression bonus
      const [microActionsRes, journalRes] = await Promise.all([
        supabase
          .from('micro_commitments')
          .select('id', { count: 'exact' })
          .eq('idea_id', ideaId)
          .eq('status', 'done'),
        
        supabase
          .from('journal_entries')
          .select('id', { count: 'exact' })
          .eq('idea_id', ideaId)
          .eq('sender', 'user')
      ]);

      const completedActions = microActionsRes.count || 0;
      const journalMessages = journalRes.count || 0;

      const expectedBonus = Math.min(30, (completedActions * 2) + (journalMessages * 0.5));
      const expectedTotal = Math.min(100, expectedBase + expectedBonus);

      setNewBaseScore(expectedBase);
      setCalculatedBonus(Math.round(expectedBonus));
      setNewMaturityScore(Math.round(expectedTotal));
    } catch (error) {
      console.error('Error loading expected values:', error);
      setNewBaseScore(currentBaseScore);
      setCalculatedBonus(currentProgressionBonus);
      setNewMaturityScore(currentMaturityScore);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = 
    newBaseScore !== currentBaseScore || 
    calculatedBonus !== currentProgressionBonus ||
    newMaturityScore !== currentMaturityScore;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Recalculer le score de maturité</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Calcul des nouvelles valeurs...</span>
              </div>
            ) : (
              <>
                <p className="text-foreground">
                  Cette action va resynchroniser ton score de maturité avec les dernières données.
                </p>
                
                {hasChanges ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm text-foreground">Comparaison des scores :</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Score d'alignement initial</span>
                          <div className="flex items-center gap-2">
                            <span className={currentBaseScore !== newBaseScore ? "line-through opacity-50" : ""}>
                              {currentBaseScore}/100
                            </span>
                            {currentBaseScore !== newBaseScore && (
                              <>
                                <ArrowRight className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">{newBaseScore}/100</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bonus de progression</span>
                          <div className="flex items-center gap-2">
                            <span className={calculatedBonus !== currentProgressionBonus ? "line-through opacity-50" : ""}>
                              +{currentProgressionBonus}
                            </span>
                            {calculatedBonus !== currentProgressionBonus && (
                              <>
                                <ArrowRight className="h-4 w-4 text-success" />
                                <span className="font-semibold text-success">+{calculatedBonus}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="h-px bg-border my-2"></div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">Score de maturité total</span>
                          <div className="flex items-center gap-2">
                            <span className={newMaturityScore !== currentMaturityScore ? "line-through opacity-50" : ""}>
                              {currentMaturityScore}/100
                            </span>
                            {newMaturityScore !== currentMaturityScore && (
                              <>
                                <ArrowRight className="h-4 w-4 text-primary" />
                                <span className="font-bold text-lg text-primary">{newMaturityScore}/100</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                      <p className="text-sm text-foreground">
                        {newMaturityScore > currentMaturityScore ? (
                          <>✨ Ton score va augmenter de <strong>+{newMaturityScore - currentMaturityScore} points</strong> !</>
                        ) : newMaturityScore < currentMaturityScore ? (
                          <>⚠️ Ton score va diminuer de <strong>{currentMaturityScore - newMaturityScore} points</strong></>
                        ) : (
                          <>✓ Aucun changement dans le score total</>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      ✓ Ton score est déjà à jour ! Aucune modification ne sera apportée.
                    </p>
                  </div>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {hasChanges ? 'Confirmer le recalcul' : 'Fermer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
