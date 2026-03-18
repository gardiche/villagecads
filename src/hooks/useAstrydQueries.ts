import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Query keys pour le cache
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  idea: (ideaId: string) => ['idea', ideaId] as const,
  attentionZones: (ideaId: string, userId: string) => ['attention-zones', ideaId, userId] as const,
  microActions: (ideaId: string, userId: string) => ['micro-actions', ideaId, userId] as const,
  journalEntries: (ideaId: string, userId: string) => ['journal-entries', ideaId, userId] as const,
  alignmentScore: (ideaId: string, userId: string) => ['alignment-score', ideaId, userId] as const,
  maturityScore: (ideaId: string, userId: string) => ['maturity-score', ideaId, userId] as const,
  guestResults: () => ['guest-results'] as const,
};

// Hook pour charger le profil entrepreneurial
export function useProfileQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.profile(userId || ''),
    queryFn: async () => {
      if (!userId) {
        // Mode invité : charger depuis localStorage
        const guestStr = sessionStorage.getItem('astryd_guest_results');
        if (guestStr) {
          return JSON.parse(guestStr);
        }
        return null;
      }

      const { data: session } = await supabase
        .from('astryd_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return session;
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes pour le profil
  });
}

// Hook pour charger une idée
export function useIdeaQuery(ideaId: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.idea(ideaId || ''),
    queryFn: async () => {
      if (!ideaId || !userId) return null;

      const { data } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .maybeSingle();

      return data;
    },
    enabled: !!ideaId && !!userId,
  });
}

// Hook pour charger les zones d'attention
export function useAttentionZonesQuery(ideaId: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.attentionZones(ideaId || '', userId || ''),
    queryFn: async () => {
      if (!userId) {
        // Mode invité : charger depuis localStorage
        const guestStr = sessionStorage.getItem('astryd_guest_results');
        console.log('🔍 Loading zones for guest:', { hasData: !!guestStr });
        if (guestStr) {
          const guest = JSON.parse(guestStr);
          const rawZones = guest.personaData?.zones_attention || [];
          console.log('✅ Found zones for guest:', {
            count: rawZones.length,
            sample: rawZones[0] || null,
            personaKeys: guest.personaData ? Object.keys(guest.personaData) : [],
          });
          return rawZones.map((z: any, index: number) => ({
            id: z.id || `guest-zone-${index}`,
            label: z.label || z.titre || "Zone d'attention",
            recommendation: z.recommendation || '',
            severity: z.severity ?? 2,
          }));
        }
        console.warn('⚠️ No guest results in sessionStorage for zones_attention');
        return [];
      }

      if (!ideaId) {
        // Utilisateur connecté sans idée : charger depuis session
        const { data: session } = await supabase
          .from('astryd_sessions')
          .select('attention_zones')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const rawZones = (session?.attention_zones || []) as any[];
        return rawZones.map((z, index) => ({
          id: z.id || `session-zone-${index}`,
          label: z.label || z.titre || 'Zone d\'attention',
          recommendation: z.recommendation || '',
          severity: z.severity ?? 2,
        }));
      }

      // Cas normal : zones en base
      const { data, error } = await supabase
        .from('attention_zones')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .order('severity', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }

      // Fallback session
      const { data: session } = await supabase
        .from('astryd_sessions')
        .select('attention_zones')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const rawZones = (session?.attention_zones || []) as any[];
      return rawZones.map((z, index) => ({
        id: z.id || `session-zone-${index}`,
        label: z.label || z.titre || 'Zone d\'attention',
        recommendation: z.recommendation || '',
        severity: z.severity ?? 2,
      }));
    },
    enabled: true,
  });
}

