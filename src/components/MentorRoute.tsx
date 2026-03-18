import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MentorRouteProps {
  children: React.ReactNode;
}

const MentorRoute = ({ children }: MentorRouteProps) => {
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

      // Check mentor, manager, or admin (super-admin) role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roleList = roles?.map(r => r.role) || [];
      setHasAccess(roleList.includes("mentor") || roleList.includes("manager") || roleList.includes("admin"));
    } catch (error) {
      console.error("Error checking mentor access:", error);
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

export default MentorRoute;
