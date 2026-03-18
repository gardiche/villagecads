import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import IdeaEditCard from "@/components/dashboard/IdeaEditCard";
import IdeaEmptyState from "@/components/dashboard/IdeaEmptyState";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import CommonFooter from "@/components/CommonFooter";
import { motion } from "framer-motion";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { LoginGateModal } from "@/components/dashboard/LoginGateModal";
import { toast } from "sonner";

const IdeaProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState<any>(null);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        // Visiteur sans compte et sans idée : on affiche l'état vide avec CTA
        if (!user && !ideaId) {
          setLoading(false);
          return;
        }

        // Utilisateur connecté sans ideaId : récupérer l'idée la plus récente puis rediriger
        if (user && !ideaId) {
          const { data: latestIdea } = await supabase
            .from("ideas")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestIdea?.id) {
            navigate(`/idea?ideaId=${latestIdea.id}`, { replace: true });
            return;
          }

          // Pas d'idée trouvée pour cet utilisateur connecté
          setLoading(false);
          return;
        }

        // Cas normal : ideaId présent
        loadIdea();
      } catch (e) {
        console.error("Error initializing IdeaProject:", e);
        setLoading(false);
      }
    };

    init();
  }, [ideaId, navigate]);
  
  const loadIdea = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: ideaData } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .maybeSingle();
      
      if (ideaData) {
        setIdea(ideaData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading idea:', error);
      setLoading(false);
    }
  };
  
  const handleMaturityUpdate = async (actionType?: 'idea_updated' | 'document_added') => {
    // Appeler l'edge function update-maturity
    try {
      await supabase.functions.invoke('update-maturity', {
        body: {
          ideaId,
          actionType: actionType || 'idea_updated',
          progressionPoints: actionType === 'document_added' ? 5 : 10
        }
      });
      
      // 🔄 RÉGÉNÉRER zones et micro-actions après modification idée
      console.log('🔄 Déclenchement régénération après modification idée...');
      try {
        const regenResponse = await supabase.functions.invoke('regenerate-recommendations', {
          body: {
            ideaId,
            trigger: actionType === 'document_added' ? 'document_added' : 'idea_updated'
          }
        });
        
        const regenData = regenResponse.data;
        if (regenData?.added?.micro_actions > 0 || regenData?.added?.zones_attention > 0) {
          toast.success("Recommandations mises à jour 🎯", {
            description: "Nouvelles recommandations générées suite à la modification de votre projet.",
            duration: 8000
          });
        }
      } catch (regenError) {
        console.error('Erreur régénération (non-bloquant):', regenError);
      }
    } catch (error) {
      console.error('Error updating maturity:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          currentIdeaId={ideaId || undefined}
          onOpenCoaching={() => setShowCoachingModal(true)}
        />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Mon projet" />
          
          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-4xl mx-auto px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {!idea ? (
                  <IdeaEmptyState 
                    ideaId={ideaId || "new"} 
                    onAddIdea={() => {
                      if (!isAuthenticated) {
                        setShowLoginGate(true);
                      } else {
                        navigate("/onboarding/idea");
                      }
                    }} 
                  />
                ) : (
                  <IdeaEditCard
                    idea={idea}
                    onUpdate={loadIdea}
                    onMaturityUpdate={handleMaturityUpdate}
                  />
                )}
              </motion.div>
              
              <CTAFooter 
                onProgressionClick={() => {
                  const hasProgressionAccess = localStorage.getItem("astryd_progression_access") === "granted";
                  if (hasProgressionAccess) {
                    navigate(ideaId ? `/history?ideaId=${ideaId}` : "/history");
                  } else {
                    setShowProgressionModal(true);
                  }
                }}
                onCoachingClick={() => setShowCoachingModal(true)}
              />
            </div>
          </main>
        </div>
      </div>
      
      <ProgressionAccessModal 
        open={showProgressionModal}
        onOpenChange={setShowProgressionModal}
      />

      <CoachingComingSoonModal 
        open={showCoachingModal} 
        onOpenChange={setShowCoachingModal}
      />

      <LoginGateModal
        open={showLoginGate}
        onOpenChange={setShowLoginGate}
        action="idea-questionnaire"
      />
    </SidebarProvider>
  );
};

export default IdeaProject;
