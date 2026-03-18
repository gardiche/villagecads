import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface B2BRoles {
  isMentor: boolean;
  isManager: boolean;
  loading: boolean;
  displayName: string | null;
  userEmail: string | null;
}

export const useB2BRoles = (): B2BRoles => {
  const [isMentor, setIsMentor] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserEmail(user.email || null);

        const [rolesRes, profileRes] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        ]);

        const roles = rolesRes.data || [];
        setIsMentor(roles.some(r => r.role === "mentor"));
        setIsManager(roles.some(r => r.role === "manager"));
        setDisplayName(profileRes.data?.display_name || null);
      } catch (error) {
        console.error("Error loading B2B roles:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { isMentor, isManager, loading, displayName, userEmail };
};
