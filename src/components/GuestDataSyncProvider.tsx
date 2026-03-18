import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSyncGuestData } from "@/hooks/useSyncGuestData";

/**
 * Provider pour synchroniser automatiquement les données localStorage → base de données
 * Se déclenche automatiquement au chargement si l'utilisateur est authentifié
 * et qu'il reste des données visiteur dans le localStorage
 */
export const GuestDataSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { syncGuestData } = useSyncGuestData();

  useEffect(() => {
    const checkAndSyncGuestData = async () => {
      // Vérifier si l'utilisateur est authentifié
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Vérifier s'il reste des données visiteur à synchroniser
        const hasGuestData = 
          sessionStorage.getItem('astryd_onboarding_data') ||
          localStorage.getItem('ASTRYD_COMPLETE_RESULTS') ||
          localStorage.getItem('ASTRYD_IDEA_DATA');

        if (hasGuestData) {
          console.log('🔄 Auto-syncing guest data for authenticated user...');
          await syncGuestData(session.user.id);
        }
      }
    };

    // Exécuter au montage
    checkAndSyncGuestData();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Petit délai pour laisser Auth.tsx finir son propre sync
          setTimeout(async () => {
            const hasGuestData = 
              sessionStorage.getItem('astryd_onboarding_data') ||
              localStorage.getItem('ASTRYD_COMPLETE_RESULTS') ||
              localStorage.getItem('ASTRYD_IDEA_DATA');

            if (hasGuestData) {
              console.log('🔄 Auto-syncing remaining guest data after sign in...');
              await syncGuestData(session.user.id);
            }
          }, 2000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [syncGuestData]);

  return <>{children}</>;
};
