import { useEffect, useState } from 'react';
import { useCompleteResults } from './useCompleteResults';
import { supabase } from '@/integrations/supabase/client';

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export function useJourneyProgress() {
  const { results } = useCompleteResults();
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [newlyCompletedSteps, setNewlyCompletedSteps] = useState<string[]>([]);

  const updateSteps = async () => {
    if (!results) return;

    const defaultSteps: JourneyStep[] = [
      {
        id: 'profile_completed',
        title: 'Profil entrepreneurial complété',
        description: 'Vous avez terminé votre bilan de profil',
        completed: true,
      },
      {
        id: 'idea_defined',
        title: 'Idée à préciser',
        description: 'Renseignez votre idée de projet pour des résultats ultra-ciblés',
        completed: false,
      },
      {
        id: 'objective_validated',
        title: 'Objectif à valider',
        description: 'Validez votre objectif 2-4 semaines',
        completed: false,
      },
      {
        id: 'first_micro_action',
        title: 'Premier pas',
        description: 'Réalisez votre première micro-action',
        completed: false,
      },
      {
        id: 'journal_started',
        title: 'Journal démarré',
        description: 'Commencez à échanger avec votre coach IA',
        completed: false,
      },
      {
        id: 'zones_explored',
        title: 'Zones d\'attention lues',
        description: 'Découvrez vos zones d\'attention',
        completed: false,
      },
    ];
    
    const initialSteps = defaultSteps;

    // ✅ FIX : Charger depuis DB pour utilisateurs authentifiés
    const { data: { user } } = await supabase.auth.getUser();

    // Détecter les actions utilisateur et mettre à jour le statut completed
    const updatedSteps = await Promise.all(initialSteps.map(async (step: JourneyStep) => {
      let isCompleted = step.completed;

      // 1. Profil entrepreneurial complété (toujours completed par défaut)
      if (step.id === 'profile_completed') {
        isCompleted = true;
      }

      // 2. Renseigner votre idée projet (completed si idée existe en DB OU localStorage)
      if (step.id === 'idea_defined') {
        if (user) {
          const { data: ideas } = await supabase
            .from('ideas')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          isCompleted = !!ideas && ideas.length > 0;
        } else {
          const storedIdea = localStorage.getItem('ASTRYD_IDEA_DATA');
          isCompleted = !!storedIdea;
        }
      }

      // 3. Valider votre objectif (completed si validation explicite en localStorage)
      if (step.id === 'objective_validated') {
        const objectiveValidated = localStorage.getItem('objective_validated');
        isCompleted = objectiveValidated === 'true';
      }

      // 4. Réaliser votre première micro-action (completed si au moins 1 micro-action cochée)
      if (step.id === 'first_micro_action') {
        if (user) {
          const { data: actions } = await supabase
            .from('micro_commitments')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'done')
            .limit(1);
          isCompleted = !!actions && actions.length > 0;
        } else {
          const microActions = results.micro_actions || [];
          const hasCompletedAction = microActions.some(
            (action: any) => action.status === 'done' || action.status === 'completed'
          );
          isCompleted = hasCompletedAction;
        }
      }

      // 5. Démarrer votre journal entrepreneurial (completed si au moins 1 entrée journal)
      if (step.id === 'journal_started') {
        if (user) {
          const { data: entries } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('sender', 'user')
            .limit(1);
          isCompleted = !!entries && entries.length > 0;
        } else {
          const journalEntries = localStorage.getItem('ASTRYD_JOURNAL_ENTRIES');
          const entries = journalEntries ? JSON.parse(journalEntries) : [];
          isCompleted = entries.length > 0;
        }
      }

      // 6. Explorer vos zones d'attention (completed si page visitée - même après auth)
      if (step.id === 'zones_explored') {
        // Toujours vérifier la visite de la page, pas l'existence des zones
        const zonesVisited = localStorage.getItem('ASTRYD_ZONES_VISITED');
        isCompleted = zonesVisited === 'true';
      }

      return {
        ...step,
        completed: isCompleted,
      };
    }));

    // Détecter les nouvelles étapes complétées (pour déclencher confettis)
    const previouslyCelebrated = JSON.parse(
      localStorage.getItem('ASTRYD_CELEBRATED_STEPS') || '[]'
    ) as string[];

    const newlyCompleted = updatedSteps
      .filter((step: JourneyStep) => 
        step.completed && 
        step.id !== 'profile_completed' && // Ne pas célébrer le profil (toujours completed)
        !previouslyCelebrated.includes(step.id)
      )
      .map((step: JourneyStep) => step.id);

    if (newlyCompleted.length > 0) {
      setNewlyCompletedSteps(newlyCompleted);
      // ⚠️ NE PAS marquer comme célébrées ici - c'est fait dans clearNewlyCompleted après l'animation
    }

    // Sauvegarder les étapes mises à jour
    localStorage.setItem('ASTRYD_JOURNEY_STEPS', JSON.stringify(updatedSteps));
    setSteps(updatedSteps);
  };

  useEffect(() => {
    updateSteps();

    // Écouter l'événement de mise à jour pour rafraîchir automatiquement
    const handleDataUpdate = () => {
      updateSteps();
    };

    window.addEventListener('astryd-data-update', handleDataUpdate);

    return () => {
      window.removeEventListener('astryd-data-update', handleDataUpdate);
    };
  }, [results]);

  const clearNewlyCompleted = () => {
    // Marquer comme célébrées APRÈS l'animation
    if (newlyCompletedSteps.length > 0) {
      const previouslyCelebrated = JSON.parse(
        localStorage.getItem('ASTRYD_CELEBRATED_STEPS') || '[]'
      ) as string[];
      const updatedCelebrated = [...previouslyCelebrated, ...newlyCompletedSteps];
      localStorage.setItem('ASTRYD_CELEBRATED_STEPS', JSON.stringify(updatedCelebrated));
    }
    setNewlyCompletedSteps([]);
  };

  return {
    steps,
    newlyCompletedSteps,
    clearNewlyCompleted,
  };
}
