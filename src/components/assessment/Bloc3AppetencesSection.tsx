import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Search, Palette, Users, TrendingUp, FileText } from "lucide-react";
import { CVImportSection } from "./CVImportSection";

const riasecItems = [
  { key: "R", label: "Réaliste", description: "Pratique, manuel, technique", icon: Wrench },
  { key: "I", label: "Investigateur", description: "Analyser, chercher, comprendre", icon: Search },
  { key: "A", label: "Artistique", description: "Créer, innover, imaginer", icon: Palette },
  { key: "S", label: "Social", description: "Aider, enseigner, accompagner", icon: Users },
  { key: "E", label: "Entreprenant", description: "Convaincre, diriger, vendre", icon: TrendingUp },
  { key: "C", label: "Conventionnel", description: "Organiser, structurer, gérer", icon: FileText },
];

interface Bloc3AppetencesSectionProps {
  riasecRanking: string[];
  cvContent: string;
  onRiasecChange: (ranking: string[]) => void;
  onCvChange: (content: string) => void;
}

export const Bloc3AppetencesSection = ({
  riasecRanking,
  cvContent,
  onRiasecChange,
  onCvChange,
}: Bloc3AppetencesSectionProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (key: string) => {
    setDraggedItem(key);
  };

  const handleDrop = (targetKey: string) => {
    if (!draggedItem) return;
    
    const newRanking = [...riasecRanking];
    const draggedIndex = newRanking.indexOf(draggedItem);
    const targetIndex = newRanking.indexOf(targetKey);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      [newRanking[draggedIndex], newRanking[targetIndex]] = [newRanking[targetIndex], newRanking[draggedIndex]];
      onRiasecChange(newRanking);
    }
    
    setDraggedItem(null);
  };

  const toggleRiasecSelection = (key: string) => {
    if (riasecRanking.includes(key)) {
      onRiasecChange(riasecRanking.filter((k) => k !== key));
    } else {
      // Limit to 3 selections maximum
      if (riasecRanking.length >= 3) {
        return;
      }
      onRiasecChange([...riasecRanking, key]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-display font-bold mb-2">
          Ce que vous aimez faire
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Sélectionnez <strong>3 domaines maximum</strong> qui vous parlent le plus
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riasecItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = riasecRanking.includes(item.key);
            const rank = riasecRanking.indexOf(item.key);
            
            return (
              <Card
                key={item.key}
                draggable={isSelected}
                onDragStart={() => handleDragStart(item.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(item.key)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md relative ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                } ${draggedItem === item.key ? "opacity-50" : ""}`}
                onClick={() => toggleRiasecSelection(item.key)}
              >
                {isSelected && (
                  <Badge
                    variant="default"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                  >
                    {rank + 1}
                  </Badge>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {riasecRanking.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            💡 Cliquez sur les cartes pour changer l'ordre de priorité de vos 3 domaines sélectionnés
          </p>
        )}
      </div>

      
      <CVImportSection
        value={cvContent}
        onChange={onCvChange}
      />
    </div>
  );
};
