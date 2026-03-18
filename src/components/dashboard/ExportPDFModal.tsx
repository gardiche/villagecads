import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileText, Target, AlertTriangle, CheckCircle, MessageSquare, TrendingUp } from "lucide-react";

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedSections: string[]) => Promise<void>;
  isExporting: boolean;
}

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const EXPORT_SECTIONS: ExportSection[] = [
  {
    id: "profile",
    label: "Profil entrepreneurial",
    description: "Forces, freins à lever, cap 2-4 semaines",
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: "progression",
    label: "Parcours & Progression",
    description: "Score de maturité, évolution dans le temps",
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    id: "attention_zones",
    label: "Zones d'attention",
    description: "Points de vigilance et recommandations",
    icon: <AlertTriangle className="w-4 h-4" />
  },
  {
    id: "micro_actions",
    label: "Micro-actions",
    description: "Actions complétées et en cours",
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    id: "journal",
    label: "Journal de progression",
    description: "Dernières entrées et échanges avec le coach",
    icon: <MessageSquare className="w-4 h-4" />
  },
  {
    id: "insights",
    label: "Insights IA & Prochaines étapes",
    description: "Récap global et recommandations personnalisées",
    icon: <Target className="w-4 h-4" />
  }
];

export const ExportPDFModal = ({ isOpen, onClose, onExport, isExporting }: ExportPDFModalProps) => {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    EXPORT_SECTIONS.map(s => s.id) // Toutes sélectionnées par défaut
  );

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const handleSelectAll = () => {
    setSelectedSections(EXPORT_SECTIONS.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSections([]);
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      return;
    }
    await onExport(selectedSections);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Exporter en PDF
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choisissez les sections à inclure dans votre export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Actions rapides */}
          <div className="flex gap-2 justify-end text-xs sm:text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 px-2 sm:px-3"
            >
              Tout
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="h-8 px-2 sm:px-3"
            >
              Rien
            </Button>
          </div>

          {/* Liste des sections */}
          <div className="space-y-2 border border-border rounded-lg p-2 sm:p-3 max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
            {EXPORT_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleToggleSection(section.id)}
              >
                <Checkbox
                  id={section.id}
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={() => handleToggleSection(section.id)}
                  className="mt-0.5 sm:mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={section.id}
                    className="flex items-center gap-1.5 sm:gap-2 font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <span className="shrink-0">{section.icon}</span>
                    <span className="truncate">{section.label}</span>
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Compteur de sections */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            {selectedSections.length} section{selectedSections.length > 1 ? 's' : ''} sélectionnée{selectedSections.length > 1 ? 's' : ''}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedSections.length === 0}
            className="gap-2 w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter ({selectedSections.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
