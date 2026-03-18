import { supabase } from "@/integrations/supabase/client";

interface GuestOnboardingData {
  equilibreValues: Record<string, number>;
  motivations: string[];
  scenarioAnswers: Record<number, string>;
  environnement: Record<string, number>;
  champsLibre: string;
  timestamp: number;
  riasecValues?: {
    realiste: number;
    investigateur: number;
    artistique: number;
    social: number;
    entreprenant: number;
    conventionnel: number;
  };
  cvContent?: string;
  // 🆕 Context First migration
  situationPro?: string;
  tempsConsacre?: string;
  experienceEntrepreneuriale?: string;
}

interface CompleteResults {
  personaData?: {
    titre: string;
    synthese: string;
    cap2_4semaines: string;
    forces: string[];
    verrous: string[];
    visualUrl?: string;
  };
  zones_attention?: Array<{
    id: string;
    label: string;
    recommendation: string;
    severity: number;
  }>;
  micro_actions?: Array<{
    id: string;
    text: string;
    duree: string | null;
    status: string;
    impact_attendu: string | null;
    objectif: string | null;
    jauge_ciblee: string | null;
    period: string;
  }>;
  parcours?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
  generatedAt: string;
}

/**
 * Hook pour synchroniser automatiquement les données localStorage → base de données
 * Appelé après signup/signin pour transférer les données visiteur vers compte authentifié
 */