// Hook pour charger les micro-actions
export function useMicroActionsQuery(ideaId: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.microActions(ideaId || '', userId || ''),
    queryFn: async () => {
      if (!userId) {
        // Mode invité
        const ideaAction = {
          id: 'guest-idea-action',
          text: 'Renseignez votre idée de projet pour personnaliser vos micro-actions',
          duree: '5-10 minutes',
          status: 'todo',
          impact_attendu: 'Obtenir des micro-actions adaptées à votre projet spécifique et un accompagnement sur-mesure.',
          objectif: 'Affiner votre parcours',
          jauge_ciblee: null,
          period: 'once',
        };

        const guestStr = sessionStorage.getItem('astryd_guest_results');
        console.log('🔍 Loading micro-actions for guest:', { hasData: !!guestStr });
        if (guestStr) {
          const guest = JSON.parse(guestStr);
          const guestActions = (guest.personaData?.micro_actions || []).map((a: any, index: number) => ({
            id: a.id || `guest-action-${index}`,
            text: a.titre || a.text || 'Micro-action',
            duree: a.duree || null,
            status: 'todo',
            impact_attendu: a.impact || a.impact_attendu || null,
            objectif: a.objectif || null,
            jauge_ciblee: a.jauge_ciblee || null,
            period: a.period || 'once',
          }));
          console.log('✅ Found micro-actions for guest:', {
            count: guestActions.length,
            sample: guestActions[0] || null,
            personaKeys: guest.personaData ? Object.keys(guest.personaData) : [],
          });
          return [ideaAction, ...guestActions];
        }
        console.warn('⚠️ No guest results in sessionStorage for micro-actions');
        return [ideaAction];
      }

      if (!ideaId) {
        // Utilisateur connecté sans idée
        const { data: session } = await supabase
          .from('astryd_sessions')
          .select('micro_actions')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const rawActions = (session?.micro_actions || []) as any[];
        return rawActions.map((a, index) => ({
          id: a.id || `session-action-${index}`,
          text: a.titre || a.text || 'Micro-action',
          duree: a.duree || null,
          status: a.status || 'todo',
          impact_attendu: a.impact || a.impact_attendu || null,
          objectif: a.objectif || null,
          jauge_ciblee: a.jauge_ciblee || null,
          period: a.period || 'once',
        }));
      }

      // Cas normal
      const { data, error } = await supabase
        .from('micro_commitments')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }

      // Fallback session
      const { data: session } = await supabase
        .from('astryd_sessions')
        .select('micro_actions')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const rawActions = (session?.micro_actions || []) as any[];
      return rawActions.map((a, index) => ({
        id: a.id || `session-action-${index}`,
        text: a.titre || a.text || 'Micro-action',
        duree: a.duree || null,
        status: a.status || 'todo',
        impact_attendu: a.impact || a.impact_attendu || null,
        objectif: a.objectif || null,
        jauge_ciblee: a.jauge_ciblee || null,
        period: a.period || 'once',
      }));
    },
    enabled: true,
  });
}

// Hook pour charger les entrées journal
export function useJournalEntriesQuery(ideaId: string | null, userId: string | null) {
  return useQuery({
    queryKey: queryKeys.journalEntries(ideaId || '', userId || ''),
    queryFn: async () => {
      if (!userId || !ideaId) return [];

      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      return data || [];
    },
    enabled: !!userId && !!ideaId,
  });
}

// Mutation pour cocher/décocher une micro-action
export function useToggleMicroActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, newStatus }: { actionId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('micro_commitments')
        .update({ status: newStatus })
        .eq('id', actionId);

      if (error) throw error;
      return { actionId, newStatus };
    },
    onSuccess: (_, variables) => {
      // Invalider les queries liées pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['micro-actions'] });
      queryClient.invalidateQueries({ queryKey: ['maturity-score'] });
    },
  });
}

// Hook pour précharger intelligemment les données liées
export function usePrefetchRelatedData(ideaId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  const prefetchAll = async () => {
    if (!userId) return;

    const prefetchPromises = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.attentionZones(ideaId || '', userId),
        queryFn: async () => {
          // La logique est dans useAttentionZonesQuery
          return [];
        },
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.microActions(ideaId || '', userId),
        queryFn: async () => {
          return [];
        },
      }),
    ];

    if (ideaId) {
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.idea(ideaId),
          queryFn: async () => {
            return null;
          },
        })
      );
    }

    await Promise.all(prefetchPromises);
  };

  return { prefetchAll };
}
