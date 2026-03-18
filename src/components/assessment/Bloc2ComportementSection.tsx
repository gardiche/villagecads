import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Users, Briefcase, Zap } from "lucide-react";

const scenarios = [
  {
    question: "Quand quelque chose est incertain, vous avez tendance à :",
    options: [
      { key: "A", label: "Attendre d'en savoir plus", trait: "nevrosisme", value: 75 },
      { key: "B", label: "Expérimenter rapidement", trait: "ouverture", value: 75 },
      { key: "C", label: "Vous renseigner à fond", trait: "conscienciosite", value: 75 },
    ],
  },
  {
    question: "Face à un projet nouveau, vous préférez :",
    options: [
      { key: "A", label: "Le planifier en détail", trait: "conscienciosite", value: 75 },
      { key: "B", label: "Vous lancer et ajuster", trait: "ouverture", value: 75 },
      { key: "C", label: "Demander conseil autour de vous", trait: "agreabilite", value: 75 },
    ],
  },
  {
    question: "Quand vous rencontrez des difficultés :",
    options: [
      { key: "A", label: "Vous insistez seul·e", trait: "extraversion", value: 25 },
      { key: "B", label: "Vous en parlez à votre entourage", trait: "extraversion", value: 75 },
      { key: "C", label: "Vous prenez du recul", trait: "nevrosisme", value: 25 },
    ],
  },
  {
    question: "Niveau énergie sociale, vous êtes plutôt :",
    options: [
      { key: "A", label: "Introverti·e, besoin de solitude", trait: "extraversion", value: 25 },
      { key: "B", label: "Entre les deux", trait: "extraversion", value: 50 },
      { key: "C", label: "Extraverti·e, j'aime être entouré·e", trait: "extraversion", value: 75 },
    ],
  },
];

const environnementDimensions = [
  {
    key: "reseau",
    label: "Réseau / Entourage",
    icon: Users,
    levels: ["Isolé·e", "Peu entouré·e", "Modéré", "Bien entouré·e", "Très soutenu·e"],
  },
  {
    key: "contextePro",
    label: "Contexte pro",
    icon: Briefcase,
    levels: ["Frein fort", "Plutôt frein", "Neutre", "Plutôt support", "Support fort"],
  },
  {
    key: "margeManoeuvre",
    label: "Marge de manœuvre",
    icon: Zap,
    levels: ["Très limitée", "Limitée", "Moyenne", "Bonne", "Très flexible"],
  },
];

interface Bloc2ComportementSectionProps {
  scenarioAnswers: Record<number, string>;
  environnement: {
    reseau: number;
    contextePro: number;
    margeManoeuvre: number;
  };
  onScenarioChange: (scenarioIndex: number, optionKey: string) => void;
  onEnvironnementChange: (key: string, value: number) => void;
}

export const Bloc2ComportementSection = ({
  scenarioAnswers,
  environnement,
  onScenarioChange,
  onEnvironnementChange,
}: Bloc2ComportementSectionProps) => {
  const getEnvLabel = (key: string, value: number) => {
    const dim = environnementDimensions.find((d) => d.key === key);
    if (!dim) return "";
    const levels = dim.levels;
    const index = Math.min(Math.floor((value / 100) * levels.length), levels.length - 1);
    return levels[index];
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-display font-bold mb-2">
          Votre manière d'agir
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Répondez spontanément, il n'y a pas de bonne réponse
        </p>

        <div className="space-y-6">
          {scenarios.map((scenario, index) => (
            <Card key={index} className="p-4">
              <p className="font-semibold mb-3">{scenario.question}</p>
              <div className="space-y-2">
                {scenario.options.map((option) => (
                  <Button
                    key={option.key}
                    variant={
                      scenarioAnswers[index] === option.key ? "default" : "outline"
                    }
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => onScenarioChange(index, option.key)}
                  >
                    <span className="font-semibold mr-2">{option.key}.</span>
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
