import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavigationDebugger from "@/components/NavigationDebugger";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminNavigationDebugger = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        navigate("/profil-entrepreneurial");
        return;
      }

      if (!roleData) {
        navigate("/profil-entrepreneurial");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      navigate("/profil-entrepreneurial");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profil-entrepreneurial")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Navigation Debugger</h1>
          <p className="text-muted-foreground">
            Outil de débogage de navigation - Accès réservé aux administrateurs
          </p>
        </div>
        <NavigationDebugger />
      </div>
    </div>
  );
};

export default AdminNavigationDebugger;
