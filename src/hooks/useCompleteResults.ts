import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface CompleteResults {
  personaData: {
    titre: string;
    synthese: string;
    cap2_4semaines: string;
    forces: string[];
    verrous: string[];
    visualUrl: string;
  };
  zones_attention: Array<{
    id: string;
    label: string;
    recommendation: string;
    severity: number;
  }>;
  micro_actions: Array<{
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
  isPartial?: boolean;
}

/**
 * Hook centralisé pour lire les résultats complets depuis localStorage.
 * Si les données sont absentes, redirige automatiquement vers /onboarding.
 */
export function useCompleteResults() {
  const [results, setResults] = useState<CompleteResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const storedData = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
        
        console.log('🔍 ===== CHARGEMENT RÉSULTATS =====');
        console.log('🔍 storedData existe:', !!storedData);
        console.log('🔍 storedData length:', storedData?.length || 0);
        
        // Si données en localStorage, les charger directement
        if (storedData) {
          const parsed = JSON.parse(storedData) as CompleteResults & { isPartial?: boolean };
          
          console.log('🔍 parsed:', parsed);
          console.log('🔍 parsed.personaData:', parsed.personaData);
          console.log('🔍 parsed.personaData.titre:', parsed.personaData?.titre);
          
          // Validation basique (au moins le profil doit être présent)
          if (!parsed.personaData) {
            console.error('❌ Profil manquant dans ASTRYD_COMPLETE_RESULTS');
            // Ne pas rediriger tout de suite, essayer de charger depuis DB
          } else {
            // 🚀 CACHE RENFORCÉ : Vérifier la fraîcheur des données (5 min = affichage instantané)
            const generatedAt = new Date(parsed.generatedAt).getTime();
            const now = Date.now();
            const ageMinutes = (now - generatedAt) / 1000 / 60;
            
            if (ageMinutes < 5) {
              console.log(`⚡ CACHE HIT : Données fraîches (${Math.round(ageMinutes)} min)`);
            } else {
              console.log(`📦 Données chargées (${Math.round(ageMinutes)} min d'ancienneté)`);
            }

            console.log('✅ Résultats chargés depuis localStorage:', {
              hasPersona: !!parsed.personaData,
              zonesCount: parsed.zones_attention?.length || 0,
              actionsCount: parsed.micro_actions?.length || 0,
              isPartial: parsed.isPartial || false,
              cacheAge: `${Math.round(ageMinutes)}min`,
            });

            setResults(parsed);
            setIsLoading(false);
            return;
          }
        }
        
        // Si pas de données localStorage, vérifier si utilisateur authentifié et charger depuis DB
        console.log('🔍 Pas de données localStorage, vérification base de données...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('⚠️ Aucun utilisateur connecté. Redirection vers onboarding.');
          navigate('/onboarding', { replace: true });
          return;
        }
        
        console.log('🔍 Utilisateur connecté, chargement depuis DB:', user.id);
        
        // Charger le profil depuis user_assessments
        const { data: assessment } = await supabase
          .from('user_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true)
          .maybeSingle();
        
        if (!assessment) {
          console.warn('⚠️ Aucun assessment complété trouvé. Redirection vers onboarding.');
          navigate('/onboarding', { replace: true });
          return;
        }
        
        console.log('✅ Assessment trouvé en DB, reconstruction des résultats depuis la base de données...');
        
        // 1. Charger le persona depuis persona_cache
        const cacheKey = `persona_${user.id}`;
        const { data: personaCache } = await supabase
          .from('persona_cache')
          .select('persona_data')
          .eq('cache_key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!personaCache?.persona_data) {
          console.warn('⚠️ Aucun persona en cache. Lancement de la régénération automatique...');
          
          // Charger les données du questionnaire pour régénérer le persona
          const { data: schwartz } = await supabase
            .from('schwartz_values')
            .select('*')
            .eq('assessment_id', assessment.id)
            .maybeSingle();
          
          const { data: bigFive } = await supabase
            .from('big_five_traits')
            .select('*')
            .eq('assessment_id', assessment.id)
            .maybeSingle();
          
          const { data: riasec } = await supabase
            .from('riasec_scores')
            .select('*')
            .eq('assessment_id', assessment.id)
            .maybeSingle();
          
          const { data: lifeSpheres } = await supabase
            .from('life_spheres')
            .select('*')
            .eq('assessment_id', assessment.id)
            .maybeSingle();
          
          const { data: userContext } = await supabase
            .from('user_context')
            .select('*')
            .eq('assessment_id', assessment.id)
            .maybeSingle();
          
          // 🔧 Transformer les données DB en format attendu par generate-persona-profile
          const equilibreValues = {
            energie: 70, // Valeur par défaut si pas de life_spheres
            sante: 70,
            temps: 50,
            finances: 70,
            soutien: 60,
            famille: lifeSpheres?.famille || 50,
            couple: lifeSpheres?.couple || 50,
            loisirs: lifeSpheres?.loisirs || 50,
            soi: lifeSpheres?.soi || 50,
            amis: lifeSpheres?.amis || 50,
            pro: lifeSpheres?.pro || 50,
          };
          
          // Extraire les 2 motivations principales depuis Schwartz (valeurs les plus hautes)
          const schwartzEntries = schwartz ? Object.entries(schwartz)
            .filter(([key]) => key !== 'id' && key !== 'assessment_id')
            .map(([key, value]) => ({ key, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 2)
            .map(item => item.key) : [];
          
          const motivations = schwartzEntries.length > 0 ? schwartzEntries : ['autonomie', 'bienveillance'];
          
          // Reconstituer scenarioAnswers (valeurs par défaut si absentes)
          const scenarioAnswers = { "0": "B", "1": "B", "2": "B", "3": "B" };
          
          // Environnement depuis user_context
          const environnement = {
            reseau: 50,
            contextePro: userContext?.situation_pro || '',
            margeManoeuvre: 50,
          };
          
          const champsLibre = ''; // Pas de champs libre stocké en DB
          
          // 🧠 PSYCHOLOGY FIRST : Inclure Big Five et RIASEC
          const bigFiveValues = bigFive ? {
            ouverture: bigFive.ouverture || 50,
            conscienciosite: bigFive.conscienciosite || 50,
            extraversion: bigFive.extraversion || 50,
            agreabilite: bigFive.agreabilite || 50,
            nevrosisme: bigFive.nevrosisme || 50,
          } : { ouverture: 50, conscienciosite: 50, extraversion: 50, agreabilite: 50, nevrosisme: 50 };
          
          const riasecValues = riasec ? {
            realiste: riasec.realiste || 50,
            investigateur: riasec.investigateur || 50,
            artistique: riasec.artistique || 50,
            social: riasec.social || 50,
            entreprenant: riasec.entreprenant || 50,
            conventionnel: riasec.conventionnel || 50,
          } : { realiste: 50, investigateur: 50, artistique: 50, social: 50, entreprenant: 50, conventionnel: 50 };
          
          // Appeler l'edge function pour régénérer le persona
          const { data: regeneratedData, error: regenError } = await supabase.functions.invoke('generate-persona-profile', {
            body: {
              equilibreValues,
              motivations,
              scenarioAnswers,
              environnement,
              champsLibre,
              bigFiveValues, // 🆕 PSYCHOLOGY FIRST
              riasecValues,  // 🆕 PSYCHOLOGY FIRST
            }
          });
          
          if (regenError || !regeneratedData) {
            console.error('❌ Erreur lors de la régénération du persona:', regenError);
            setResults(null);
            setIsLoading(false);
            return;
          }
          
          console.log('✅ Persona régénéré automatiquement depuis les données existantes');
          
          // Sauvegarder dans localStorage et continuer le chargement
          const profileData = regeneratedData;
          const tempResults: CompleteResults = {
            personaData: {
              titre: profileData.titre || '',
              synthese: profileData.synthese || '',
              cap2_4semaines: profileData.cap2_4semaines || '',
              forces: profileData.forces || [],
              verrous: profileData.verrous || [],
              visualUrl: profileData.visualUrl || profileData.visual_url || '',
            },
            zones_attention: [],
            micro_actions: [],
            generatedAt: new Date().toISOString(),
            isPartial: true,
          };
          
          localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(tempResults));
          setResults(tempResults);
          setIsLoading(false);
          return;
        }
        
        const personaData = personaCache.persona_data as any;
        
        // 2. Charger les zones d'attention (on prend la première idea de l'utilisateur)
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const ideaId = ideas?.[0]?.id;
        
        let zones_attention: any[] = [];
        let micro_actions: any[] = [];
        
        if (ideaId) {
          // Charger zones d'attention
          const { data: zonesData } = await supabase
            .from('attention_zones')
            .select('*')
            .eq('idea_id', ideaId)
            .eq('user_id', user.id);
          
          zones_attention = zonesData?.map(z => ({
            id: z.id,
            label: z.label,
            recommendation: z.recommendation || '',
            severity: z.severity,
          })) || [];
          
          // Charger micro-actions
          const { data: actionsData } = await supabase
            .from('micro_commitments')
            .select('*')
            .eq('idea_id', ideaId)
            .eq('user_id', user.id);
          
          micro_actions = actionsData?.map(a => ({
            id: a.id,
            text: a.text,
            duree: a.duree,
            status: a.status,
            impact_attendu: a.impact_attendu,
            objectif: a.objectif,
            jauge_ciblee: a.jauge_ciblee,
            period: a.period,
          })) || [];
        }
        
        // 3. Reconstruire le format CompleteResults
        const reconstructedResults: CompleteResults = {
          personaData: {
            titre: personaData.titre || '',
            synthese: personaData.synthese || '',
            cap2_4semaines: personaData.cap2_4semaines || '',
            forces: personaData.forces || [],
            verrous: personaData.verrous || [],
            visualUrl: personaData.visualUrl || personaData.visual_url || '',
          },
          zones_attention,
          micro_actions,
          parcours: [], // Le parcours est calculé dynamiquement par useJourneyProgress
          generatedAt: new Date().toISOString(),
          isPartial: false,
        };
        
        // 4. Sauvegarder dans localStorage pour accès futur
        localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(reconstructedResults));
        
        console.log('✅ Résultats reconstruits depuis la DB:', {
          hasPersona: !!reconstructedResults.personaData,
          zonesCount: zones_attention.length,
          actionsCount: micro_actions.length,
        });
        
        setResults(reconstructedResults);
        setIsLoading(false);
        return;
        
      } catch (error) {
        console.error('❌ Erreur chargement résultats:', error);
        navigate('/onboarding', { replace: true });
      }
    };

    // Charger immédiatement
    loadResults();

    // Écouter les changements de localStorage (pour synchronisation multi-onglets ET même onglet)
    const handleStorageChange = () => {
      console.log('📦 Storage event détecté, rechargement...');
      loadResults();
    };

    const handleCustomUpdate = () => {
      console.log('🔔 astryd-data-update event détecté, rechargement...');
      loadResults();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('astryd-data-update', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('astryd-data-update', handleCustomUpdate);
    };
  }, [navigate]);

  return { results, isLoading };
}
