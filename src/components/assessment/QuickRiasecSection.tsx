import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Card } from "@/components/ui/card";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const riasecTraits = [
  {
    key: "realiste",
    label: "Réaliste",
    description: "Travailler avec ses mains, créer des choses concrètes",
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
    description: "Analyser, résoudre des problèmes complexes",
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
    description: "Créer, s'exprimer de façon originale",
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
    description: "Convaincre, diriger, prendre des décisions",
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
    description: "Organiser, suivre des procédures établies",
    getLabel: (v: number) => {
      if (v < 20) return "Pas du tout";
      if (v < 40) return "Peu intéressé";
      if (v < 60) return "Neutre";
      if (v < 80) return "Intéressé";
      return "Passionné";
    }
  }
];

export const QuickRiasecSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes appétences</h2>
        <p className="text-muted-foreground text-lg">
          Ce qui t'attire professionnellement
        </p>
      </div>

      <div className="space-y-6">
        {riasecTraits.map((trait) => {
          const currentValue = values[trait.key] || 50;
          
          return (
            <Card key={trait.key} className="p-6 space-y-4">
              <div>
                <Label className="text-xl font-semibold">{trait.label}</Label>
                <p className="text-sm text-muted-foreground">{trait.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {trait.getLabel(currentValue)}
                  </span>
                </div>

                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onChange(trait.key, newValue[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
