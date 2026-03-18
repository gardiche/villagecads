import { Label } from "@/components/ui/label";
import { GamifiedSlider } from "@/components/ui/gamified-slider";
import { Card } from "@/components/ui/card";

interface Props {
  values: {
    investissementEstime: number;
    tempsHebdoEstime: number;
    competencesTechniquesRequises: number;
    interactionSocialeRequise: number;
    risquePercu: number;
  };
  onChange: (key: string, value: number) => void;
}

const gauges = [
  {
    key: "investissementEstime",
    label: "Investissement initial estimé",
    description: "Budget financier que vous envisagez d'investir pour démarrer ce projet (matériel, licences, marketing...)",
    getLabel: (v: number) => {
      if (v < 6) return "0€";
      if (v < 19) return "500€";
      if (v < 31) return "1000€";
      if (v < 44) return "2000€";
      if (v < 56) return "3000€";
      if (v < 69) return "5000€";
      if (v < 81) return "8000€";
      if (v < 94) return "15000€";
      return ">20k€";
    }
  },
  {
    key: "tempsHebdoEstime",
    label: "Temps à consacrer par semaine",
    description: "Nombre d'heures par semaine que vous pouvez réellement dédier à ce projet, en tenant compte de vos autres engagements",
    getLabel: (v: number) => {
      if (v < 6) return "<5h";
      if (v < 19) return "5h";
      if (v < 31) return "10h";
      if (v < 44) return "15h";
      if (v < 56) return "20h";
      if (v < 69) return "25h";
      if (v < 81) return "30h";
      if (v < 94) return "33h";
      return "35h+";
    }
  },
  {
    key: "competencesTechniquesRequises",
    label: "Compétences techniques requises",
    description: "Niveau de maîtrise technique nécessaire (développement, design, outils spécialisés...). Évaluez l'écart entre vos compétences actuelles et celles requises",
    getLabel: (v: number) => {
      if (v < 6) return "Aucune";
      if (v < 19) return "Débutant";
      if (v < 31) return "Basique";
      if (v < 44) return "Intermédiaire";
      if (v < 56) return "Moyen";
      if (v < 69) return "Confirmé";
      if (v < 81) return "Avancé";
      if (v < 94) return "Très avancé";
      return "Expert";
    }
  },
  {
    key: "interactionSocialeRequise",
    label: "Interaction sociale requise",
    description: "Fréquence et intensité des interactions humaines nécessaires (clients, partenaires, networking...). Tenez compte de votre énergie sociale disponible",
    getLabel: (v: number) => {
      if (v < 6) return "Solo";
      if (v < 19) return "Très peu";
      if (v < 31) return "Peu";
      if (v < 44) return "Régulier";
      if (v < 56) return "Modéré";
      if (v < 69) return "Fréquent";
      if (v < 81) return "Beaucoup";
      if (v < 94) return "Très fréquent";
      return "Permanent";
    }
  },
  {
    key: "risquePercu",
    label: "Risque perçu du projet",
    description: "Votre perception personnelle du risque financier, professionnel et personnel lié à ce projet. Soyez honnête avec vos inquiétudes",
    getLabel: (v: number) => {
      if (v < 6) return "Très faible";
      if (v < 19) return "Plutôt faible";
      if (v < 31) return "Faible";
      if (v < 44) return "Plutôt moyen";
      if (v < 56) return "Moyen";
      if (v < 69) return "Plutôt élevé";
      if (v < 81) return "Élevé";
      if (v < 94) return "Très élevé";
      return "Critique";
    }
  }
];

export const IdeaContextSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Contexte de votre projet</h2>
        <p className="text-muted-foreground text-lg">
          Positionnez votre idée sur ces dimensions pour affiner l'analyse
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
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
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
