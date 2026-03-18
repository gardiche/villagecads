import { Slider } from "@/components/ui/slider";
import { Heart, Users, Home, Coffee, Dumbbell, Briefcase } from "lucide-react";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const getLifeSphereDynamicLabel = (key: string, value: number): string => {
  // Labels dynamiques pour Énergie (soi), Temps (pro), Finances
  if (key === "soi") {
    // Énergie personnelle
    if (value <= 30) return "Épuisé";
    if (value <= 70) return "En forme";
    return "Au taquet";
  }
  if (key === "pro") {
    // Temps disponible
    if (value <= 30) return "Surchargé";
    if (value <= 70) return "Partiel";
    return "Full Time";
  }
  return "";
};

const lifeSpheres = [
  {
    key: "soi",
    label: "Toi avec toi-même",
    description: "Temps pour toi, bien-être personnel, introspection",
    icon: Heart,
    color: "text-primary"
  },
  {
    key: "couple",
    label: "Ton couple",
    description: "Relation amoureuse, temps à deux, complicité",
    icon: Users,
    color: "text-accent"
  },
  {
    key: "famille",
    label: "Ta famille",
    description: "Parents, enfants, fratrie, liens familiaux",
    icon: Home,
    color: "text-blue-500"
  },
  {
    key: "amis",
    label: "Tes amis",
    description: "Cercle social, sorties, moments partagés",
    icon: Coffee,
    color: "text-yellow-500"
  },
  {
    key: "loisirs",
    label: "Tes loisirs",
    description: "Sport, hobbies, passions personnelles",
    icon: Dumbbell,
    color: "text-green-500"
  },
  {
    key: "pro",
    label: "Ton travail",
    description: "Carrière, projets professionnels, ambitions",
    icon: Briefcase,
    color: "text-orange-500"
  }
];

export const LifeSpheresSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">L'équilibre de ta vie aujourd'hui</h2>
        <p className="text-muted-foreground text-lg">
          Comment te sens-tu dans chacune de ces sphères ? (0 = très insatisfait, 100 = pleinement épanoui)
        </p>
      </div>

      <div className="space-y-6">
        {lifeSpheres.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="space-y-3 p-4 rounded-lg border bg-card">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{item.label}</h3>
                      <span className="text-2xl font-bold text-primary">{values[item.key] || 50}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
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
                <span>Insatisfait</span>
                <span>Épanoui</span>
              </div>
              {/* Label dynamique pour Énergie, Temps */}
              {(item.key === "soi" || item.key === "pro") && (
                <div className="text-center mt-1">
                  <span className="text-sm font-semibold text-primary">
                    {getLifeSphereDynamicLabel(item.key, values[item.key] || 50)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
