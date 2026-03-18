import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, TrendingUp, Users } from "lucide-react";
import AccountPageLayout from "@/components/AccountPageLayout";
import { useState, useEffect } from "react";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Déclic",
    subtitle: "Gratuit",
    price: "0€",
    period: "/mois",
    icon: Star,
    description: "Pour découvrir votre profil entrepreneurial et obtenir vos premiers insights.",
    features: [
      "Profil entrepreneurial complet (Nano Banana)",
      "Analyse d'alignement idée ⇄ personne",
      "Zones d'attention personnalisées",
      "Micro-actions adaptées",
      "Journal entrepreneurial",
      "Historique limité (7 derniers jours)"
    ],
    planId: "declic",
    badge: "Gratuit"
  },
  {
    name: "Cap",
    subtitle: "Premium",
    price: "19,90€",
    period: "/mois",
    icon: TrendingUp,
    description: "Pour suivre votre progression et accéder à l'historique complet de votre cheminement.",
    features: [
      "Tout de Déclic",
      "Historique complet illimité",
      "Analyse IA de votre progression",
      "Export PDF de vos résultats",
      "Insights IA sur votre évolution",
      "Bilan de cheminement détaillé",
      "Support prioritaire"
    ],
    planId: "cap",
    badge: "Populaire",
    action: "progression"
  },
  {
    name: "Élan",
    subtitle: "Premium +",
    price: "49,90€",
    period: "/mois",
    icon: Users,
    description: "Pour ouvrir l'accès collaboratif à votre espace Village avec un coach entrepreneurial certifié.",
    features: [
      "Tout de Cap",
      "Accès collaboratif coach certifié",
      "Coaching personnalisé sur votre posture",
      "Co-construction de vos micro-actions",
      "Ajustement de votre objectif avec coach",
      "Suivi continu de votre progression"
    ],
    planId: "elan",
    badge: "Premium +",
    action: "coaching"
  }
];

const getCtaForPlan = (planId: string, currentPlan: string, planName: string): string => {
  if (planId === currentPlan) return "Formule actuelle";
  const planOrder = { declic: 0, cap: 1, elan: 2 };
  const currentOrder = planOrder[currentPlan as keyof typeof planOrder];
  const targetOrder = planOrder[planId as keyof typeof planOrder];
  return targetOrder > currentOrder ? `Passer à ${planName}` : `Revenir à ${planName}`;
};

const AccountSubscription = () => {
  const navigate = useNavigate();
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const { plan: currentPlan } = useUserSubscription();

  // Redirect pro accounts away from subscription page
  useEffect(() => {
    const checkProAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roleList = roles?.map(r => r.role) || [];
      if (roleList.includes("mentor") || roleList.includes("manager")) {
        navigate("/pro/mentor/dashboard", { replace: true });
      }
    };
    checkProAccess();
  }, [navigate]);

  const handlePlanAction = (action?: string) => {
    if (action === "progression") setShowProgressionModal(true);
    else if (action === "coaching") setShowCoachingModal(true);
  };

  return (
    <AccountPageLayout>
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4 px-4">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">Choisissez votre formule</h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Le Village by CA vous accompagne dans votre cheminement entrepreneurial. Choisissez la formule qui correspond à vos besoins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = plan.planId === currentPlan;
            const ctaText = getCtaForPlan(plan.planId, currentPlan, plan.name);
            
            return (
              <Card key={plan.name} className={`p-4 sm:p-6 relative ${isCurrent ? 'border-primary ring-2 ring-primary/20' : ''} ${plan.badge === 'Populaire' && !isCurrent ? 'border-accent' : ''} flex flex-col`}>
                {isCurrent && (
                  <Badge className="absolute -top-3 left-4 sm:left-6 text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                    ✓ Votre plan
                  </Badge>
                )}
                {plan.badge && !isCurrent && (
                  <Badge variant={plan.badge === 'Gratuit' ? 'secondary' : plan.badge === 'Populaire' ? 'default' : 'outline'} className="absolute -top-3 right-4 sm:right-6 text-xs">
                    {plan.badge}
                  </Badge>
                )}
                <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                      <h3 className="font-display text-xl sm:text-2xl font-bold">{plan.name}</h3>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">{plan.subtitle}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full text-sm sm:text-base" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={() => handlePlanAction(plan.action)}>
                    {ctaText}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 sm:p-6 bg-muted/30 mx-4">
          <div className="text-center space-y-3">
            <h3 className="font-display text-lg sm:text-xl font-bold">Une question sur les formules ?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Contactez-nous par le{" "}
              <button onClick={() => { const chatButton = document.querySelector('[class*="fixed bottom-6 right-6"]') as HTMLButtonElement; chatButton?.click(); }} className="text-primary hover:underline font-medium">chat</button>
            </p>
          </div>
        </Card>
      </div>

      <ProgressionAccessModal open={showProgressionModal} onOpenChange={setShowProgressionModal} />
      <CoachingComingSoonModal open={showCoachingModal} onOpenChange={setShowCoachingModal} />
    </AccountPageLayout>
  );
};

export default AccountSubscription;
