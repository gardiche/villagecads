import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve session ID from sessionStorage
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("astryd_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("astryd_session_id", sessionId);
  }
  return sessionId;
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Fire & forget - totally async, non-blocking, silent on error
    const trackPageView = () => {
      const sessionId = getSessionId();
      
      // Don't await - fire and forget
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from("analytics_events").insert({
            user_id: user?.id || null,
            session_id: sessionId,
            event_type: "page_view",
            page_path: location.pathname,
            event_data: {
              search: location.search,
              referrer: document.referrer,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {
          // Silently fail - no console error, no toast, no crash
          // AdBlockers, network issues, etc. are ignored
        }
      })();
    };

    trackPageView();
  }, [location.pathname, location.search]);
};

// Fire & forget helper to track custom events
export const trackEvent = (
  eventType: string,
  eventData: Record<string, any> = {}
) => {
  const sessionId = getSessionId();
  
  // Completely async, non-blocking, silent on error
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("analytics_events").insert({
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: eventType,
        page_path: window.location.pathname,
        event_data: {
          ...eventData,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Silent failure - no error messages
    }
  })();
};
