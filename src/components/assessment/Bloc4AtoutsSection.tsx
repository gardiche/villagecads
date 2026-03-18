import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Search, Palette, Users, TrendingUp, FileText, Upload } from "lucide-react";

interface Props {
  riasecValues: Record<string, number>;
  cvContent: string;
  onRiasecChange: (key: string, value: number) => void;
  onCvChange: (content: string) => void;
}

const riasecTraits = [
  {
    key: "realiste",
    label: "Réaliste",
    description: "Travailler avec ses mains, créer des choses concrètes, bricoler",
    icon: Wrench,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  },
  {
    key: "investigateur",
    label: "Investigateur",
    description: "Analyser, résoudre des problèmes complexes, chercher la vérité",
    icon: Search,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  },
  {
    key: "artistique",
    label: "Artistique",
    description: "Créer, s'exprimer de façon originale, innover",
    icon: Palette,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  },
  {
    key: "social",
    label: "Social",
    description: "Aider, former, accompagner les gens",
    icon: Users,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  },
  {
    key: "entreprenant",
    label: "Entreprenant",
    description: "Convaincre, diriger, prendre des décisions, vendre",
    icon: TrendingUp,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  },
  {
    key: "conventionnel",
    label: "Conventionnel",
    description: "Organiser, suivre des procédures établies, structurer",
    icon: FileText,
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  }
];

export const Bloc4AtoutsSection = ({ 
  riasecValues, 
  cvContent, 
  onRiasecChange, 
  onCvChange 
}: Props) => {
  return (
    <div className="space-y-8">
      {/* Section RIASEC */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Vos appétences professionnelles</h2>
          <p className="text-muted-foreground mt-1">
            Qu'est-ce qui vous attire naturellement dans le travail ?
          </p>
        </div>

        <div className="space-y-4">
          {riasecTraits.map((trait) => {
            const Icon = trait.icon;
            const currentValue = riasecValues[trait.key] || 50;
            
            return (
              <Card key={trait.key} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{trait.label}</Label>
                      <span className="text-sm font-medium text-primary">
                        {trait.getLabel(currentValue)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{trait.description}</p>
                  </div>
                </div>

                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onRiasecChange(trait.key, newValue[0])}
                  min={0}
                  max={100}
                  step={5}
                />
              </Card>
            );
          })}
        </div>
      </div>

      {/* Section CV / Compétences */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Votre parcours professionnel
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Copiez-collez votre CV ou décrivez brièvement votre parcours. Cela permettra à l'IA de mieux comprendre vos compétences.
          </p>
        </div>

        <Textarea
          placeholder="Ex: 10 ans en marketing digital, spécialisé en acquisition B2B. J'ai géré des équipes de 5 personnes et des budgets de 500k€. Compétences clés : SEO, Google Ads, analytics..."
          value={cvContent}
          onChange={(e) => onCvChange(e.target.value)}
          rows={6}
          className="text-base resize-none"
        />
        
        <p className="text-xs text-muted-foreground">
          💡 Ce champ est optionnel mais aide l'IA à personnaliser votre coaching selon vos compétences réelles.
        </p>
      </div>
    </div>
  );
};
