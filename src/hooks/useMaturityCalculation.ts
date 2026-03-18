import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to calculate and manage maturity score
 * Maturity Score = Base Alignment Score + Progression Bonus
 * 
 * Base Alignment Score: ALWAYS the FIRST alignment score (never changes)
 * 
 * Progression Bonus is calculated from:
 * - Evolution of 6 alignment gauges (energie, temps, finances, soutien, competences, motivation)
 * - Completed micro-actions (status = 'done')
 * - Journal messages sent by user
 * - Zones d'attention resolved
 */
export const useMaturityCalculation = (ideaId: string) => {
  const [maturityScore, setMaturityScore] = useState<number>(0);
  const [baseScore, setBaseScore] = useState<number>(0);
  const [progressionBonus, setProgressionBonus] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ideaId) {
      calculateMaturityScore();
    }
  }, [ideaId]);

  const calculateMaturityScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 0. Try to load existing maturity score from DB first for quick display
      const { data: existingMaturityScore } = await supabase
        .from('maturity_scores')
        .select('score, base_alignment_score, progression_bonus')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Set initial values from DB if they exist
      if (existingMaturityScore) {
        setMaturityScore(existingMaturityScore.score || 0);
        setBaseScore(existingMaturityScore.base_alignment_score || 0);
        setProgressionBonus(existingMaturityScore.progression_bonus || 0);
      }

      // 1. Get INITIAL alignment score (FIRST score - NEVER CHANGES)
      const { data: initialAlignmentData } = await supabase
        .from('alignment_scores')
        .select('score_global, details')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true }) // Get the FIRST one
        .limit(1)
        .maybeSingle();

      const baseAlignmentScore = initialAlignmentData?.score_global || 0;
      setBaseScore(baseAlignmentScore);

      // 2. Get LATEST alignment score to calculate gauge progression
      const { data: latestAlignmentData } = await supabase
        .from('alignment_scores')
        .select('score_global, details')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 3. Calculate gauge progression bonus
      let gaugeProgressionBonus = 0;
      if (initialAlignmentData && latestAlignmentData && initialAlignmentData.details && latestAlignmentData.details) {
        const initialDetails = initialAlignmentData.details as any;
        const latestDetails = latestAlignmentData.details as any;
        
        // Calculate average improvement across all 6 gauges
        const gauges = ['energie', 'temps', 'finances', 'soutien', 'competences', 'motivation'];
        let totalImprovement = 0;
        
        gauges.forEach(gauge => {
          const initial = initialDetails[gauge] || 0;
          const latest = latestDetails[gauge] || 0;
          const improvement = Math.max(0, latest - initial); // Only count positive improvements
          totalImprovement += improvement;
        });
        
        // Average improvement converted to bonus points
        // Each point of average improvement = 0.5 bonus points
        // Max 15 points from gauge progression
        gaugeProgressionBonus = Math.min(15, (totalImprovement / gauges.length) * 0.5);
      }

      // 4. Calculate action-based progression
      const [microActionsRes, journalRes, zonesRes] = await Promise.all([
        // Count completed micro-actions
        supabase
          .from('micro_commitments')
          .select('id', { count: 'exact' })
          .eq('idea_id', ideaId)
          .eq('status', 'done'),
        
        // Count user journal messages
        supabase
          .from('journal_entries')
          .select('id', { count: 'exact' })
          .eq('idea_id', ideaId)
          .eq('sender', 'user'),
        
        // Count initial vs current attention zones (to see if some were resolved)
        supabase
          .from('attention_zones')
          .select('id', { count: 'exact' })
          .eq('idea_id', ideaId)
      ]);

      const completedActions = microActionsRes.count || 0;
      const journalMessages = journalRes.count || 0;

      // 5. Total bonus calculation:
      // - Gauge progression: up to 15 points
      // - Completed micro-actions: 1 point each (max 10)
      // - Journal messages: 0.3 points each (max 5)
      // - Max total bonus: 30 points
      const actionBonus = Math.min(10, completedActions * 1);
      const journalBonus = Math.min(5, journalMessages * 0.3);
      
      const totalBonus = Math.min(
        30,
        gaugeProgressionBonus + actionBonus + journalBonus
      );
      
      setProgressionBonus(Math.round(totalBonus));

      // 6. Calculate final maturity score (capped at 100)
      const finalScore = Math.min(100, baseAlignmentScore + totalBonus);
      setMaturityScore(Math.round(finalScore));

      // 7. Update or create maturity_scores record
      const { data: existingScore } = await (supabase as any)
        .from('maturity_scores')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingScore) {
        await (supabase as any)
          .from('maturity_scores')
          .update({
            score: Math.round(finalScore),
            base_alignment_score: baseAlignmentScore,
            progression_bonus: Math.round(totalBonus),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingScore.id);
      } else {
        await (supabase as any)
          .from('maturity_scores')
          .insert({
            idea_id: ideaId,
            user_id: user.id,
            score: Math.round(finalScore),
            base_alignment_score: baseAlignmentScore,
            progression_bonus: Math.round(totalBonus)
          });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error calculating maturity score:', error);
      setLoading(false);
    }
  };

  return {
    maturityScore,
    baseScore,
    progressionBonus,
    loading,
    recalculate: calculateMaturityScore
  };
};
