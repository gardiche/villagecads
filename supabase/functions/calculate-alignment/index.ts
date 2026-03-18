import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getAuthenticatedUser, unauthorizedResponse, verifyResourceOwnership } from "../_shared/authGuard.ts";
import { sanitizeForPrompt } from "../_shared/sanitize.ts";

import { getCorsHeaders } from '../_shared/corsHeaders.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 SÉCU 3: Verify JWT
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return unauthorizedResponse(corsHeaders);

    const { ideaId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .maybeSingle();
    
    if (ideaError) throw ideaError;
    if (!idea) throw new Error('Idea not found');

    // 🔒 SÉCU 3: Verify idea belongs to authenticated user
    const ownerCheck = verifyResourceOwnership(authUser.id, idea.user_id, 'idea', corsHeaders);
    if (ownerCheck) return ownerCheck;
    
    const { data: assessment, error: assessmentError } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('user_id', idea.user_id)
      .maybeSingle();
    
    if (assessmentError) throw assessmentError;
    if (!assessment) throw new Error('No assessment found for user');
    
    const [schwartz, lifeSpheres, bigFive, context, riasec, profile] = await Promise.all([
      supabase.from('schwartz_values').select('*').eq('assessment_id', assessment.id).maybeSingle(),
      supabase.from('life_spheres').select('*').eq('assessment_id', assessment.id).maybeSingle(),
      supabase.from('big_five_traits').select('*').eq('assessment_id', assessment.id).maybeSingle(),
      supabase.from('user_context').select('*').eq('assessment_id', assessment.id).maybeSingle(),
      supabase.from('riasec_scores').select('*').eq('assessment_id', assessment.id).maybeSingle(),
      supabase.from('user_learning_profiles').select('*').eq('assessment_id', assessment.id).maybeSingle(),
    ]);
    
    if (!schwartz.data || !lifeSpheres.data || !bigFive.data || !context.data || !riasec.data) {
      throw new Error('Incomplete assessment data');
    }
    
    const systemPrompt = `Coach IA alignement posture entrepreneuriale. Score global (0-100) + 6 scores (energie, temps, finances, soutien, competences, motivation). Zones attention (0-5) : label, severity 1-3, recommendation. JSON strict.`;

    // 🔒 SÉCU 7: Sanitize user inputs
    const userPrompt = `Idée: ${sanitizeForPrompt(idea.title, 200)} - ${sanitizeForPrompt(idea.description || '', 2000)}

Profil:
Schwartz: ${schwartz.data.pouvoir}/${schwartz.data.accomplissement}/${schwartz.data.hedonisme}/${schwartz.data.stimulation}/${schwartz.data.autonomie}/${schwartz.data.universalisme}/${schwartz.data.bienveillance}/${schwartz.data.tradition}/${schwartz.data.conformite}/${schwartz.data.securite}
Sphères: ${lifeSpheres.data.soi}/${lifeSpheres.data.couple}/${lifeSpheres.data.famille}/${lifeSpheres.data.amis}/${lifeSpheres.data.loisirs}/${lifeSpheres.data.pro}
Big5: ${bigFive.data.ouverture}/${bigFive.data.conscienciosite}/${bigFive.data.extraversion}/${bigFive.data.agreabilite}/${bigFive.data.nevrosisme}
Contexte: ${context.data.situation_pro}/${context.data.situation_financiere}/${context.data.soutien_entourage}/${context.data.tolerance_risque}
RIASEC: ${riasec.data.realiste}/${riasec.data.investigateur}/${riasec.data.artistique}/${riasec.data.social}/${riasec.data.entreprenant}/${riasec.data.conventionnel}

Analyse alignement idée ⇄ profil.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content.trim();
    
    if (content.startsWith('```')) {
      const firstNewline = content.indexOf('\n');
      const lastCodeBlock = content.lastIndexOf('```');
      if (firstNewline !== -1 && lastCodeBlock > firstNewline) {
        content = content.substring(firstNewline + 1, lastCodeBlock).trim();
      }
    }
    
    const alignmentData = JSON.parse(content);

    const { data: savedScore, error: saveError } = await supabase
      .from('alignment_scores')
      .insert({
        user_id: idea.user_id,
        idea_id: ideaId,
        score_global: alignmentData.score_global,
        details: alignmentData.details,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    if (alignmentData.attention_zones?.length > 0) {
      // Archive old zones instead of deleting
      await supabase.from('attention_zones')
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq('idea_id', ideaId)
        .eq('user_id', idea.user_id)
        .or('archived.is.null,archived.eq.false');

      // Insert with DEDUPLICATION + HARD CAP of 7
      const MAX_ACTIVE_ZONES = 7;
      const insertedLabels: string[] = [];
      let insertedCount = 0;

      for (const zone of alignmentData.attention_zones) {
        if (insertedCount >= MAX_ACTIVE_ZONES) break;

        const normalizedLabel = (zone.label || '').toLowerCase().trim();
        const isDuplicate = insertedLabels.some(existing => 
          existing === normalizedLabel || 
          existing.includes(normalizedLabel) || 
          normalizedLabel.includes(existing)
        );

        if (isDuplicate) {
          console.log(`⏭️ Zone dupliquée ignorée: "${zone.label}"`);
          continue;
        }

        const { error } = await supabase.from('attention_zones').insert({
          user_id: idea.user_id,
          idea_id: ideaId,
          label: zone.label,
          severity: zone.severity || 1,
          recommendation: zone.recommendation
        });

        if (!error) {
          insertedLabels.push(normalizedLabel);
          insertedCount++;
        }
      }
      console.log(`✅ ${insertedCount} zones inserted (deduped from ${alignmentData.attention_zones.length})`);
    }

    return new Response(JSON.stringify(savedScore), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
