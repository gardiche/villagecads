import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SyntheseChaudeCardProps {
  personaId: string;
  energie: number;
  soutien: number;
  confiance: number;
}

const PERSONAS_SYNTHESE: Record<string, {
  dejaOK: string[];
  demandeSoin: string[];
  microActions: Array<{
    titre: string;
    duree: string;
    impact: string;
    jauge: string;
  }>;
}> = {
  haute_motivation_temps_contraint: {
    dejaOK: [
      "Vous avez de l'énergie et de la motivation",
      "Vous savez ce que vous voulez faire",
      "Vous êtes capable de vous concentrer quand vous avez du temps"
    ],
    demandeSoin: [
      "Votre temps est fragmenté, vous risquez de vous éparpiller",
      "Vous pouvez vite vous sentir frustré·e si vous n'avancez pas assez vite"
    ],
    microActions: [
      {
        titre: "Bloquer 2h fixes dans ta semaine",
        duree: "15 min",
        impact: "Tu reprends le contrôle de ton agenda",
        jauge: "temps"
      },
      {
        titre: "Identifier 1 tâche mini qui fait avancer l'essentiel",
        duree: "20 min",
        impact: "Tu progresses sans te disperser",
        jauge: "clarte"
      },
      {
        titre: "Lister 3 choses à NE PAS faire cette semaine",
        duree: "10 min",
        impact: "Tu libères de l'espace mental",
        jauge: "energie"
      }
    ]
  },
  bloque_par_legitimite: {
    dejaOK: [
      "Vous êtes lucide sur vos limites, c'est une force",
      "Vous ne vous lancez pas dans n'importe quoi",
      "Vous avez des compétences existantes que vous sous-estimez"
    ],
    demandeSoin: [
      "Vous vous comparez trop aux autres",
      "Vous attendez d'être 'prêt·e' pour commencer"
    ],
    microActions: [
      {
        titre: "Identifier 1 compétence que vous avez déjà et qui sert votre projet",
        duree: "15 min",
        impact: "Vous voyez ce que vous apportez déjà",
        jauge: "competences"
      },
      {
        titre: "Envoyer 1 message à 1 personne pour tester votre idée",
        duree: "30 min",
        impact: "Vous gagnez en confiance",
        jauge: "soutien"
      },
      {
        titre: "Lister 3 preuves que vous avez déjà résolu des problèmes similaires",
        duree: "20 min",
        impact: "Vous ancrez votre légitimité dans le réel",
        jauge: "motivation"
      }
    ]
  },
  equilibre_d_abord: {
    dejaOK: [
      "Vous connaissez vos limites et vous les respectez",
      "Vous cherchez un chemin durable, pas un sprint",
      "Vous avez conscience de l'importance de votre équilibre"
    ],
    demandeSoin: [
      "Votre énergie est basse, vous risquez de procrastiner",
      "Vous avez des charges externes qui pèsent sur votre temps"
    ],
    microActions: [
      {
        titre: "Identifier 1 source de fatigue que vous pouvez réduire cette semaine",
        duree: "15 min",
        impact: "Vous récupérez de l'énergie",
        jauge: "energie"
      },
      {
        titre: "Bloquer 30 min pour vous, sans interruption",
        duree: "10 min",
        impact: "Vous reprenez du souffle",
        jauge: "temps"
      },
      {
        titre: "Parler à 1 personne de confiance de votre projet",
        duree: "30 min",
        impact: "Vous vous sentez moins seul·e",
        jauge: "soutien"
      }
    ]
  },
  explorateur_multi_idees: {
    dejaOK: [
      "Vous êtes créatif·ve et vous voyez des opportunités partout",
      "Vous avez de l'énergie et de la curiosité",
      "Vous n'avez pas peur d'explorer"
    ],
    demandeSoin: [
      "Vous papillonnez, vous risquez de ne rien finir",
      "Vous avez du mal à dire non à de nouvelles idées"
    ],
    microActions: [
      {
        titre: "Lister toutes vos idées et en choisir 1 pour les 30 prochains jours",
        duree: "30 min",
        impact: "Vous posez un cadre clair",
        jauge: "clarte"
      },
      {
        titre: "Identifier 1 tâche mini qui fait avancer cette idée",
        duree: "20 min",
        impact: "Vous ancrez votre attention",
        jauge: "temps"
      },
      {
        titre: "Bloquer 1h fixe par semaine pour cette idée uniquement",
        duree: "15 min",
        impact: "Vous créez un rituel de focus",
        jauge: "energie"
      }
    ]
  },
  solo_manque_miroir: {
    dejaOK: [
      "Vous êtes autonome et vous savez avancer seul·e",
      "Vous êtes motivé·e et vous avez de la clarté",
      "Vous avez déjà fait beaucoup de chemin par vous-même"
    ],
    demandeSoin: [
      "Vous manquez de feedback externe, vous risquez de tourner en rond",
      "Vous avez du mal à demander de l'aide"
    ],
    microActions: [
      {
        titre: "Identifier 1 personne de confiance à qui parler de votre projet",
        duree: "15 min",
        impact: "Vous sortez de l'isolement",
        jauge: "soutien"
      },
      {
        titre: "Rejoindre 1 communauté / groupe de pairs cette semaine",
        duree: "30 min",
        impact: "Vous créez un réseau de soutien",
        jauge: "soutien"
      },
      {
        titre: "Envoyer 1 message pour tester votre idée auprès de 1 personne",
        duree: "20 min",
        impact: "Vous gagnez en feedback",
        jauge: "clarte"
      }
    ]
  }
};

