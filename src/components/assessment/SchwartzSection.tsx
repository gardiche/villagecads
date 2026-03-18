import { Slider } from "@/components/ui/slider";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

// Top 5 valeurs les plus discriminantes pour l'entrepreneuriat
const schwartzValues = [
  {
    key: "autonomie",
    label: "Liberté et indépendance",
    description: "Décider par toi-même, agir selon tes propres idées"
  },
  {
    key: "accomplissement",
    label: "Réussir et être reconnu",
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
  }
];

export const SchwartzSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes valeurs essentielles</h2>
        <p className="text-muted-foreground text-lg">
          Indique rapidement l'importance de chaque valeur (juste ton intuition, pas besoin de réfléchir longtemps)
        </p>
      </div>

      <div className="space-y-6">
        {schwartzValues.map((item) => (
          <div key={item.key} className="space-y-3 p-4 rounded-lg border bg-card">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-lg">{item.label}</h3>
                <span className="text-2xl font-bold text-primary">{values[item.key] || 50}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Slider
              value={[values[item.key] || 50]}
              onValueChange={(val) => onChange(item.key, val[0])}
              min={0}
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pas important</span>
              <span>Très important</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
