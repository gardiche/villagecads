import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type AnalyticsEventType = 
  | "card_viewed"
  | "card_swiped"
  | "why_dialog_opened"
  | "why_dialog_submitted"
  | "why_not_dialog_opened"
  | "why_not_dialog_submitted"
  | "eureka_shown"
  | "eureka_variant_selected"
  | "cv_uploaded"
  | "session_started"
  | "session_ended";

interface AnalyticsEventData {
  [key: string]: any;
}

export const useAnalytics = () => {
  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    eventData: AnalyticsEventData = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assessment } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!assessment) return;

      await supabase
        .from('user_analytics_events')
        .insert({
          user_id: user.id,
          assessment_id: assessment.id,
          event_type: eventType,
          event_data: eventData
        });
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Fail silently - don't break user experience for analytics
    }
  }, []);

  return { trackEvent };
};
