import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to manage Astryd session logging
 * Tracks user activity: journal messages and completed micro-actions
 */
export const useAstrydSession = () => {
  
  const logJournalMessage = async (ideaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Increment journal message count
      const { data: session } = await (supabase as any)
        .from('astryd_sessions')
        .select('id, journal_message_count')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (session) {
        await (supabase as any)
          .from('astryd_sessions')
          .update({
            journal_message_count: (session.journal_message_count || 0) + 1
          })
          .eq('id', session.id);

        console.log(`📊 Astryd_sessions updated: ${session.id} (journal_message_count: ${(session.journal_message_count || 0) + 1})`);
      }
    } catch (error) {
      console.error('Error logging journal message:', error);
    }
  };

  const logMicroActionCompleted = async (ideaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Increment micro-action completed count
      const { data: session } = await (supabase as any)
        .from('astryd_sessions')
        .select('id, micro_actions_completed_count')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (session) {
        await (supabase as any)
          .from('astryd_sessions')
          .update({
            micro_actions_completed_count: (session.micro_actions_completed_count || 0) + 1
          })
          .eq('id', session.id);

        console.log(`📊 Astryd_sessions updated: ${session.id} (micro_actions_completed: ${(session.micro_actions_completed_count || 0) + 1})`);
      }
    } catch (error) {
      console.error('Error logging micro-action:', error);
    }
  };

  const updateMaturityScore = async (ideaId: string, newScore: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session } = await (supabase as any)
        .from('astryd_sessions')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (session) {
        await (supabase as any)
          .from('astryd_sessions')
          .update({
            maturity_score_current: newScore
          })
          .eq('id', session.id);

        console.log(`📊 Astryd_sessions updated: ${session.id} (maturity_score_current: ${newScore})`);
      }
    } catch (error) {
      console.error('Error updating maturity score:', error);
    }
  };

  return {
    logJournalMessage,
    logMicroActionCompleted,
    updateMaturityScore,
  };
};
