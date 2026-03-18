import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, Lock, User, Mail, Eye, EyeOff, Loader2, CheckCircle2, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

const AuthGate = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personaData, setPersonaData] = useState<any>(null);
  const [missingData, setMissingData] = useState(false);

  useEffect(() => {
    // Vérifier si déjà authentifié
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth(session.user.id);
      }
    });

    // Charger les données persona depuis localStorage pour preview
    const storedPersona = sessionStorage.getItem('astryd_persona_data');
    if (storedPersona) {
      setPersonaData(JSON.parse(storedPersona));
    }
  }, []);

  const handlePostAuth = async (userId: string) => {
    setLoading(true);
    try {
      // Récupérer les données d'onboarding en attente
      const pendingData = localStorage.getItem('astryd_onboarding_pending');
      if (!pendingData) {
        setLoading(false);
        setMissingData(true);
        return;
      }

      const profileData = JSON.parse(pendingData);
      console.log('📦 Données à sauvegarder:', profileData);

      // Appeler save-and-analyze pour sauvegarder les données
      const { data, error } = await supabase.functions.invoke('save-and-analyze', {
        body: {
          ideaId: null,
          existingIdeaId: null,
          title: "Mon projet",
          description: "",
          motivations: profileData.motivations || [],
          equilibreValues: profileData.equilibreValues || {},
          scenarioAnswers: profileData.scenarioAnswers || {},
          environnement: profileData.environnement || {},
          champsLibre: profileData.champsLibre || "",
          riasecRanking: profileData.riasecRanking || [],
          cvContent: profileData.cvContent || "",
          personaData: profileData.personaData || null,
          profileOnly: true
        }
      });

      console.log('✅ Réponse save-and-analyze:', { data, error });

      if (error) {
        console.error('❌ Erreur edge function:', error);
        throw error;
      }

      // Attendre un peu pour la propagation des données (alignement, micro-actions, etc.)
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Nettoyer le localStorage
      localStorage.removeItem('astryd_onboarding_pending');
      sessionStorage.removeItem('astryd_persona_data');

      // Rediriger directement vers l'idée créée pour afficher l'espace résultats
      const ideaId = (data as any)?.ideaId;
      if (ideaId) {
        navigate(`/profil-entrepreneurial?ideaId=${ideaId}`);
      } else {
        // Fallback : on laisse le dashboard retrouver la dernière idée
        navigate(`/profil-entrepreneurial`);
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      toast.error("Erreur lors de la sauvegarde. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Connexion
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        if (data.user) {
          await handlePostAuth(data.user.id);
        }
      } else {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profil-entrepreneurial`
          }
        });

        if (error) throw error;
        if (data.user) {
          toast.success("Compte créé avec succès !");
          await handlePostAuth(data.user.id);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Email ou mot de passe incorrect");
      } else if (error.message?.includes('User already registered')) {
        toast.error("Cet email est déjà utilisé. Connectez-vous.");
        setIsLogin(true);
      } else {
        toast.error(error.message || "Erreur d'authentification");
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Génération de vos résultats...</h2>
          <p className="text-muted-foreground">
            Nous analysons votre profil entrepreneurial et préparons vos micro-actions personnalisées.
          </p>
        </Card>
      </div>
    );
  }

  if (missingData) {
    return (
      <div className="min-h-screen flex flex-col">
        <CommonHeader pageTitle="Session expirée" />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="p-8 text-center max-w-md">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Session expirée</h2>
            <p className="text-muted-foreground mb-6">
              Votre session a expiré ou vos données n'ont pas été retrouvées.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/onboarding")}>Recommencer le questionnaire</Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>Me connecter</Button>
            </div>
          </Card>
        </main>
        <CommonFooter pageTitle="Session expirée" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CommonHeader pageTitle="Inscription" />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Preview des résultats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Vos résultats sont prêts
            </Badge>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Découvrez votre profil entrepreneurial personnalisé
            </h1>

            <p className="text-lg text-muted-foreground">
              Créez votre compte pour accéder à vos résultats complets et débloquer :
            </p>

            <div className="space-y-4">
              {personaData && (
                <Card className="p-4 border-2 border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <User className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">{personaData.titre}</h3>
                      <p className="text-sm text-muted-foreground">{personaData.synthese}</p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-4 border-2 border-green-500/20 bg-green-500/5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Vos forces identifiées</h3>
                    <p className="text-sm text-muted-foreground">
                      {personaData?.forces?.length || 3} forces personnelles détectées basées sur votre profil
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Zones d'attention personnalisées</h3>
                    <p className="text-sm text-muted-foreground">
                      Points à travailler pour renforcer votre posture entrepreneuriale
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-orange-500/20 bg-orange-500/5">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-1">Micro-actions concrètes</h3>
                    <p className="text-sm text-muted-foreground">
                      {personaData?.micro_actions?.length || 3} actions actionnables en moins de 30 minutes
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Right: Formulaire d'authentification */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-8 border-2 border-primary/10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {isLogin ? "Connexion" : "Créer votre compte"}
                </h2>
                <p className="text-muted-foreground">
                  {isLogin 
                    ? "Accédez à vos résultats personnalisés" 
                    : "Gratuit • Sans engagement • Résultats immédiats"}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isLogin ? (
                    "Se connecter"
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Découvrir mes résultats
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin 
                    ? "Pas encore de compte ? Créer un compte" 
                    : "Déjà un compte ? Se connecter"}
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      <CommonFooter pageTitle="Inscription" />
    </div>
  );
};

export default AuthGate;
