import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment Astryd calcule mon score d'alignement ?",
    answer: "Astryd croise votre profil psychologique (Big Five, RIASEC, valeurs de Schwartz), vos sphères de vie actuelles (famille, travail, loisirs) et votre contexte réel (temps, finances, énergie). L'IA analyse ces données pour évaluer la compatibilité entre votre projet et votre situation de vie, puis génère un score d'alignement sur 6 dimensions : motivation, compétences, temps, énergie, finances et soutien.",
  },
  {
    question: "Quelle différence entre le score initial et le score de maturité ?",
    answer: "Le score initial mesure l'alignement théorique entre vous et votre projet au départ. Le score de maturité évolue au fil de vos actions : chaque micro-engagement complété, chaque réflexion journalisée, chaque document ajouté renforce la maturité de votre projet. C'est un indicateur dynamique de votre progression réelle vers le passage à l'action.",
  },
  {
    question: "Pourquoi proposer 3 zones d'attention plutôt qu'un plan d'action complet ?",
    answer: "Parce que votre attention est limitée. Astryd identifie les 3 freins les plus critiques à lever maintenant pour avancer. Plutôt qu'un plan idéal et écrasant, vous recevez des micro-actions concrètes et adaptées à votre bande passante réelle. Le plan évolue au fur et à mesure que vous progressez.",
  },
  {
    question: "Comment fonctionne la recommandation Go/Keep/Pivot/Stop ?",
    answer: "À partir de votre score de maturité et de l'analyse de vos actions, Astryd génère une recommandation stratégique : Go (lancez-vous maintenant), Keep (continuez de maturer votre projet), Pivot (ajustez votre direction), ou Stop (abandonnez pour une meilleure idée). Cette recommandation se base sur des seuils d'alignement et sur la dynamique de votre engagement mesuré.",
  },
  {
    question: "Est-ce que mes données sont analysées par une vraie IA ou c'est un questionnaire automatisé ?",
    answer: "Astryd utilise des modèles d'IA avancés (GPT-5, Gemini) pour analyser votre profil et générer des recommandations personnalisées. Ce n'est pas un simple questionnaire à choix multiples : l'IA interprète vos réponses, détecte des patterns dans votre comportement et adapte ses suggestions en fonction de votre évolution. Chaque analyse est unique.",
  },
  {
    question: "Que se passe-t-il si mon projet échoue ou si je change d'idée ?",
    answer: "L'historique conserve toutes vos sessions, scores et décisions. Vous pouvez créer un nouveau projet à tout moment, et l'IA utilisera votre historique pour affiner ses recommandations futures. Astryd ne vous juge pas sur l'échec : il vous guide vers l'alignement, et parfois ça passe par plusieurs tentatives.",
  },
  {
    question: "Pourquoi proposer du coaching humain dans la formule Élan ?",
    answer: "Parce que l'IA ne suffit pas toujours à lever les freins psychologiques profonds (peur de l'échec, légitimité, procrastination chronique). Les séances de coaching certifié complètent l'analyse algorithmique par un accompagnement humain sur mesure, pour dénouer les blocages et valider votre passage à l'action avec un regard extérieur expert.",
  },
];

const FAQ = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-muted/20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12 space-y-3 md:space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold px-2">
            Questions fréquentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border-2 border-border rounded-xl px-4 md:px-6 hover:border-primary/30 transition-all"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:no-underline py-4 md:py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base text-muted-foreground pb-4 md:pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
