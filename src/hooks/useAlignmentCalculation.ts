import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAstrydSession } from "./useAstrydSession";

export const useAlignmentCalculation = () => {
  const [calculating, setCalculating] = useState(false);
  const { updateMaturityScore } = useAstrydSession();

  const calculateAlignment = async (ideaId: string) => {
    setCalculating(true);
    try {
      console.log('Calling computeAlignmentWithGPT for idea:', ideaId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Fetch idea
      const { data: idea } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .single();

      // Fetch user assessment (contains all questionnaire data) WITH ALL RELATIONS
      console.log('🔍 Fetching complete user assessment with all relations...');
      const { data: assessment, error: assessmentError } = await supabase
        .from("user_assessments")
        .select(`
          *,
          life_spheres (*),
          schwartz_values (*),
          big_five_traits (*),
          riasec_scores (*),
          user_context (*),
          user_learning_profiles (cv_insights)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentError) {
        console.error('❌ Error fetching assessment:', assessmentError);
      }
      
      console.log('📊 Complete assessment data retrieved:', {
        hasAssessment: !!assessment,
        hasLifeSpheres: !!assessment?.life_spheres,
        hasSchwartzValues: !!assessment?.schwartz_values,
        hasBigFive: !!assessment?.big_five_traits,
        hasRiasec: !!assessment?.riasec_scores,
        hasContext: !!assessment?.user_context,
        hasCvInsights: !!assessment?.user_learning_profiles
      });

      // Fetch journal entries
      const { data: journalEntries } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch completed micro-commitments
      const { data: microCommitments } = await supabase
        .from("micro_commitments")
        .select("*")
        .eq("idea_id", ideaId)
        .eq("status", "done");

      // Prepare data for GPT - Structure the complete assessment data
      console.log('📦 Preparing structured data for GPT...');
      
      // Extract CV insights - handle both string and object formats
      let cvAnalysis = "Non renseigné";
      const learningProfiles = assessment?.user_learning_profiles as any;
      if (learningProfiles?.[0]?.cv_insights) {
        const insights = learningProfiles[0].cv_insights;
        if (typeof insights === 'string') {
          cvAnalysis = insights;
        } else if (insights && typeof insights === 'object' && 'cv_text' in insights) {
          cvAnalysis = insights.cv_text || "Non renseigné";
        }
      }
      
      // Structure the data exactly as computeAlignmentWithGPT expects
      const requestData = {
        idea: {
          title: idea?.title,
          pitch: idea?.title,
          description: idea?.description,
        },
        answers: {
          // Schwartz values
          motivations: assessment?.schwartz_values ? {
            autonomie: assessment.schwartz_values.autonomie || 50,
            accomplissement: assessment.schwartz_values.accomplissement || 50,
            stimulation: assessment.schwartz_values.stimulation || 50,
            bienveillance: assessment.schwartz_values.bienveillance || 50,
            universalisme: assessment.schwartz_values.universalisme || 50,
            securite: assessment.schwartz_values.securite || 50,
            conformite: assessment.schwartz_values.conformite || 50,
            tradition: assessment.schwartz_values.tradition || 50,
            hedonisme: assessment.schwartz_values.hedonisme || 50,
            pouvoir: assessment.schwartz_values.pouvoir || 50,
          } : {},
          
          // Life spheres
          spheres: assessment?.life_spheres ? {
            soi: assessment.life_spheres.soi || 50,
            pro: assessment.life_spheres.pro || 50,
            couple: assessment.life_spheres.couple || 50,
            famille: assessment.life_spheres.famille || 50,
            amis: assessment.life_spheres.amis || 50,
            loisirs: assessment.life_spheres.loisirs || 50,
            energie: assessment.life_spheres.soi || 50,
            sante: assessment.life_spheres.soi || 50,
            temps_disponible: assessment.life_spheres.pro || 50,
            soutien_social: assessment.life_spheres.amis || 50,
            charge_mentale: 50,
          } : {},
          
          // Big Five
          big5: assessment?.big_five_traits ? {
            ouverture: assessment.big_five_traits.ouverture || 50,
            conscienciosite: assessment.big_five_traits.conscienciosite || 50,
            extraversion: assessment.big_five_traits.extraversion || 50,
            agreabilite: assessment.big_five_traits.agreabilite || 50,
            nevrosisme: assessment.big_five_traits.nevrosisme || 50,
          } : {},
          
          // RIASEC
          riasec: assessment?.riasec_scores ? {
            realiste: assessment.riasec_scores.realiste || 50,
            investigateur: assessment.riasec_scores.investigateur || 50,
            artistique: assessment.riasec_scores.artistique || 50,
            social: assessment.riasec_scores.social || 50,
            entreprenant: assessment.riasec_scores.entreprenant || 50,
            conventionnel: assessment.riasec_scores.conventionnel || 50,
          } : {},
          
          // Context
          environment: assessment?.user_context ? {
            situation_financiere: assessment.user_context.situation_financiere || "50",
            soutien_entourage: assessment.user_context.soutien_entourage || "50",
            marge_manoeuvre_financiere: 50,
            reseau: 50,
            mentors: 50,
            contexte_pro: 50,
          } : {},
        },
        uploadedDocuments: {
          analysis: cvAnalysis,
        },
        journalEntries: journalEntries || [],
        microCommitments: {
          completed: microCommitments || [],
        },
      };

      console.log('✅ Data structure prepared with:', {
        hasMotivations: Object.keys(requestData.answers.motivations || {}).length > 0,
        hasSpheres: Object.keys(requestData.answers.spheres || {}).length > 0,
        hasBig5: Object.keys(requestData.answers.big5 || {}).length > 0,
        hasRiasec: Object.keys(requestData.answers.riasec || {}).length > 0,
        hasEnvironment: Object.keys(requestData.answers.environment || {}).length > 0,
        journalCount: journalEntries?.length || 0,
        commitmentsCount: microCommitments?.length || 0,
      });

      // Call the edge function
      const { data: result, error } = await supabase.functions.invoke(
        'computeAlignmentWithGPT',
        { body: requestData }
      );

      if (error) throw error;

      console.log('GPT Analysis Result:', result);

      // Save results to database
      const scoreAlignement = result.score_alignement || 0;
      
      // Calculate maturity score: base alignment + bonuses
      const completedCommitmentsBonus = (microCommitments?.length || 0) * 2;
      const journalEntriesBonus = Math.min((journalEntries?.length || 0), 10);
      
      const maturityScore = Math.min(
        scoreAlignement + completedCommitmentsBonus + journalEntriesBonus,
        100
      );

      // Save alignment score with detailed scores
      const detailsJson: any = {
        energie: 0,
        temps: 0,
        finances: 0,
        soutien: 0,
        competences: 0,
        motivation: 0
      };

      if (result.scores_detail) {
        detailsJson.energie = result.scores_detail.energie || 0;
        detailsJson.temps = result.scores_detail.temps || 0;
        detailsJson.finances = result.scores_detail.finances || 0;
        detailsJson.soutien = result.scores_detail.soutien || 0;
        detailsJson.competences = result.scores_detail.competences || 0;
        detailsJson.motivation = result.scores_detail.motivation || 0;
      }

      const { error: scoreError } = await supabase.from("alignment_scores").insert({
        user_id: user.id,
        idea_id: ideaId,
        score_global: scoreAlignement,
        details: detailsJson,
      });

      if (scoreError) {
        console.error('Error saving alignment score:', scoreError);
      }

      // Save attention zones
      if (result.zones_attention && Array.isArray(result.zones_attention)) {
        const zonesToInsert = result.zones_attention.map((zone: any) => ({
          user_id: user.id,
          idea_id: ideaId,
          label: zone.titre || zone.message || "Zone d'attention",
          severity: zone.niveau === "critique" ? 3 : 2,
          recommendation: zone.raison || zone.impact || "",
        }));

        const { error: zonesError } = await supabase
          .from("attention_zones")
          .insert(zonesToInsert);
        
        if (zonesError) {
          console.error('Error saving zones:', zonesError);
        }
      }

      // Save micro-engagements
      if (result.micro_engagements && Array.isArray(result.micro_engagements)) {
        const commitmentsToInsert = result.micro_engagements.map((engagement: any) => ({
          user_id: user.id,
          idea_id: ideaId,
          text: engagement.action,
          period: "weekly",
          status: "todo",
        }));

        const { error: commitmentsError } = await supabase
          .from("micro_commitments")
          .insert(commitmentsToInsert);
        
        if (commitmentsError) {
          console.error('Error saving commitments:', commitmentsError);
        }
      }

      // Save decision
      if (result.recommandation_finale) {
        const { error: decisionError } = await supabase
          .from("decisions")
          .insert({
            user_id: user.id,
            idea_id: ideaId,
            state: result.recommandation_finale.toUpperCase(),
            rationale: result.explication_alignement || "",
          });
        
        if (decisionError) {
          console.error('Error saving decision:', decisionError);
        }
      }

      // 📊 LOG: Update maturity score in astryd_sessions
      await updateMaturityScore(ideaId, scoreAlignement);

      toast.success("Analyse ultra-personnalisée générée avec succès !");
      return result;
    } catch (error: any) {
      console.error('Error calculating alignment:', error);
      toast.error(`Erreur lors de l'analyse: ${error.message}`);
      throw error;
    } finally {
      setCalculating(false);
    }
  };

  return { calculateAlignment, calculating };
};
