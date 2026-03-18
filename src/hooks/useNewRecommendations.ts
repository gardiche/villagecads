import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook pour détecter s'il y a de nouvelles recommandations non vues
 * Utilisé pour afficher un badge "Nouveau" dans la sidebar
 */
export function useNewRecommendations() {
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const [hasNewActions, setHasNewActions] = useState(false);
  const [hasNewZones, setHasNewZones] = useState(false);

  useEffect(() => {
    const checkNewRecommendations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !ideaId) return;

        // Récupérer la dernière version vue par l'utilisateur
        const lastSeenVersion = parseInt(localStorage.getItem(`astryd_last_seen_version_${ideaId}`) || '1');

        // Vérifier s'il y a des micro-actions avec generation_version > lastSeenVersion
        const { data: newActions } = await supabase
          .from('micro_commitments')
          .select('id')
          .eq('user_id', user.id)
          .eq('idea_id', ideaId)
          .eq('archived', false)
          .gt('generation_version', lastSeenVersion)
          .limit(1);

        // Vérifier s'il y a des zones avec generation_version > lastSeenVersion
        const { data: newZones } = await supabase
          .from('attention_zones')
          .select('id')
          .eq('user_id', user.id)
          .eq('idea_id', ideaId)
          .eq('archived', false)
          .gt('generation_version', lastSeenVersion)
          .limit(1);

        setHasNewActions((newActions?.length || 0) > 0);
        setHasNewZones((newZones?.length || 0) > 0);
      } catch (error) {
        console.error('Error checking new recommendations:', error);
      }
    };

    checkNewRecommendations();

    // Écouter les événements de régénération
    const handleUpdate = () => checkNewRecommendations();
    window.addEventListener('astryd-data-update', handleUpdate);

    return () => window.removeEventListener('astryd-data-update', handleUpdate);
  }, [ideaId]);

  const markAsSeenActions = async () => {
    if (!ideaId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer la dernière generation_version et la sauvegarder
      const { data } = await supabase
        .from('micro_commitments')
        .select('generation_version')
        .eq('user_id', user.id)
        .eq('idea_id', ideaId)
        .order('generation_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data?.generation_version) {
        localStorage.setItem(`astryd_last_seen_version_${ideaId}`, data.generation_version.toString());
        setHasNewActions(false);
      }
    } catch (error) {
      console.error('Error marking actions as seen:', error);
    }
  };

  const markAsSeenZones = async () => {
    if (!ideaId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('attention_zones')
        .select('generation_version')
        .eq('user_id', user.id)
        .eq('idea_id', ideaId)
        .order('generation_version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data?.generation_version) {
        localStorage.setItem(`astryd_last_seen_version_${ideaId}`, data.generation_version.toString());
        setHasNewZones(false);
      }
    } catch (error) {
      console.error('Error marking zones as seen:', error);
    }
  };

  return {
    hasNewActions,
    hasNewZones,
    markAsSeenActions,
    markAsSeenZones
  };
}
