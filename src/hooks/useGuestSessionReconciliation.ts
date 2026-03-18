import { supabase } from "@/integrations/supabase/client";

/**
 * Reconcile guest session with authenticated user
 * Fire & forget - completely async, non-blocking
 */
export const reconcileGuestSession = (userId: string) => {
  const sessionId = sessionStorage.getItem("astryd_session_id");
  
  if (!sessionId) return;

  // Fire & forget - update all guest analytics events with user_id
  (async () => {
    try {
      await supabase
        .from("analytics_events")
        .update({ user_id: userId })
        .eq("session_id", sessionId)
        .is("user_id", null);
    } catch {
      // Silent failure - doesn't block signup/signin flow
    }
  })();
};
