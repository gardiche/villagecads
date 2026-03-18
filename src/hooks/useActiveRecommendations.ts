import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

interface MicroAction {
  id: string;
  text: string;
  status: string;
  duree?: string;
  objectif?: string;
  impact_attendu?: string;
  conseil_pratique?: string;
  jauge_ciblee?: string;
  period?: string;
  archived: boolean;
  generation_version?: number;
  created_at: string;
}

interface AttentionZone {
  id: string;
  label: string;
  severity: number;
  recommendation?: string;
  impact_concret?: string;
  resolved?: boolean;
  archived: boolean;
  generation_version?: number;
  created_at: string;
}

/**
 * Hook pour charger les recommandations ACTIVES (non-archivées) depuis la DB
 * Exclut automatiquement les items archived=true pour afficher uniquement le dashboard actif
 */
export const useActiveRecommendations = () => {
  const [searchParams] = useSearchParams();
  const urlIdeaId = searchParams.get("ideaId") || undefined;
  
  const [microActions, setMicroActions] = useState<MicroAction[]>([]);
  const [attentionZones, setAttentionZones] = useState<AttentionZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFromDatabase, setIsFromDatabase] = useState(false); // ✅ NEW: track data source
  const [resolvedIdeaId, setResolvedIdeaId] = useState<string | undefined>(urlIdeaId);

  const loadActiveRecommendations = async () => {
    console.log('🔄 Loading active recommendations...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('👤 No user - using localStorage');
        setIsAuthenticated(false);
        setIsFromDatabase(false);
        const stored = localStorage.getItem("ASTRYD_COMPLETE_RESULTS");
        if (stored) {
          const parsed = JSON.parse(stored);
          setMicroActions(parsed.micro_actions || []);
          setAttentionZones(parsed.zones_attention || []);
        }
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
      console.log('👤 User authenticated:', user.id);

      // Auto-récupérer l'ideaId si non présent dans l'URL
      let ideaId = urlIdeaId;
      if (!ideaId) {
        const { data: latestIdea } = await supabase
          .from('ideas')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (latestIdea?.id) {
          ideaId = latestIdea.id;
          setResolvedIdeaId(ideaId);
          console.log('💡 Found idea:', ideaId);
        }
      }

      if (!ideaId) {
        console.log('⚠️ No idea found - using localStorage');
        setIsFromDatabase(false);
        const stored = localStorage.getItem("ASTRYD_COMPLETE_RESULTS");
        if (stored) {
          const parsed = JSON.parse(stored);
          setMicroActions(parsed.micro_actions || []);
          setAttentionZones(parsed.zones_attention || []);
        }
        setIsLoading(false);
        return;
      }

      // Charger depuis la DB - micro_actions filtrées non-archivées, zones_attention TOUTES (pour afficher complétées)
      const [actionsRes, zonesRes] = await Promise.all([
        supabase
          .from('micro_commitments')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('attention_zones')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', user.id)
          // ✅ Ne pas filtrer archived pour zones - on veut voir les résolues
          .order('created_at', { ascending: false })
      ]);

      if (actionsRes.error) throw actionsRes.error;
      if (zonesRes.error) throw zonesRes.error;

      console.log('📊 DB data loaded:', {
        actions: actionsRes.data?.length || 0,
        zones: zonesRes.data?.length || 0
      });

      // Déduplication par label/text
      const uniqueActions = Array.from(
        new Map((actionsRes.data || []).map(item => [item.text, item])).values()
      );
      const uniqueZones = Array.from(
        new Map((zonesRes.data || []).map(item => [item.label, { ...item, resolved: item.archived }])).values()
      );

      setMicroActions(uniqueActions);
      setAttentionZones(uniqueZones);
      setIsFromDatabase(true);
      console.log('✅ isFromDatabase set to TRUE');
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error loading active recommendations:', error);
      setIsFromDatabase(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveRecommendations();

    // Écouter les mises à jour pour recharger
    const handleUpdate = () => loadActiveRecommendations();
    window.addEventListener('astryd-data-update', handleUpdate);
    return () => window.removeEventListener('astryd-data-update', handleUpdate);
  }, [urlIdeaId]);

  return {
    microActions,
    attentionZones,
    isLoading,
    isAuthenticated,
    isFromDatabase, // ✅ NEW: expose data source
    ideaId: resolvedIdeaId,
    reload: loadActiveRecommendations
  };
};
