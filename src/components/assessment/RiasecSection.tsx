import { Slider } from "@/components/ui/slider";

interface Props {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const riasecDimensions = [
  {
    key: "realiste",
    label: "Manipuler et fabriquer",
    description: "Travailler avec des objets, des outils, des machines. Exemples : artisanat, bricolage, technique"
  },
  {
    key: "investigateur",
    label: "Analyser et comprendre",
    description: "Observer, réfléchir, résoudre des problèmes complexes. Exemples : recherche, science, stratégie"
  },
  {
    key: "artistique",
    label: "Créer et exprimer",
    description: "Imaginer, concevoir, produire du contenu original. Exemples : design, écriture, art"
  },
  {
    key: "social",
    label: "Aider et accompagner",
    description: "Soutenir, enseigner, soigner les autres. Exemples : formation, conseil, santé"
  },
  {
    key: "entreprenant",
    label: "Convaincre et diriger",
    description: "Vendre, négocier, mener des équipes, prendre des décisions. Exemples : commerce, management"
  },
  {
    key: "conventionnel",
    label: "Organiser et gérer",
    description: "Structurer, classer, gérer des données et process. Exemples : admin, comptabilité, logistique"
  }
];

export const RiasecSection = ({ values, onChange }: Props) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Ce que tu aimes faire</h2>
        <p className="text-muted-foreground text-lg">
          Quels types d'activités professionnelles t'attirent ? (0 = aucun intérêt, 100 = passionné·e)
        </p>
      </div>

      <div className="space-y-6">
        {riasecDimensions.map((item) => (
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
              <span>Aucun intérêt</span>
              <span>Très intéressé·e</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
