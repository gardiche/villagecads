import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AccountDropdown from "@/components/dashboard/AccountDropdown";
import { useB2BRoles } from "@/hooks/useB2BRoles";

interface AccountPageLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for all "Mon compte" pages (Informations, Paramètres, Administration, Abonnement).
 * No sidebar — just a top bar with "Retour à mon espace" + AccountDropdown.
 */
const AccountPageLayout = ({ children }: AccountPageLayoutProps) => {
  const navigate = useNavigate();
  const { isMentor } = useB2BRoles();

  const backPath = isMentor ? "/pro/mentor/dashboard" : "/profil-entrepreneurial";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à mon espace
          </Button>
          <AccountDropdown />
        </div>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AccountPageLayout;
