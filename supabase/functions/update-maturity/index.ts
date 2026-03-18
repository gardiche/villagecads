import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, actionType, progressionPoints = 1 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current maturity score or create if doesn't exist
    const { data: maturityData, error: fetchError } = await supabase
      .from('maturity_scores')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let currentScore = 0;
    let baseAlignmentScore = 0;

    if (!maturityData) {
      // Get base alignment score from alignment_scores
      const { data: alignmentData } = await supabase
        .from('alignment_scores')
        .select('score_global')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      // CRITICAL: Use the FIRST alignment score as base (from initial analysis)
      // Score can NEVER be 0 - minimum is alignment score or 15 if no alignment yet
      baseAlignmentScore = alignmentData?.score_global || 15;
      currentScore = baseAlignmentScore;

      // Create initial maturity score
      const { error: insertError } = await supabase
        .from('maturity_scores')
        .insert({
          idea_id: ideaId,
          user_id: user.id,
          score: currentScore,
          base_alignment_score: baseAlignmentScore,
          progression_bonus: 0
        });

      if (insertError) throw insertError;
    } else {
      currentScore = maturityData.score;
      baseAlignmentScore = maturityData.base_alignment_score;
      
      // FIX: If base_alignment_score is somehow 0, recover it from first alignment score
      if (baseAlignmentScore === 0) {
        const { data: alignmentData } = await supabase
          .from('alignment_scores')
          .select('score_global')
          .eq('idea_id', ideaId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (alignmentData && alignmentData.score_global > 0) {
          baseAlignmentScore = alignmentData.score_global;
          // Update the maturity record with correct base
          await supabase
            .from('maturity_scores')
            .update({ base_alignment_score: baseAlignmentScore })
            .eq('idea_id', ideaId)
            .eq('user_id', user.id);
        }
      }
    }

    // Calculate progression based on action type
    let pointsToAdd = progressionPoints;
    
    // Different actions give different progression
    switch (actionType) {
      case 'initial':
        pointsToAdd = 0; // Initial setup - no bonus points
        break;
      case 'journal':
        pointsToAdd = Math.min(3, progressionPoints); // Max +3 per journal entry
        break;
      case 'commitment':
        pointsToAdd = Math.min(2, progressionPoints); // Max +2 per commitment
        break;
      case 'zone_lifted':
        pointsToAdd = Math.min(5, progressionPoints); // Max +5 per zone lifted
        break;
      case 'document_added':
        pointsToAdd = Math.min(4, progressionPoints); // Max +4 per document
        break;
      case 'idea_updated':
        pointsToAdd = Math.min(2, progressionPoints); // Max +2 for idea update
        break;
      default:
        pointsToAdd = 1;
    }

    const newScore = Math.min(100, currentScore + pointsToAdd);
    const newProgressionBonus = newScore - baseAlignmentScore;

    // Update maturity score
    const { error: updateError } = await supabase
      .from('maturity_scores')
      .update({
        score: newScore,
        progression_bonus: newProgressionBonus
      })
      .eq('idea_id', ideaId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Add to history
    const { error: historyError } = await supabase
      .from('maturity_history')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        previous_score: currentScore,
        new_score: newScore,
        action_type: actionType
      });

    if (historyError) throw historyError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        previousScore: currentScore,
        newScore,
        progressionPoints: pointsToAdd
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error updating maturity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
