import { Slider } from "@/components/ui/slider";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const bigFiveTraits = [
  {
    key: "ouverture",
    label: "Curiosité et imagination",
    description: "J'aime découvrir de nouvelles idées, je suis créatif·ve et curieux·se"
  },
  {
    key: "conscienciosite",
    label: "Organisation et rigueur",
    description: "Je suis organisé·e, méthodique, je vais au bout de mes projets"
  },
  {
    key: "extraversion",
    label: "Énergie sociale",
    description: "J'aime être entouré·e, je suis à l'aise en groupe, j'ai besoin d'interactions"
  },
  {
    key: "agreabilite",
    label: "Empathie et coopération",
    description: "Je suis attentif·ve aux autres, j'évite les conflits, je préfère la collaboration"
  },
  {
    key: "nevrosisme",
    label: "Stabilité émotionnelle",
    description: "Je gère facilement le stress, je reste calme face aux difficultés"
  }
];

export const BigFiveSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Ton tempérament naturel</h2>
        <p className="text-muted-foreground text-lg">
          Comment tu te comportes naturellement au quotidien (0 = pas du tout moi, 100 = tout à fait moi)
        </p>
      </div>

      <div className="space-y-6">
        {bigFiveTraits.map((item) => (
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
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pas du tout</span>
              <span>Tout à fait</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
