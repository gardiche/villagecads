import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

// 10 valeurs Schwartz ultra-vulgarisées
const schwartzItems = [
  { key: "autonomie", label: "Liberté et indépendance", description: "Décider par moi-même" },
  { key: "accomplissement", label: "Réussite et reconnaissance", description: "Atteindre des objectifs ambitieux" },
  { key: "stimulation", label: "Nouveauté et défis", description: "Vivre des expériences excitantes" },
  { key: "bienveillance", label: "Aider les autres", description: "Avoir un impact positif" },
  { key: "securite", label: "Stabilité", description: "Avoir un cadre sécurisant" },
  { key: "pouvoir", label: "Influence", description: "Diriger, avoir de l'autorité" },
  { key: "hedonisme", label: "Plaisir", description: "Profiter de la vie" },
  { key: "universalisme", label: "Justice et bien commun", description: "Contribuer à un monde meilleur" },
  { key: "tradition", label: "Respect des traditions", description: "Honorer les coutumes" },
  { key: "conformite", label: "Respect des règles", description: "Suivre les normes sociales" },
];

const likertOptions = [
  { value: 1, label: "Pas du tout" },
  { value: 2, label: "Peu" },
  { value: 3, label: "Moyen" },
  { value: 4, label: "Important" },
  { value: 5, label: "Essentiel" },
];

export const QuickSchwartzSection = ({ values, onChange }: Props) => {
  const handleItemChange = (key: string, value: number) => {
    console.log('QuickSchwartz click:', key, value);
    // Stocker la valeur brute 1-5
    onChange(`${key}_raw`, value);
    // Convertir 1-5 en 0-100 pour le trait
    const score = Math.round(((value - 1) / 4) * 100);
    onChange(key, score);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes valeurs</h2>
        <p className="text-muted-foreground text-lg">
          10 questions sur ce qui compte vraiment pour toi
        </p>
      </div>

      <div className="space-y-4">
        {schwartzItems.map((item, index) => (
          <div key={item.key} className="space-y-2 p-4 rounded-lg border bg-card">
            <div>
              <Label className="text-base font-semibold">
                {index + 1}. {item.label}
              </Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {likertOptions.map((option) => {
                const rawValue = values[`${item.key}_raw`];
                const isSelected = rawValue === option.value;
                
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleItemChange(item.key, option.value);
                    }}
                    className="h-auto py-3 px-2 text-xs flex flex-col items-center"
                  >
                    <span className="font-bold text-lg">{option.value}</span>
                    <span className="hidden sm:block">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
