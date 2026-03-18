import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralisé pour le chargement lazy des micro-actions.
 * Si les données n'existent pas dans localStorage, les génère automatiquement.
 * Mutualise les résultats pour toutes les pages (Zones/Actions/Parcours).
 */
const GENERATION_TIMEOUT_MS = 15000; // 15s max

export function useLazyMicroActions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const checkAndLoadData = async () => {
      try {
        // Vérifier si les données existent déjà
        const stored = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
        if (!stored) {
          console.warn('⚠️ Aucun résultat trouvé');
          return;
        }

        const parsed = JSON.parse(stored);
        
        // Vérifier si micro-actions/zones/parcours sont présents
        const hasMicroActions = parsed.micro_actions && parsed.micro_actions.length > 0;
        const hasZones = parsed.zones_attention && parsed.zones_attention.length > 0;
        const hasParcours = parsed.parcours && parsed.parcours.length > 0;

        if (hasMicroActions || hasZones || hasParcours) {
          console.log('✅ Données déjà présentes (générées en guest ou chargées depuis DB)');
          setHasData(true);
          return;
        }

        // Données manquantes : vérifier d'abord si user est connecté
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('⚠️ Utilisateur non connecté, impossible de générer les données secondaires');
          setHasData(false);
          return;
        }

        // Utilisateur connecté sans données : régénération depuis DB
        console.log('🔄 Données manquantes, lancement génération micro-actions depuis DB...');
        setIsGenerating(true);

        // Safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('⏰ Timeout génération micro-actions (15s)');
          setIsGenerating(false);
        }, GENERATION_TIMEOUT_MS);

        // Récupérer l'assessment depuis la DB
        const { data: assessment } = await supabase
          .from('user_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true)
          .maybeSingle();

        if (!assessment) {
          console.error('❌ Aucun assessment trouvé en DB');
          setIsGenerating(false);
          return;
        }

        // Charger toutes les données du questionnaire depuis la DB
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

        // Transformer en format attendu par generate-persona-micro-actions
        const equilibreValues = {
          energie: 70,
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

        const schwartzEntries = schwartz ? Object.entries(schwartz)
          .filter(([key]) => key !== 'id' && key !== 'assessment_id')
          .map(([key, value]) => ({ key, value: value as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 2)
          .map(item => item.key) : [];

        const motivations = schwartzEntries.length > 0 ? schwartzEntries : ['autonomie', 'bienveillance'];
        const scenarioAnswers = { "0": "B", "1": "B", "2": "B", "3": "B" };
        const environnement = {
          reseau: 50,
          contextePro: userContext?.situation_pro || '',
          margeManoeuvre: 50,
        };

        // Appel à l'edge function
        const { data, error } = await supabase.functions.invoke('generate-persona-micro-actions', {
          body: {
            equilibreValues,
            motivations,
            scenarioAnswers,
            environnement,
            champsLibre: '',
          }
        });

        if (error) {
          console.error('❌ Erreur génération micro-actions:', error);
          setIsGenerating(false);
          return;
        }

        if (!data || !data.micro_actions || !Array.isArray(data.micro_actions)) {
          console.error('❌ Réponse invalide de generate-persona-micro-actions:', data);
          setIsGenerating(false);
          return;
        }

        // Mise à jour du localStorage avec TOUTES les données reçues
        const updated = {
          ...parsed,
          micro_actions: data.micro_actions || [],
          zones_attention: data.zones_attention || [],
          parcours: data.parcours || [],
          generatedAt: new Date().toISOString(),
        };

        localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(updated));
        
        console.log('✅ Micro-actions/zones/parcours générés et sauvegardés');
        
        // Dispatcher l'event custom pour forcer le refresh
        window.dispatchEvent(new Event('astryd-data-update'));
        
        setHasData(true);
        setIsGenerating(false);
      } catch (error) {
        console.error('❌ Erreur useLazyMicroActions:', error);
        setIsGenerating(false);
      }
    };

    checkAndLoadData();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { isGenerating, hasData };
}
