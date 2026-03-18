import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, CreditCard, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { useUserSubscription } from "@/hooks/useUserSubscription";

const AccountDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isProAccount, setIsProAccount] = useState(false);
  const { plan } = useUserSubscription();

  useEffect(() => {
    checkRoles();
  }, []);

  const checkRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roleList = roles?.map(r => r.role) || [];
      // Super admin = has 'admin' role (reserved for tbo@alpact.vc)
      setIsSuperAdmin(roleList.includes("admin"));
      // Pro account = mentor or manager
      setIsProAccount(roleList.includes("mentor") || roleList.includes("manager"));
    } catch (error) {
      console.error("Error checking roles:", error);
    }
  };

  const planLabels = {
    declic: { name: "Déclic", color: "bg-green-500 text-white" },
    cap: { name: "Cap", color: "bg-blue-500 text-white" },
    elan: { name: "Élan", color: "bg-primary text-primary-foreground" },
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Mon compte</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleNavigate("/account/profile")}>
          <User className="mr-2 h-4 w-4" />
          Informations
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate("/account/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </DropdownMenuItem>
        {/* Administration: reserved for super-admin (tbo@alpact.vc) only */}
        {isSuperAdmin && (
          <DropdownMenuItem onClick={() => handleNavigate("/account/admin")}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Administration
          </DropdownMenuItem>
        )}
        {/* Hide subscription for Pro accounts (mentors/managers) */}
        {!isProAccount && (
          <DropdownMenuItem onClick={() => handleNavigate("/account/subscription")}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span className="flex items-center gap-2 flex-1">
              Abonnement
              <Badge 
                variant="secondary" 
                className={`text-xs ml-auto ${planLabels[plan].color}`}
              >
                {planLabels[plan].name}
              </Badge>
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropdown;
