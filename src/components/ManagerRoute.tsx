import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ManagerRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for Pro "manager" role (analytics pages).
 * Allows users with 'manager' or 'admin' (super-admin) role.
 */
const ManagerRoute = ({ children }: ManagerRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roleList = roles?.map(r => r.role) || [];
      // Manager role OR admin (super-admin) can access analytics
      setHasAccess(roleList.includes("manager") || roleList.includes("admin"));
    } catch (error) {
      console.error("Error checking manager access:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to={isGuest ? "/auth" : "/profil-entrepreneurial"} replace />;
  }

  return <>{children}</>;
};

export default ManagerRoute;