const detectPersonaFromScores = (energie: number, soutien: number, confiance: number): string => {
  if (energie < 40) return "equilibre_d_abord";
  if (soutien < 40) return "solo_manque_miroir";
  if (confiance < 40) return "bloque_par_legitimite";
  return "haute_motivation_temps_contraint";
};

export const SyntheseChaudeCard = ({ personaId, energie, soutien, confiance }: SyntheseChaudeCardProps) => {
  const navigate = useNavigate();
  const detectedPersona = detectPersonaFromScores(energie, soutien, confiance);
  const synthese = PERSONAS_SYNTHESE[detectedPersona] || PERSONAS_SYNTHESE.haute_motivation_temps_contraint;

  return (
    <div className="space-y-6">
      {/* Garde-fous UI */}
      {energie < 40 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <p className="text-foreground font-medium">
            ⚠️ Tu n'as pas besoin de t'épuiser pour avancer. On va faire petit mais régulier.
          </p>
        </Card>
      )}
      {soutien < 40 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <p className="text-foreground font-medium">
            💬 Tu n'es pas seul·e. Une micro-demande de feedback peut déjà tout changer.
          </p>
        </Card>
      )}
      {confiance < 40 && (
        <Card className="p-4 bg-muted/50 border-border">
          <p className="text-foreground font-medium">
            ✨ On avance ensemble. 1 preuve minimale suffit pour débloquer la suite.
          </p>
        </Card>
      )}

      {/* Ce qui est déjà OK */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <h3 className="text-xl font-semibold text-foreground">Ce qui est déjà OK</h3>
        </div>
        <ul className="space-y-2">
          {synthese.dejaOK.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground">
              <span className="text-green-500 mt-1">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Ce qui demande soin */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-xl font-semibold text-foreground">Ce qui demande soin</h3>
        </div>
        <ul className="space-y-2">
          {synthese.demandeSoin.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-foreground">
              <span className="text-orange-500 mt-1">⚠</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 3 micro-actions immédiates */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">3 micro-actions immédiates</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {synthese.microActions.map((action, i) => (
            <Card key={i} className="p-4 space-y-2 hover:shadow-sm transition-shadow">
              <h4 className="font-medium text-foreground">{action.titre}</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>⏱️ {action.duree}</p>
                <p>🎯 {action.impact}</p>
                <Badge variant="secondary" className="text-xs">{action.jauge}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="flex-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Je prends une micro-action
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => window.location.href = "mailto:tbo@alpact.vc"}
        >
          Parler à un humain
        </Button>
      </div>
    </div>
  );
};
