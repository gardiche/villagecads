import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import AccountPageLayout from "@/components/AccountPageLayout";
import MentorSharingToggle from "@/components/dashboard/MentorSharingToggle";
import { toast } from "sonner";

const AccountSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProAccount, setIsProAccount] = useState(false);

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

    // Check if user is a Pro (mentor or manager)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = roles?.map(r => r.role) || [];
    setIsProAccount(roleList.includes("mentor") || roleList.includes("manager"));

    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === email) {
      toast.error("Veuillez saisir une nouvelle adresse e-mail");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Un e-mail de confirmation a été envoyé à votre nouvelle adresse");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour de l'e-mail");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Mot de passe mis à jour avec succès");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
    } finally {
      setUpdating(false);
    }
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
          <h1 className="font-display text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos informations de connexion</p>
        </div>

        {/* Only show MentorSharingToggle for entrepreneur accounts, NOT for Pro accounts */}
        {!isProAccount && <MentorSharingToggle />}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Modifier votre adresse e-mail</h2>
                <p className="text-sm text-muted-foreground">Adresse actuelle : {email}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="newEmail">Nouvelle adresse e-mail</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nouvelle@email.com" disabled={updating} />
            </div>
            <Button onClick={handleUpdateEmail} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour l'e-mail
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Modifier votre mot de passe</h2>
                <p className="text-sm text-muted-foreground">Choisissez un mot de passe sécurisé</p>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 caractères" disabled={updating} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Répétez le mot de passe" disabled={updating} />
            </div>
            <Button onClick={handleUpdatePassword} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour le mot de passe
            </Button>
          </div>
        </Card>
      </div>
    </AccountPageLayout>
  );
};

export default AccountSettings;
