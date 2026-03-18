import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CACHE_KEYS = {
  idea: (ideaId: string) => ["idea", ideaId],
  alignmentScores: (ideaId: string) => ["alignmentScores", ideaId],
  attentionZones: (ideaId: string) => ["attentionZones", ideaId],
  microCommitments: (ideaId: string) => ["microCommitments", ideaId],
  journalEntries: (ideaId: string) => ["journalEntries", ideaId],
  ideaDocuments: (ideaId: string) => ["ideaDocuments", ideaId],
  maturityScore: (ideaId: string) => ["maturityScore", ideaId],
  allIdeas: (userId: string) => ["allIdeas", userId],
} as const;

// Configuration du cache - 5 minutes pour les données fréquentes
const CACHE_TIME = 5 * 60 * 1000;
const STALE_TIME = 2 * 60 * 1000;

export const useDashboardCache = (ideaId: string | null, userId: string | null) => {
  const queryClient = useQueryClient();

  // Cache pour l'idée principale
  const ideaQuery = useQuery({
    queryKey: CACHE_KEYS.idea(ideaId || ""),
    queryFn: async () => {
      if (!ideaId || !userId) return null;
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!ideaId && !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Configuration du cache - optimisé pour préchargement
  const alignmentScoresQuery = useQuery({
    queryKey: CACHE_KEYS.alignmentScores(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("alignment_scores")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    // Précharger en arrière-plan pour accélérer l'affichage
    refetchOnMount: "always",
  });

  // Cache pour les zones d'attention
  const attentionZonesQuery = useQuery({
    queryKey: CACHE_KEYS.attentionZones(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("attention_zones")
        .select("*")
        .eq("idea_id", ideaId)
        .order("severity", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Cache pour les micro-engagements
  const microCommitmentsQuery = useQuery({
    queryKey: CACHE_KEYS.microCommitments(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("micro_commitments")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Cache pour les entrées de journal
  const journalEntriesQuery = useQuery({
    queryKey: CACHE_KEYS.journalEntries(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("idea_id", ideaId)
        .not("sender", "is", null)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Cache pour les documents
  const ideaDocumentsQuery = useQuery({
    queryKey: CACHE_KEYS.ideaDocuments(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return [];
      const { data, error } = await supabase
        .from("idea_documents")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Cache pour le score de maturité
  const maturityScoreQuery = useQuery({
    queryKey: CACHE_KEYS.maturityScore(ideaId || ""),
    queryFn: async () => {
      if (!ideaId) return null;
      const { data, error } = await supabase
        .from("maturity_scores")
        .select("score")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data?.score || null;
    },
    enabled: !!ideaId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Cache pour toutes les idées de l'utilisateur
  const allIdeasQuery = useQuery({
    queryKey: CACHE_KEYS.allIdeas(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  // Fonction pour invalider tout le cache d'une idée
  const invalidateIdeaCache = async (targetIdeaId?: string) => {
    const id = targetIdeaId || ideaId;
    if (!id) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.idea(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.alignmentScores(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.attentionZones(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.microCommitments(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.journalEntries(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideaDocuments(id) }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.maturityScore(id) }),
    ]);
  };

  // Fonction pour précharger les données d'une idée (incluant explications jauges)
  const prefetchIdeaData = async (targetIdeaId: string, targetUserId: string) => {
    await Promise.all([
      // Précharger l'idée principale
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.idea(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("ideas")
            .select("*")
            .eq("id", targetIdeaId)
            .eq("user_id", targetUserId)
            .maybeSingle();
          return data;
        },
      }),
      // Précharger les scores d'alignement avec explications jauges
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.alignmentScores(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("alignment_scores")
            .select("*")
            .eq("idea_id", targetIdeaId)
            .order("created_at", { ascending: true });
          return data || [];
        },
      }),
      // Précharger les zones d'attention
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.attentionZones(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("attention_zones")
            .select("*")
            .eq("idea_id", targetIdeaId)
            .order("severity", { ascending: false });
          return data || [];
        },
      }),
      // Précharger les micro-commitments
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.microCommitments(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("micro_commitments")
            .select("*")
            .eq("idea_id", targetIdeaId)
            .order("created_at", { ascending: false });
          return data || [];
        },
      }),
      // Précharger les documents
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.ideaDocuments(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("idea_documents")
            .select("*")
            .eq("idea_id", targetIdeaId)
            .order("created_at", { ascending: false });
          return data || [];
        },
      }),
      // Précharger le score de maturité
      queryClient.prefetchQuery({
        queryKey: CACHE_KEYS.maturityScore(targetIdeaId),
        queryFn: async () => {
          const { data } = await supabase
            .from("maturity_scores")
            .select("score")
            .eq("idea_id", targetIdeaId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          return data?.score || null;
        },
      }),
    ]);
  };

  return {
    // Données du cache
    idea: ideaQuery.data,
    alignmentScores: alignmentScoresQuery.data || [],
    attentionZones: attentionZonesQuery.data || [],
    microCommitments: microCommitmentsQuery.data || [],
    journalEntries: journalEntriesQuery.data || [],
    ideaDocuments: ideaDocumentsQuery.data || [],
    maturityScore: maturityScoreQuery.data,
    allIdeas: allIdeasQuery.data || [],
    
    // États de chargement
    isLoading: ideaQuery.isLoading || alignmentScoresQuery.isLoading,
    isRefetching: ideaQuery.isRefetching || alignmentScoresQuery.isRefetching,
    
    // Fonctions utilitaires
    invalidateIdeaCache,
    prefetchIdeaData,
    
    // Fonction pour rafraîchir toutes les données
    refetchAll: async () => {
      await Promise.all([
        ideaQuery.refetch(),
        alignmentScoresQuery.refetch(),
        attentionZonesQuery.refetch(),
        microCommitmentsQuery.refetch(),
        journalEntriesQuery.refetch(),
        ideaDocumentsQuery.refetch(),
        maturityScoreQuery.refetch(),
        allIdeasQuery.refetch(),
      ]);
    },
  };
};
