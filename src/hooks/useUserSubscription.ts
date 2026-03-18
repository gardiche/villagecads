import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type SubscriptionPlan = "declic" | "cap" | "elan";

export const useUserSubscription = () => {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["user-subscription", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("plan, status")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }

      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Check for progression access code in localStorage
  const hasProgressionAccess = localStorage.getItem("astryd_progression_access") === "granted";

  // Determine current plan:
  // 1. If user has active subscription in DB, use that
  // 2. If user has progression access code, they have "cap" access
  // 3. Otherwise default to "declic"
  let currentPlan: SubscriptionPlan = subscription?.plan || "declic";
  
  if (!subscription && hasProgressionAccess) {
    currentPlan = "cap";
  }

  return {
    plan: currentPlan,
    isLoading,
    hasActiveSubscription: !!subscription,
    hasProgressionAccess,
  };
};
