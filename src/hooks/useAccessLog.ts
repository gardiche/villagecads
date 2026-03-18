import { supabase } from "@/integrations/supabase/client";

type AccessAction =
  | "mentor_view_list"
  | "mentor_view_detail"
  | "admin_view_dashboard"
  | "admin_view_distress_alerts"
  | "entrepreneur_toggle_sharing";

type TargetType = "entrepreneur" | "dashboard" | "cohort" | "brief";

export const logAccess = (
  action: AccessAction,
  targetType: TargetType,
  targetId?: string,
  metadata?: Record<string, unknown>
) => {
  // Fire-and-forget — never blocks UI
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("access_logs" as any).insert({
        user_id: user.id,
        action,
        target_type: targetType,
        target_id: targetId || null,
        metadata: metadata || null,
      });
    } catch {
      // Silent failure
    }
  })();
};
