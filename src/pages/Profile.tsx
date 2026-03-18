import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, Clock, Briefcase, LogOut } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleReset = () => {
    if (confirm('Êtes-vous sûr·e de vouloir réinitialiser votre profil ? Cette action est irréversible.')) {
      localStorage.removeItem('userName');
      localStorage.removeItem('userProfile');
      window.location.href = '/onboarding';
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Aucun profil trouvé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas encore fait votre bilan express. Commencez par là pour créer votre profil !
            </p>
          </div>
          <Link to="/onboarding" className="block">
            <Button variant="default" size="lg" className="w-full">
              Faire mon bilan express
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <CommonHeader pageTitle="Mon profil">
        <Button variant="ghost" size="sm" onClick={() => navigate("/profil-entrepreneurial")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </CommonHeader>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Mon profil</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Voici les informations que tu as partagées lors de ton bilan express
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prénom</label>
                <p className="text-lg">{profile.firstName}</p>
              </div>
            </div>
          </Card>

          {/* Values */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tes valeurs essentielles</h2>
            <div className="flex flex-wrap gap-2">
              {profile.selectedValues?.map((value: string) => (
                <span 
                  key={value}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-full font-medium"
                >
                  {value}
                </span>
              ))}
            </div>
          </Card>

          {/* Context */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Ton contexte</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Temps disponible</p>
                  <p className="font-medium">{profile.timeAvailable}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Situation professionnelle</p>
                  <p className="font-medium">{profile.professionalStatus}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Energy Levels */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tes niveaux d'énergie</h2>
            <div className="space-y-4">
              {Object.entries(profile.energyLevels || {}).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{key}</span>
                    <span className="text-primary">{value as number}/5</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((value as number) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-3">Modifier mon profil</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Si tu veux modifier tes informations, tu devras refaire le bilan express.
            </p>
            <Button variant="destructive" onClick={handleReset}>
              Réinitialiser mon profil
            </Button>
          </Card>
        </div>
      </div>
      <CommonFooter pageTitle="Mon profil" />
    </div>
  );
};

export default Profile;
