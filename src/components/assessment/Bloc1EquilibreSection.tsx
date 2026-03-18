import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Battery, Clock, Users, DollarSign, Smile } from "lucide-react";

const ressourcesLabels: Record<string, { label: string; icon: any; levels: string[] }> = {
  energie: {
    label: "Énergie",
    icon: Battery,
    levels: ["Épuisé", "Fatigué", "Moyen", "Énergique", "Débordant"],
  },
  sante: {
    label: "Santé",
    icon: Heart,
    levels: ["Fragile", "Faible", "Correcte", "Bonne", "Excellente"],
  },
  temps: {
    label: "Temps allouable au projet (heures/semaine)",
    icon: Clock,
    levels: ["Aucun", "Peu", "Modéré", "Bon", "Très disponible"],
  },
  finances: {
    label: "Finances personnelles",
    icon: DollarSign,
    levels: ["Précaires", "Tendues", "Stables", "Confortables", "Sereines"],
  },
};

const spheresLabels: Record<string, { label: string; icon: any; levels: string[] }> = {
  soutien: {
    label: "Activités personnelles",
    icon: Smile,
    levels: ["Inexistantes", "Rares", "Occasionnelles", "Régulières", "Abondantes"],
  },
  famille: {
    label: "Équilibre Familial",
    icon: Users,
    levels: ["Surchargé", "Très chargé", "Chargé", "Gérable", "Léger"],
  },
  couple: {
    label: "Vie de couple",
    icon: Heart,
    levels: ["Difficile", "Tendue", "Correcte", "Épanouie", "Très épanouie"],
  },
  loisirs: {
    label: "Projets Perso / Side Business",
    icon: Smile,
    levels: ["Inexistants", "Rares", "Occasionnels", "Réguliers", "Abondants"],
  },
  reseau: {
    label: "Soutien social",
    icon: Users,
    levels: ["Isolé", "Peu soutenu", "Modéré", "Bien entouré", "Très soutenu"],
  },
  pro: {
    label: "Satisfaction Pro Actuelle",
    icon: Users,
    levels: ["Toxique", "Difficile", "Correcte", "Satisfaisante", "Épanouissante"],
  },
};

const valeursPrioritaires = [
  { key: "securite", label: "Sécurité / Stabilité" },
  { key: "autonomie", label: "Autonomie / Créativité" },
  { key: "bienveillance", label: "Bienveillance / Contribution" },
  { key: "ambition", label: "Ambition / Réussite" },
];

interface Bloc1EquilibreSectionProps {
  values: {
    energie: number;
    sante: number;
    temps: number;
    finances: number;
    soutien: number;
    famille: number;
    couple: number;
    loisirs: number;
    reseau: number;
    pro: number;
  };
  motivations: string[];
  isCelibataire: boolean;
  onChange: (key: string, value: number) => void;
  onMotivationsChange: (motivations: string[]) => void;
  onCelibataireChange: (value: boolean) => void;
}

export const Bloc1EquilibreSection = ({
  values,
  motivations,
  isCelibataire,
  onChange,
  onMotivationsChange,
  onCelibataireChange,
}: Bloc1EquilibreSectionProps) => {
  const getLabel = (key: string, value: number, isRessource: boolean = false) => {
    const labels = isRessource ? ressourcesLabels : spheresLabels;
    const levels = labels[key]?.levels;
    if (!levels) return "";
    const index = Math.min(Math.floor((value / 100) * levels.length), levels.length - 1);
    return levels[index];
  };

  const toggleMotivation = (key: string) => {
    if (motivations.includes(key)) {
      onMotivationsChange(motivations.filter((m) => m !== key));
    } else if (motivations.length < 2) {
      onMotivationsChange([...motivations, key]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Ressources */}
      <div>
        <h3 className="text-xl font-display font-bold mb-2">
          Vos ressources
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Positionnez le curseur pour indiquer votre niveau actuel
        </p>

        <div className="space-y-6">
          {Object.keys(ressourcesLabels).map((key) => {
            const { label, icon: Icon } = ressourcesLabels[key];
            const currentValue = values[key as keyof typeof values];
            
            // Label dynamique spécifique pour Finances (sans montant pour éviter biais)
            const getFinancesLabel = (value: number): string => {
              if (value <= 30) return "Tendu";
              if (value <= 70) return "Stable";
              return "Confortable";
            };
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <Label className="font-semibold">{label}</Label>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {key === "finances" ? getFinancesLabel(currentValue) : getLabel(key, currentValue, true)}
                  </span>
                </div>
                <GamifiedSlider
                  value={[currentValue]}
                  onValueChange={(newValue) => onChange(key, newValue[0])}
                  min={0}
                  max={100}
                  step={1}
                />
                {/* Labels guides sous les sliders */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{ressourcesLabels[key].levels[0]}</span>
                  <span>{ressourcesLabels[key].levels[ressourcesLabels[key].levels.length - 1]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section Sphères de vie */}
      <div>
        <h3 className="text-xl font-display font-bold mb-2">
          Vos sphères de vie
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Positionnez le curseur pour indiquer votre niveau actuel dans chaque domaine
        </p>

        <div className="space-y-6">
          {Object.keys(spheresLabels).map((key) => {
            const { label, icon: Icon } = spheresLabels[key];
            const currentValue = values[key as keyof typeof values];
            const isCoupleSlider = key === "couple";
            const isDisabled = isCoupleSlider && isCelibataire;
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <Label className={`font-semibold ${isDisabled ? 'text-muted-foreground' : ''}`}>{label}</Label>
                    {/* Checkbox célibataire pour "Vie de couple" */}
                    {isCoupleSlider && (
                      <div className="flex items-center gap-2 ml-3">
                        <Checkbox
                          id="celibataire"
                          checked={isCelibataire}
                          onCheckedChange={(checked) => onCelibataireChange(!!checked)}
                        />
                        <Label htmlFor="celibataire" className="text-xs text-muted-foreground cursor-pointer">
                          Je suis célibataire
                        </Label>
                      </div>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground' : 'text-primary'}`}>
                    {isDisabled ? "N/A" : getLabel(key, currentValue)}
                  </span>
                </div>
                <GamifiedSlider
                  value={[isDisabled ? 50 : currentValue]}
                  onValueChange={(newValue) => !isDisabled && onChange(key, newValue[0])}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isDisabled}
                  className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                />
                {/* Labels guides sous les sliders */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{spheresLabels[key].levels[0]}</span>
                  <span>{spheresLabels[key].levels[spheresLabels[key].levels.length - 1]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-display font-bold mb-2">
          Ce qui compte le plus pour vous en ce moment
        </h3>
        <p className="text-muted-foreground text-sm mb-2">
          Sélectionnez <strong>2 priorités max</strong>
        </p>
        <p className="text-sm font-medium text-primary mb-4">
          {motivations.length}/2 sélectionné{motivations.length > 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {valeursPrioritaires.map((val) => (
            <Button
              key={val.key}
              variant={motivations.includes(val.key) ? "default" : "outline"}
              className="h-auto py-4 px-4 text-left justify-start"
              onClick={() => toggleMotivation(val.key)}
            >
              <span className="text-sm">{val.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
