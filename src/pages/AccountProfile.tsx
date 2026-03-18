import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Calendar } from "lucide-react";
import AccountPageLayout from "@/components/AccountPageLayout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AccountProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setEmail(user.email || "");
    setCreatedAt(user.created_at || "");
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AccountPageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Informations</h1>
          <p className="text-muted-foreground">
            Consultez les informations de votre compte Village by CA
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Informations du compte</h2>
                <p className="text-sm text-muted-foreground">Vos données personnelles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Adresse e-mail
                </Label>
                <Input value={email} disabled className="bg-muted" />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Membre depuis
                </Label>
                <Input 
                  value={createdAt ? format(new Date(createdAt), "d MMMM yyyy", { locale: fr }) : ""} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Pour modifier votre adresse e-mail, rendez-vous dans la section <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/account/settings")}>Paramètres</Button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AccountPageLayout>
  );
};

export default AccountProfile;
