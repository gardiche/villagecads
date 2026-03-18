import { Card } from "@/components/ui/card";
import { GamifiedSlider } from "@/components/ui/gamified-slider";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const schwartzValues = [
  {
    key: "autonomie",
    label: "Liberté et indépendance",
    description: "Décider par toi-même, agir selon tes propres idées"
  },
  {
    key: "accomplissement",
    label: "Réussite et reconnaissance",
    description: "Atteindre des objectifs ambitieux, être admiré pour tes succès"
  },
  {
    key: "stimulation",
    label: "Nouveauté et aventure",
    description: "Vivre des expériences nouvelles, relever des défis"
  },
  {
    key: "bienveillance",
    label: "Aider les autres",
    description: "Avoir un impact positif, prendre soin de ta communauté"
  },
  {
    key: "securite",
    label: "Sécurité et stabilité",
    description: "Avoir un cadre stable, éviter les risques"
  },
  {
    key: "pouvoir",
    label: "Influence et autorité",
    description: "Diriger, avoir un impact sur les décisions importantes"
  },
  {
    key: "hedonisme",
    label: "Plaisir et profiter de la vie",
    description: "Savourer les moments, se faire plaisir"
  },
  {
    key: "universalisme",
    label: "Justice et bien commun",
    description: "Contribuer à un monde meilleur pour tous"
  },
  {
    key: "tradition",
    label: "Respect des traditions",
    description: "Honorer les coutumes et valeurs transmises"
  },
  {
    key: "conformite",
    label: "Respect des règles",
    description: "Suivre les normes et ne pas déranger l'ordre établi"
  }
];

const getImportanceLabel = (value: number): string => {
  if (value === 0) return "Pas du tout important";
  if (value <= 20) return "Peu important";
  if (value <= 40) return "Moyennement important";
  if (value <= 60) return "Important";
  if (value <= 80) return "Très important";
  return "Extrêmement important";
};

export const SchwartzSlidersSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes valeurs essentielles</h2>
        <p className="text-muted-foreground text-lg">
          Utilise les jauges pour indiquer l'importance de chaque valeur pour toi
        </p>
      </div>

      <div className="space-y-6">
        {schwartzValues.map((item) => {
          const currentValue = values[item.key] || 50;
          
          return (
            <Card key={item.key} className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {getImportanceLabel(currentValue)}
                  </span>
                </div>

                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onChange(item.key, newValue[0])}
                  min={0}
                  max={100}
                  step={1}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pas du tout important</span>
                  <span>Extrêmement important</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
