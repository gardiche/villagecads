import { useEffect, useState } from 'react';

/**
 * Hook de polling pour détecter l'arrivée progressive des données en arrière-plan
 * après la redirection depuis l'onboarding.
 * 
 * Poll localStorage toutes les 2 secondes pendant max 30 secondes
 * pour détecter quand zones_attention et micro_actions sont générées.
 */
export function useBackgroundDataPolling() {
  const [pollingActive, setPollingActive] = useState(false);
  const [dataComplete, setDataComplete] = useState(false);

  useEffect(() => {
    const checkInitialState = () => {
      const storedData = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
      if (!storedData) return false;

      try {
        const parsed = JSON.parse(storedData);
        // Considérer les données comme incomplètes si zones ou actions sont vides
        const hasZones = parsed.zones_attention && parsed.zones_attention.length > 0;
        const hasActions = parsed.micro_actions && parsed.micro_actions.length > 0;
        const hasParcours = parsed.parcours && parsed.parcours.length > 0;
        
        const isComplete = hasZones && hasActions && hasParcours;
        
        if (!isComplete && !parsed.isPartial) {
          console.log('🔄 Données incomplètes détectées, activation du polling');
          setPollingActive(true);
        } else {
          console.log('✅ Données complètes détectées, pas de polling nécessaire');
          setDataComplete(true);
        }
        
        return isComplete;
      } catch (error) {
        console.error('❌ Erreur parsing lors du check initial:', error);
        return false;
      }
    };

    // Check initial
    checkInitialState();

    if (!pollingActive) return;

    let pollCount = 0;
    const MAX_POLLS = 15; // 15 * 2s = 30 secondes max
    
    const pollInterval = setInterval(() => {
      pollCount++;
      console.log(`🔄 Polling #${pollCount}/${MAX_POLLS} - Vérification des données...`);

      const storedData = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
      if (!storedData) {
        console.warn('⚠️ Aucune donnée trouvée pendant le polling');
        return;
      }

      try {
        const parsed = JSON.parse(storedData);
        const hasZones = parsed.zones_attention && parsed.zones_attention.length > 0;
        const hasActions = parsed.micro_actions && parsed.micro_actions.length > 0;
        const hasParcours = parsed.parcours && parsed.parcours.length > 0;
        
        console.log('📊 État du polling:', {
          zones: hasZones ? parsed.zones_attention.length : 0,
          actions: hasActions ? parsed.micro_actions.length : 0,
          parcours: hasParcours ? parsed.parcours.length : 0,
        });

        if (hasZones && hasActions && hasParcours) {
          console.log('✅ Données complètes détectées ! Arrêt du polling.');
          setDataComplete(true);
          setPollingActive(false);
          
          // 🔔 Dispatch l'événement custom pour forcer le rechargement dans useCompleteResults
          window.dispatchEvent(new Event('astryd-data-update'));
          console.log('🔔 Événement astryd-data-update dispatché depuis polling');
          clearInterval(pollInterval);
        } else if (pollCount >= MAX_POLLS) {
          console.warn('⏱️ Timeout du polling atteint (30s). Arrêt du polling.');
          setPollingActive(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('❌ Erreur parsing pendant le polling:', error);
      }
    }, 2000); // Poll toutes les 2 secondes

    // Cleanup
    return () => {
      clearInterval(pollInterval);
    };
  }, [pollingActive]);

  return { pollingActive, dataComplete };
}
