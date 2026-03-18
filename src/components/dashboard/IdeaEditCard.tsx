import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, RotateCcw, Plus } from "lucide-react";
import { toast } from "sonner";
import IdeaDocumentsUpload from "./IdeaDocumentsUpload";
import RecalculateModal from "./RecalculateModal";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
// IdeaVisualizer temporarily disabled due to API issues

interface IdeaEditCardProps {
  idea: any;
  onUpdate: () => void;
  onMaturityUpdate: (actionType?: 'idea_updated' | 'document_added') => Promise<void>;
}

const IdeaEditCard = ({ idea, onUpdate, onMaturityUpdate }: IdeaEditCardProps) => {
  const navigate = useNavigate();
  const [showRecalculateModal, setShowRecalculateModal] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border-primary/20">
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-3xl font-display font-bold mb-3">Mon projet</h2>
            {idea.description && (
              <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {idea.description}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {idea.description ? (
                <>💡 Reprenez le questionnaire d'idée en 2 minutes pour affiner encore davantage vos micro-actions et zones d'attention.</>
              ) : (
                <>💡 Renseignez votre idée en 2 minutes pour personnaliser vos micro-actions et zones d'attention.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <ContextualTooltip
              content={idea.description ? "Modifiez les informations de votre projet pour affiner vos micro-actions et zones d'attention personnalisées." : "Renseignez les informations de votre projet pour recevoir des micro-actions et zones d'attention adaptées à votre idée."}
              side="top"
            >
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/onboarding/idea')}
                className={!idea.description ? "" : ""}
              >
                {idea.description ? (
                  <Edit2 className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {idea.description ? 'Modifier mon idée' : 'Renseigner mon idée'}
              </Button>
            </ContextualTooltip>
          </div>

          {idea.description && (
            <IdeaDocumentsUpload 
              ideaId={idea.id} 
              onDocumentAdded={async () => {
                await onMaturityUpdate('document_added');
              }} 
            />
          )}
        </div>
      </Card>

      <RecalculateModal
        open={showRecalculateModal}
        onOpenChange={setShowRecalculateModal}
        onConfirm={() => {
          setShowRecalculateModal(false);
          navigate(`/onboarding?prefill=true&ideaId=${idea.id}`);
        }}
      />
    </>
  );
};

export default IdeaEditCard;
