import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { navigationLogger } from "@/utils/navigationLogger";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier la session actuelle
    navigationLogger.logProtectedRouteCheck(
      location.pathname,
      false,
      { context: 'Initial check' }
    );
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setLoading(false);
      
      navigationLogger.logProtectedRouteCheck(
        location.pathname,
        authenticated,
        { 
          userId: session?.user?.id,
          email: session?.user?.email,
          context: 'Session check result'
        }
      );
      
      if (!authenticated) {
        navigationLogger.logRedirectAttempt(
          location.pathname,
          '/auth',
          'Protected route - no session',
          { requestedRoute: location.pathname }
        );
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      
      navigationLogger.logAuthStateChange(
        authenticated,
        session?.user?.id,
        { 
          event,
          route: location.pathname,
          email: session?.user?.email
        }
      );
    });

    return () => subscription.unsubscribe();
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Sauvegarder le chemin actuel pour redirection après connexion
    localStorage.setItem('astryd_return_path', location.pathname + location.search);
    
    navigationLogger.logRedirectSuccess(
      location.pathname,
      '/auth',
      { reason: 'Protected route - authentication required' }
    );
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
