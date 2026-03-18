import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Card } from "@/components/ui/card";

interface Props {
  values: {
    situationPro: number;
    situationFinanciere: number;
    soutienEntourage: number;
    toleranceRisque: number;
  };
  onChange: (field: string, value: number) => void;
}

const gauges = [
  {
    key: "situationPro",
    label: "Stabilité professionnelle actuelle",
    description: "Ton niveau de sécurité dans ta situation actuelle",
    getLabel: (v: number) => {
      if (v < 13) return "Très instable";
      if (v < 25) return "Instable";
      if (v < 38) return "Plutôt instable";
      if (v < 50) return "Incertain";
      if (v < 63) return "Assez stable";
      if (v < 75) return "Stable";
      if (v < 88) return "Très stable";
      return "Totalement sécurisé";
    }
  },
  {
    key: "situationFinanciere",
    label: "Épargne de sécurité",
    description: "Combien de mois peux-tu tenir sans revenu",
    getLabel: (v: number) => {
      if (v < 13) return "Moins d'1 mois";
      if (v < 25) return "1-2 mois";
      if (v < 38) return "3 mois";
      if (v < 50) return "4-5 mois";
      if (v < 63) return "6 mois";
      if (v < 75) return "9 mois";
      if (v < 88) return "12 mois";
      return "Plus d'un an";
    }
  },
  {
    key: "soutienEntourage",
    label: "Soutien de ton entourage",
    description: "Dans quelle mesure ton entourage soutient ton projet",
    getLabel: (v: number) => {
      if (v < 13) return "Très hostile";
      if (v < 25) return "Réticent";
      if (v < 38) return "Sceptique";
      if (v < 50) return "Neutre";
      if (v < 63) return "Compréhensif";
      if (v < 75) return "Encourageant";
      if (v < 88) return "Très soutenant";
      return "Totalement engagé";
    }
  },
  {
    key: "toleranceRisque",
    label: "Ta tolérance au risque personnel",
    description: "Ton appétence générale pour prendre des risques",
    getLabel: (v: number) => {
      if (v < 13) return "Très faible";
      if (v < 25) return "Faible";
      if (v < 38) return "Plutôt faible";
      if (v < 50) return "Modérée";
      if (v < 63) return "Plutôt élevée";
      if (v < 75) return "Élevée";
      if (v < 88) return "Très élevée";
      return "Maximale";
    }
  }
];

export const ContextSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Ton contexte personnel</h2>
        <p className="text-muted-foreground text-lg">
          4 dimensions clés pour évaluer ta capacité à te lancer
        </p>
      </div>

      <div className="space-y-6">
        {gauges.map((gauge) => {
          const currentValue = values[gauge.key as keyof typeof values] || 50;
          
          return (
            <Card key={gauge.key} className="p-6 space-y-4">
              <div>
                <Label className="text-xl font-semibold">{gauge.label}</Label>
                <p className="text-sm text-muted-foreground">{gauge.description}</p>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">
                    {gauge.getLabel(currentValue)}
                  </span>
                </div>
                
                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onChange(gauge.key, newValue[0])}
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
