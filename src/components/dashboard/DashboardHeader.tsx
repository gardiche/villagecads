import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProjectSwitcher from "./ProjectSwitcher";
import CommonHeader from "@/components/CommonHeader";
import AccountDropdown from "./AccountDropdown";

interface DashboardHeaderProps {
  currentPage: string;
  currentIdeaId?: string;
  onIdeaChange?: (ideaId: string) => void;
  showProjectSwitcher?: boolean;
}

const DashboardHeader = ({ 
  currentPage, 
  currentIdeaId, 
  onIdeaChange,
  showProjectSwitcher = true
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthClick = () => {
    // Sauvegarder le chemin actuel pour revenir après login
    localStorage.setItem('astryd_return_path', window.location.pathname + window.location.search);
    navigate("/auth?tab=signup");
  };

  return (
    <CommonHeader pageTitle={currentPage} showSidebarTrigger={true}>
      {showProjectSwitcher && currentIdeaId && onIdeaChange && (
        <ProjectSwitcher
          currentIdeaId={currentIdeaId}
          onIdeaChange={onIdeaChange}
        />
      )}
      
      {!isAuthenticated ? (
        <Button
          variant="ghost"
          size="default"
          onClick={handleAuthClick}
          className="rounded-full min-h-[44px]"
        >
          Connexion
        </Button>
      ) : (
        <AccountDropdown />
      )}
    </CommonHeader>
  );
};

export default DashboardHeader;
