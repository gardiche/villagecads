import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Card } from "@/components/ui/card";
import { Heart, Users, Home, Coffee, Dumbbell, Briefcase } from "lucide-react";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const lifeSpheres = [
  {
    key: "soi",
    label: "Toi-même",
    icon: Heart,
    description: "Santé, énergie, temps pour toi",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  },
  {
    key: "couple",
    label: "Couple",
    icon: Users,
    description: "Relation amoureuse, épanouissement",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  },
  {
    key: "famille",
    label: "Famille",
    icon: Home,
    description: "Relations familiales, harmonie",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  },
  {
    key: "amis",
    label: "Amis",
    icon: Coffee,
    description: "Vie sociale, amitiés solides",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  },
  {
    key: "loisirs",
    label: "Loisirs",
    icon: Dumbbell,
    description: "Activités passionnantes, temps libre",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  },
  {
    key: "pro",
    label: "Professionnel",
    icon: Briefcase,
    description: "Travail, satisfaction, épanouissement",
    getLabel: (v: number) => {
      if (v < 20) return "En difficulté";
      if (v < 40) return "Fragile";
      if (v < 60) return "Correct";
      if (v < 80) return "Bien";
      return "Excellent";
    }
  }
];

export const QuickLifeSpheresSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes sphères de vie</h2>
        <p className="text-muted-foreground text-lg">
          Ton équilibre actuel sur ces 6 dimensions
        </p>
      </div>

      <div className="space-y-6">
        {lifeSpheres.map((sphere) => {
          const Icon = sphere.icon;
          const currentValue = values[sphere.key] || 50;
          
          return (
            <Card key={sphere.key} className="p-6 space-y-4">
              <div>
                <Label className="text-xl font-semibold flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {sphere.label}
                </Label>
                <p className="text-sm text-muted-foreground">{sphere.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {sphere.getLabel(currentValue)}
                  </span>
                </div>

                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onChange(sphere.key, newValue[0])}
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
