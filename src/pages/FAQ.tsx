import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqs = [
  {
    question: "Comment ça marche ?",
    answer: "Vous répondez à quelques questions sur votre énergie, votre temps disponible et votre situation. En 2 minutes, Astryd vous révèle votre profil entrepreneurial avec vos forces et vos freins. Vous voyez tout de suite ce qui vous aide et ce qui vous bloque. Si vous voulez aller plus loin, vous pouvez renseigner une idée pour personnaliser vos actions et votre coaching.",
  },
  {
    question: "C'est quoi exactement mon profil entrepreneurial ?",
    answer: "C'est votre portrait en tant qu'entrepreneur : vos forces naturelles (dynamique, créatif, autonome...) et vos freins à lever (pressé, surchargé, isolé...). Ce profil vous aide à comprendre comment vous fonctionnez et ce dont vous avez besoin pour avancer sereinement.",
  },
  {
    question: "Je n'ai pas encore d'idée, Astryd peut m'aider ?",
    answer: "Oui ! Astryd commence par votre profil, pas par une idée. Vous découvrez d'abord qui vous êtes en tant qu'entrepreneur. Ensuite, vous pouvez renseigner une idée pour personnaliser vos actions et votre coaching. Mais c'est optionnel : vous pouvez très bien commencer sans idée.",
  },
  {
    question: "Qu'est-ce que je vois dans mes résultats ?",
    answer: "Vous voyez votre profil entrepreneurial avec une illustration qui vous représente, vos forces et freins expliqués clairement, des actions concrètes adaptées à votre vie, et un journal pour échanger avec un coach IA qui vous comprend. Si vous avez renseigné une idée, vous avez aussi des zones d'attention personnalisées.",
  },
  {
    question: "Comment le journal de progression fonctionne ?",
    answer: "C'est une conversation avec un coach IA, comme un chat. Vous partagez vos doutes, vos questions, vos petites victoires. Le coach vous répond, vous encourage, vous pose des questions pour vous aider à avancer. Tout ce que vous écrivez influence vos prochaines actions suggérées.",
  },
  {
    question: "Les micro-actions, c'est quoi ?",
    answer: "Ce sont de petites actions concrètes, réalisables en 20-30 minutes max, adaptées à votre profil et votre vie. Pas de grandes stratégies abstraites : juste des pas simples pour avancer sans vous surcharger. Quand vous en faites une, une nouvelle apparaît, adaptée à votre progression.",
  },
  {
    question: "Est-ce qu'Astryd utilise vraiment une IA ?",
    answer: "Oui, Astryd utilise ChatGPT (GPT-4o/GPT-5) pour analyser votre profil et générer vos résultats. Ce n'est pas un questionnaire automatique : l'IA comprend votre situation unique et adapte ses conseils à vous. Chaque profil est différent.",
  },
  {
    question: "Combien de temps ça prend ?",
    answer: "Le profil initial : 2 minutes. Si vous renseignez une idée ensuite : 5 minutes de plus. Après, vous avancez à votre rythme avec le journal et les micro-actions. Pas de pression, pas de course.",
  },
  {
    question: "C'est gratuit ?",
    answer: "La formule Déclic est gratuite : vous obtenez votre profil entrepreneurial, vos premières actions, et 7 jours d'historique. Les formules Cap et Élan débloquent l'historique complet, le coaching illimité, et des sessions humaines pour aller plus loin.",
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer: "Oui. Vos données sont stockées de manière sécurisée et ne sont jamais partagées. Astryd utilise l'IA uniquement pour vous générer vos résultats personnalisés. Vous pouvez supprimer votre compte à tout moment.",
  },
  {
    question: "Je peux changer de projet ou d'idée ?",
    answer: "Oui, vous pouvez modifier votre idée ou en renseigner une nouvelle à tout moment. Votre historique reste sauvegardé pour que vous puissiez voir votre cheminement. Astryd ne juge pas : il vous accompagne, que vous changiez de direction ou que vous persistiez.",
  },
];

const FAQPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="py-20 md:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 md:mb-12 space-y-3 md:space-y-4"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold">
              Questions fréquentes
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tout ce que vous devez savoir sur Astryd
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-3 md:space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-4 md:px-6 bg-card hover:border-primary/30 transition-colors"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4 md:py-5 text-sm sm:text-base md:text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-4 md:pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