export const useSyncGuestData = () => {
  
  /**
   * Synchronise toutes les données du localStorage vers la base de données
   * Retourne true si des données ont été transférées, false sinon
   */
  const syncGuestData = async (userId: string): Promise<boolean> => {
    console.log('🔄 Starting guest data sync for user:', userId);
    
    try {
      // 1. Récupérer les données du localStorage
      const onboardingDataStr = sessionStorage.getItem('astryd_onboarding_data');
      const completeResultsStr = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
      const ideaDataStr = localStorage.getItem('ASTRYD_IDEA_DATA');
      
      if (!onboardingDataStr && !completeResultsStr) {
        console.log('ℹ️ No guest data to sync');
        return false;
      }

      let onboardingData: GuestOnboardingData | null = null;
      let completeResults: CompleteResults | null = null;
      let ideaData: any = null;

      try {
        if (onboardingDataStr) onboardingData = JSON.parse(onboardingDataStr);
        if (completeResultsStr) completeResults = JSON.parse(completeResultsStr);
        if (ideaDataStr) ideaData = JSON.parse(ideaDataStr);
      } catch (e) {
        console.error('❌ Error parsing localStorage data:', e);
        return false;
      }

      // 2. Créer ou récupérer user_assessment
      let assessmentId: string;
      const { data: existingAssessment } = await supabase
        .from('user_assessments')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingAssessment) {
        assessmentId = existingAssessment.id;
        console.log('✅ Using existing assessment:', assessmentId);
      } else {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from('user_assessments')
          .insert({
            user_id: userId,
            completed: true,
          })
          .select('id')
          .single();

        if (assessmentError) throw assessmentError;
        assessmentId = newAssessment.id;
        console.log('✅ Created new assessment:', assessmentId);
      }

      // 3. Sauvegarder les données du questionnaire si disponibles
      if (onboardingData) {
        await syncQuestionnaireData(assessmentId, onboardingData);
      }

      // 4. Créer ou mettre à jour l'idée si disponible
      let savedIdeaId: string | null = null;
      if (ideaData) {
        savedIdeaId = await syncIdeaData(userId, ideaData);
      }

      // 5. Sauvegarder les résultats complets (persona, zones, micro-actions)
      if (completeResults && completeResults.personaData) {
        await syncCompleteResults(userId, assessmentId, savedIdeaId, completeResults);
      }

      // 6. Nettoyer le localStorage après transfert réussi
      cleanupLocalStorage();

      console.log('✅ Guest data sync completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Error syncing guest data:', error);
      // Ne pas nettoyer le localStorage en cas d'erreur pour permettre un retry
      return false;
    }
  };

  /**
   * Sauvegarde les données du questionnaire (Schwartz, Big Five, Life Spheres, RIASEC, etc.)
   */
  const syncQuestionnaireData = async (
    assessmentId: string,
    data: GuestOnboardingData
  ) => {
    console.log('📝 Syncing questionnaire data...');

    // Sauvegarder life_spheres
    if (data.equilibreValues) {
      await supabase.from('life_spheres').upsert({
        assessment_id: assessmentId,
        soi: data.equilibreValues.sante || 0,
        couple: data.equilibreValues.couple || 0,
        famille: data.equilibreValues.famille || 0,
        amis: data.equilibreValues.soutien || 0,
        loisirs: data.equilibreValues.loisirs || 0,
        pro: data.equilibreValues.pro || 0,
      });
    }

    // Sauvegarder user_context (incluant situationPro et tempsConsacre)
    if (data.environnement || data.champsLibre || data.situationPro || data.tempsConsacre) {
      await supabase.from('user_context').upsert({
        assessment_id: assessmentId,
        reseau_professionnel: data.environnement?.reseau?.toString() || null,
        // 🆕 Context First: situationPro et tempsConsacre sauvegardés correctement
        situation_pro: data.situationPro || null,
        temps_disponible: data.tempsConsacre || null,
        experience_entrepreneuriat: data.experienceEntrepreneuriale || null,
        charge_mentale: data.champsLibre || null,
      });
      console.log('✅ User context synced (situationPro:', data.situationPro, ', tempsConsacre:', data.tempsConsacre, ')');
    }

    // ✅ Sauvegarder les scores RIASEC
    if (data.riasecValues) {
      const { error: riasecError } = await supabase.from('riasec_scores').upsert({
        assessment_id: assessmentId,
        realiste: data.riasecValues.realiste || 50,
        investigateur: data.riasecValues.investigateur || 50,
        artistique: data.riasecValues.artistique || 50,
        social: data.riasecValues.social || 50,
        entreprenant: data.riasecValues.entreprenant || 50,
        conventionnel: data.riasecValues.conventionnel || 50,
      });
      
      if (riasecError) {
        console.error('❌ Error syncing RIASEC scores:', riasecError);
      } else {
        console.log('✅ RIASEC scores synced');
      }
    }

    // ✅ Sauvegarder le CV / compétences dans user_learning_profiles
    if (data.cvContent && data.cvContent.trim()) {
      const { error: cvError } = await supabase.from('user_learning_profiles').upsert({
        assessment_id: assessmentId,
        cv_uploaded: true,
        cv_analyzed: true,
        cv_insights: {
          cv_text: data.cvContent,
          synced_at: new Date().toISOString(),
        },
      });
      
      if (cvError) {
        console.error('❌ Error syncing CV content:', cvError);
      } else {
        console.log('✅ CV content synced to user_learning_profiles');
      }
    }

    console.log('✅ Questionnaire data synced');
  };

  /**
   * Sauvegarde ou met à jour l'idée de projet
   */
  const syncIdeaData = async (userId: string, ideaData: any): Promise<string | null> => {
    console.log('💡 Syncing idea data...');

    try {
      // Vérifier si l'utilisateur a déjà une idée
      const { data: existingIdea } = await supabase
        .from('ideas')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingIdea) {
        // Mettre à jour l'idée existante
        const { data: updatedIdea, error } = await supabase
          .from('ideas')
          .update({
            title: ideaData.title,
            description: ideaData.description || '',
          })
          .eq('id', existingIdea.id)
          .select('id')
          .single();

        if (error) throw error;
        console.log('✅ Idea updated:', updatedIdea.id);
        return updatedIdea.id;
      } else {
        // Créer nouvelle idée
        const { data: newIdea, error } = await supabase
          .from('ideas')
          .insert({
            user_id: userId,
            title: ideaData.title,
            description: ideaData.description || '',
          })
          .select('id')
          .single();

        if (error) throw error;
        console.log('✅ Idea created:', newIdea.id);
        return newIdea.id;
      }
    } catch (error) {
      console.error('❌ Error syncing idea:', error);
      return null;
    }
  };

  /**
   * Sauvegarde les résultats complets (persona, zones d'attention, micro-actions)
   */
  const syncCompleteResults = async (
    userId: string,
    assessmentId: string,
    ideaId: string | null,
    results: CompleteResults
  ) => {
    console.log('📊 Syncing complete results...');

    // Sauvegarder les zones d'attention si disponibles (avec statut archived/resolved)
    if (results.zones_attention && results.zones_attention.length > 0 && ideaId) {
      for (const zone of results.zones_attention) {
        await supabase.from('attention_zones').upsert({
          user_id: userId,
          idea_id: ideaId,
          label: zone.label,
          recommendation: zone.recommendation,
          severity: zone.severity,
          // ✅ CORRECTION : Préserver le statut archived/resolved pour l'historique
          archived: (zone as any).archived || false,
          archived_at: (zone as any).archived_at || null,
          // Résolution préservée pour les zones levées par le guest
          // Note: le champ resolved n'existe pas dans attention_zones, on utilise archived
        });
      }
      console.log(`✅ ${results.zones_attention.length} attention zones synced (including archived)`);
    }

    // Sauvegarder les micro-actions si disponibles (avec statut archived)
    if (results.micro_actions && results.micro_actions.length > 0 && ideaId) {
      for (const action of results.micro_actions) {
        await supabase.from('micro_commitments').insert({
          user_id: userId,
          idea_id: ideaId,
          text: action.text,
          duree: action.duree,
          status: action.status || 'todo',
          impact_attendu: action.impact_attendu,
          objectif: action.objectif,
          jauge_ciblee: action.jauge_ciblee,
          period: action.period || 'weekly',
          // ✅ CORRECTION : Préserver le statut archived pour l'historique complet
          archived: (action as any).archived || false,
          archived_at: (action as any).archived_at || null,
        });
      }
      console.log(`✅ ${results.micro_actions.length} micro-actions synced (including completed/archived)`);
    }

    console.log('✅ Complete results synced');
  };

  /**
   * Nettoie le localStorage après transfert réussi
   * ⚠️ NE PAS SUPPRIMER ASTRYD_COMPLETE_RESULTS immédiatement car les pages en ont besoin
   * pour afficher les données le temps que la navigation récupère l'ideaId
   */
  const cleanupLocalStorage = () => {
    const keysToRemove = [
      'astryd_onboarding_data',
      // 'ASTRYD_COMPLETE_RESULTS', // ❌ NE PAS SUPPRIMER - nécessaire pour affichage initial
      'astryd_guest_results',
      // 'astryd_persona_data', // ❌ NE PAS SUPPRIMER - nécessaire pour le profil
      'astryd_onboarding_draft_new',
      'astryd_onboarding_idea_draft',
    ];

    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key); // Also clean localStorage for legacy data
    });

    console.log('🧹 sessionStorage/localStorage partially cleaned after sync (keeping display data)');
  };

  return {
    syncGuestData,
  };
};
