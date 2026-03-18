import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  values: {
    niveauEtudes: string;
    domainesFormation: string[];
    anneesExperience: string;
    domainesExperience: string[];
    competencesTransverses: string[];
  };
  onChange: (field: string, value: string | string[]) => void;
}

const domainesFormationOptions = [
  "Commerce / Vente / Marketing",
  "Communication / Média",
  "Finance / Comptabilité",
  "Informatique / Tech",
  "Design / Création",
  "Santé / Social",
  "Éducation / Formation",
  "Artisanat / Technique",
  "Juridique / Administratif",
  "Environnement / Agriculture",
  "Hôtellerie / Restauration",
  "Autre / Autodidacte"
];

const domainesExperienceOptions = [
  "Gestion de projet",
  "Vente / Commercial",
  "Marketing digital",
  "Développement web/app",
  "Design / UX-UI",
  "Création de contenu",
  "Formation / Coaching",
  "Relation client",
  "Finance / Gestion",
  "RH / Recrutement",
  "Logistique / Supply chain",
  "Production / Fabrication"
];

const competencesTransversesOptions = [
  "Leadership / Management",
  "Communication écrite",
  "Prise de parole en public",
  "Analyse de données",
  "Résolution de problèmes",
  "Créativité / Innovation",
  "Organisation / Planification",
  "Travail en équipe",
  "Autonomie",
  "Négociation",
  "Sens du service client",
  "Adaptabilité"
];

export const QuickCompetencesSection = ({ values, onChange }: Props) => {
  const toggleArrayValue = (field: string, value: string) => {
    const currentValues = values[field as keyof typeof values] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onChange(field, newValues);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Tes compétences</h2>
        <p className="text-muted-foreground text-lg">
          Formations, expériences et savoir-faire pour matcher avec les projets
        </p>
      </div>

      <div className="space-y-6">
        {/* Niveau d'études */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Niveau d'études</Label>
          <div className="grid grid-cols-1 gap-2">
            {["Bac ou moins", "Bac+2/3", "Bac+5 ou plus", "Autodidacte"].map((option) => (
              <Button
                key={option}
                type="button"
                variant={values.niveauEtudes === option ? "default" : "outline"}
                onClick={(e) => {
                  e.preventDefault();
                  onChange("niveauEtudes", option);
                }}
                className="h-auto py-3 justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Domaines de formation */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Domaines de formation (plusieurs choix possibles)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {domainesFormationOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`formation-${option}`}
                  checked={(values.domainesFormation || []).includes(option)}
                  onCheckedChange={() => toggleArrayValue("domainesFormation", option)}
                />
                <label
                  htmlFor={`formation-${option}`}
                  className="text-sm leading-tight cursor-pointer flex-1"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Années d'expérience */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Années d'expérience professionnelle</Label>
          <div className="grid grid-cols-1 gap-2">
            {["Débutant (0-2 ans)", "Intermédiaire (3-7 ans)", "Confirmé (8+ ans)"].map((option) => (
              <Button
                key={option}
                type="button"
                variant={values.anneesExperience === option ? "default" : "outline"}
                onClick={(e) => {
                  e.preventDefault();
                  onChange("anneesExperience", option);
                }}
                className="h-auto py-3 justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        {/* Domaines d'expérience */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Domaines d'expérience (plusieurs choix possibles)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {domainesExperienceOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`exp-${option}`}
                  checked={(values.domainesExperience || []).includes(option)}
                  onCheckedChange={() => toggleArrayValue("domainesExperience", option)}
                />
                <label
                  htmlFor={`exp-${option}`}
                  className="text-sm leading-tight cursor-pointer flex-1"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Compétences transverses */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Compétences transverses (plusieurs choix possibles)
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {competencesTransversesOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`comp-${option}`}
                  checked={(values.competencesTransverses || []).includes(option)}
                  onCheckedChange={() => toggleArrayValue("competencesTransverses", option)}
                />
                <label
                  htmlFor={`comp-${option}`}
                  className="text-sm leading-tight cursor-pointer flex-1"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
