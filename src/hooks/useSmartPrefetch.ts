import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook de préchargement intelligent des données
 * Charge en arrière-plan les données des pages probablement visitées ensuite
 */
export const useSmartPrefetch = (ideaId?: string) => {
  const location = useLocation();
  
  useEffect(() => {
    if (!ideaId) return;

    const prefetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentPath = location.pathname;
      console.log('🚀 Smart prefetch triggered for:', currentPath);

      try {
        // Règles de préchargement selon la page actuelle
        switch (true) {
          case currentPath.includes('/profil-entrepreneurial'):
            // Sur le profil → précharger zones d'attention et micro-actions
            await Promise.all([
              prefetchAttentionZones(user.id, ideaId),
              prefetchMicroActions(user.id, ideaId),
            ]);
            console.log('✅ Prefetched: Zones + Micro-actions');
            break;

          case currentPath.includes('/objectifs-parcours'):
            // Sur objectifs → précharger idée projet et journal
            await Promise.all([
              prefetchIdeaProject(user.id, ideaId),
              prefetchJournalEntries(user.id, ideaId),
            ]);
            console.log('✅ Prefetched: Idée + Journal');
            break;

          case currentPath.includes('/zones-attention'):
            // Sur zones d'attention → précharger micro-actions et journal
            await Promise.all([
              prefetchMicroActions(user.id, ideaId),
              prefetchJournalEntries(user.id, ideaId),
            ]);
            console.log('✅ Prefetched: Micro-actions + Journal');
            break;

          case currentPath.includes('/micro-actions'):
            // Sur micro-actions → précharger journal et historique
            await Promise.all([
              prefetchJournalEntries(user.id, ideaId),
              prefetchMaturityScore(user.id, ideaId),
            ]);
            console.log('✅ Prefetched: Journal + Maturity');
            break;

          case currentPath.includes('/journal'):
            // Sur journal → précharger micro-actions et zones
            await Promise.all([
              prefetchMicroActions(user.id, ideaId),
              prefetchAttentionZones(user.id, ideaId),
            ]);
            console.log('✅ Prefetched: Micro-actions + Zones');
            break;
        }
      } catch (error) {
        console.error('Prefetch error (non-blocking):', error);
      }
    };

    // Délai de 300ms pour ne pas interférer avec le chargement initial
    const timeoutId = setTimeout(prefetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, ideaId]);
};

// Fonctions de préchargement individuelles avec cache check
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getCacheKey = (type: string, userId: string, ideaId: string) => 
  `prefetch_${type}_${userId}_${ideaId}`;

const isCacheValid = (cacheKey: string): boolean => {
  const cached = sessionStorage.getItem(cacheKey);
  if (!cached) return false;
  
  const { timestamp } = JSON.parse(cached);
  return Date.now() - timestamp < CACHE_DURATION;
};

const setCache = (cacheKey: string, data: any) => {
  sessionStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

async function prefetchAttentionZones(userId: string, ideaId: string) {
  const cacheKey = getCacheKey('zones', userId, ideaId);
  if (isCacheValid(cacheKey)) {
    console.log('⚡ Zones already cached');
    return;
  }

  const { data } = await supabase
    .from('attention_zones')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .order('severity', { ascending: false });

  if (data) setCache(cacheKey, data);
}

async function prefetchMicroActions(userId: string, ideaId: string) {
  const cacheKey = getCacheKey('actions', userId, ideaId);
  if (isCacheValid(cacheKey)) {
    console.log('⚡ Actions already cached');
    return;
  }

  const { data } = await supabase
    .from('micro_commitments')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (data) setCache(cacheKey, data);
}

async function prefetchJournalEntries(userId: string, ideaId: string) {
  const cacheKey = getCacheKey('journal', userId, ideaId);
  if (isCacheValid(cacheKey)) {
    console.log('⚡ Journal already cached');
    return;
  }

  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (data) setCache(cacheKey, data);
}

async function prefetchIdeaProject(userId: string, ideaId: string) {
  const cacheKey = getCacheKey('idea', userId, ideaId);
  if (isCacheValid(cacheKey)) {
    console.log('⚡ Idea already cached');
    return;
  }

  const { data } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();

  if (data) setCache(cacheKey, data);
}

async function prefetchMaturityScore(userId: string, ideaId: string) {
  const cacheKey = getCacheKey('maturity', userId, ideaId);
  if (isCacheValid(cacheKey)) {
    console.log('⚡ Maturity already cached');
    return;
  }

  const { data } = await supabase
    .from('maturity_scores')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();

  if (data) setCache(cacheKey, data);
}

/**
 * Hook pour récupérer les données préchargées du cache
 */
export const usePrefetchedData = <T>(type: string, userId: string, ideaId: string): T | null => {
  const cacheKey = getCacheKey(type, userId, ideaId);
  const cached = sessionStorage.getItem(cacheKey);
  
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    sessionStorage.removeItem(cacheKey);
    return null;
  }
  
  return data;
};
