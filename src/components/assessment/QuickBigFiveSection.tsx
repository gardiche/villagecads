import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Card } from "@/components/ui/card";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const bigFiveTraits = [
  {
    key: "ouverture",
    label: "Ouverture à l'expérience",
    description: "Curiosité, imagination, créativité",
    getLabel: (v: number) => {
      if (v < 20) return "Conventionnel";
      if (v < 40) return "Pragmatique";
      if (v < 60) return "Équilibré";
      if (v < 80) return "Curieux";
      return "Très créatif";
    }
  },
  {
    key: "conscienciosite",
    label: "Conscienciosité",
    description: "Organisation, rigueur, discipline",
    getLabel: (v: number) => {
      if (v < 20) return "Spontané";
      if (v < 40) return "Flexible";
      if (v < 60) return "Équilibré";
      if (v < 80) return "Organisé";
      return "Très rigoureux";
    }
  },
  {
    key: "extraversion",
    label: "Extraversion",
    description: "Sociabilité, énergie, enthousiasme",
    getLabel: (v: number) => {
      if (v < 20) return "Réservé";
      if (v < 40) return "Introverti";
      if (v < 60) return "Équilibré";
      if (v < 80) return "Sociable";
      return "Très extraverti";
    }
  },
  {
    key: "agreabilite",
    label: "Agréabilité",
    description: "Coopération, empathie, bienveillance",
    getLabel: (v: number) => {
      if (v < 20) return "Direct";
      if (v < 40) return "Pragmatique";
      if (v < 60) return "Équilibré";
      if (v < 80) return "Coopératif";
      return "Très empathique";
    }
  },
  {
    key: "nevrosisme",
    label: "Stabilité émotionnelle",
    description: "Gestion du stress et des émotions",
    getLabel: (v: number) => {
      if (v < 20) return "Sensible";
      if (v < 40) return "Variable";
      if (v < 60) return "Équilibré";
      if (v < 80) return "Stable";
      return "Très serein";
    }
  }
];

export const QuickBigFiveSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Ton tempérament</h2>
        <p className="text-muted-foreground text-lg">
          Positionne-toi sur ces 5 traits de personnalité
        </p>
      </div>

      <div className="space-y-6">
        {bigFiveTraits.map((trait) => {
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
