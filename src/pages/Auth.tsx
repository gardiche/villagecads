import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";
import { z } from "zod";
import { navigationLogger } from "@/utils/navigationLogger";
import { useSyncGuestData } from "@/hooks/useSyncGuestData";
import { reconcileGuestSession } from "@/hooks/useGuestSessionReconciliation";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const { syncGuestData } = useSyncGuestData();
  const redirectionInProgress = useRef(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au montage
    navigationLogger.logSessionCheck(false, undefined, { context: 'Auth page mount' });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigationLogger.logSessionCheck(
        !!session,
        session?.user?.id,
        { context: 'Auth page initial check', email: session?.user?.email }
      );
      
      if (session) {
        navigationLogger.log({
          type: 'redirect_attempt',
          from: '/auth',
          to: 'post-auth-redirect',
          action: 'User already authenticated on mount',
          metadata: { userId: session.user.id },
        });
        handlePostAuthRedirection();
      }
    });
  }, [navigate]);

  const saveGuestDataToDatabase = async (userId: string) => {
    try {
      const synced = await syncGuestData(userId);
      if (synced) {
        console.log('✅ Guest data synced to database successfully');
      }
    } catch (error) {
      console.error('❌ Error syncing guest data:', error);
    }
  };

  const handlePostAuthRedirection = async () => {
    // Guard against double invocation (race condition between signup + signin flows)
    if (redirectionInProgress.current) {
      console.log('⚠️ Redirection already in progress, skipping duplicate call');
      return;
    }
    redirectionInProgress.current = true;

    const returnAction = localStorage.getItem('astryd_return_action');
    const returnPath = localStorage.getItem('astryd_return_path');
    const currentPath = window.location.pathname;
    
    navigationLogger.logRedirectAttempt(
      currentPath,
      returnPath || '/profil-entrepreneurial',
      returnAction ? `Post-auth with action: ${returnAction}` : 'Post-auth default',
      { returnAction, returnPath }
    );
    
    // Récupérer l'utilisateur et vérifier ses rôles
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Récupérer TOUS les rôles de l'utilisateur
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const userRoles = roles?.map(r => r.role) || [];
      
      // Redirection par priorité : manager (avec cohorte) > mentor > user
      // Le super-admin (admin) sans rôle pro reste sur l'espace entrepreneur
      if (userRoles.includes('manager')) {
        const { data: cohort } = await supabase
          .from('cohorts')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();
        
        if (cohort) {
          navigationLogger.logRedirectSuccess(currentPath, '/pro/dashboard', { reason: 'manager role', roles: userRoles });
          navigate('/pro/dashboard');
          return;
        }
      }
      
      if (userRoles.includes('mentor')) {
        navigationLogger.logRedirectSuccess(currentPath, '/pro/mentor/dashboard', { reason: 'mentor role', roles: userRoles });
        navigate('/pro/mentor/dashboard');
        return;
      }
    }
    
    // Récupérer la première idée de l'utilisateur
    let ideaId = null;
    
    if (user) {
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (ideas && ideas.length > 0) {
        ideaId = ideas[0].id;
      }
    }
    
    // 🔒 SÉCU 4: Clean sensitive data from localStorage after DB transfer
    const sensitiveKeys = [
      'astryd_onboarding_data', 'astryd_guest_results', 'astryd_persona_data',
      'ASTRYD_ASSESSMENT_DATA', 'astryd_user_authenticated'
    ];
    sensitiveKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🔒 Cleaned sensitive key: ${key}`);
      }
      if (sessionStorage.getItem(key)) {
        sessionStorage.removeItem(key);
      }
    });

    // Nettoyer localStorage AVANT de naviguer
    if (returnAction) {
      navigationLogger.logLocalStorageAction('remove', 'astryd_return_action', { value: returnAction });
      localStorage.removeItem('astryd_return_action');
    }
    if (returnPath) {
      navigationLogger.logLocalStorageAction('remove', 'astryd_return_path', { value: returnPath });
      localStorage.removeItem('astryd_return_path');
    }
    
    // Redirection selon l'action
    if (returnAction === 'idea-questionnaire') {
      navigationLogger.logRedirectSuccess(currentPath, '/onboarding/idea', { returnAction });
      navigate('/onboarding/idea');
    } else if (returnPath && returnPath !== '/auth') {
      const url = new URL(returnPath, window.location.origin);
      if (ideaId && !url.searchParams.has('ideaId')) {
        url.searchParams.set('ideaId', ideaId);
      }
      const targetRoute = `${url.pathname}${url.search}`;
      navigationLogger.logRedirectSuccess(currentPath, targetRoute, { returnAction, returnPath });
      navigate(targetRoute);
    } else if (ideaId) {
      // Entrepreneur inscrit avec une idée → Mes Actions
      const actionRoute = `/micro-actions?ideaId=${ideaId}`;
      navigationLogger.logRedirectSuccess(currentPath, actionRoute, { reason: 'registered entrepreneur - action focus' });
      navigate(actionRoute);
    } else {
      // Première visite sans idée → Profil entrepreneurial (Aha Moment)
      navigationLogger.logRedirectSuccess(currentPath, '/profil-entrepreneurial', { reason: 'first visit - aha moment' });
      navigate('/profil-entrepreneurial');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé ! 📧",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Erreur reset password:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profil-entrepreneurial`
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Compte existant",
            description: "Cet email est déjà enregistré. Essayez de vous connecter.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Bienvenue au Village ! 🎉",
        description: "Votre espace d'accompagnement est en cours de préparation...",
      });

      // Sauvegarder les données visiteur en base AVANT redirection
      if (authData.user) {
        navigationLogger.log({
          type: 'localstorage_action',
          action: 'Saving guest data to database',
          userId: authData.user.id,
          metadata: { hasGuestData: !!sessionStorage.getItem('astryd_guest_results') },
        });
        await saveGuestDataToDatabase(authData.user.id);
        
        // Reconcile guest analytics session (fire & forget)
        reconcileGuestSession(authData.user.id);
      }
      
      // Redirection après sauvegarde réussie
      navigationLogger.log({
        type: 'redirect_attempt',
        from: '/auth',
        to: 'post-signup-redirect',
        action: 'Signup successful, triggering redirection',
        userId: authData.user?.id,
      });
      handlePostAuthRedirection();
    } catch (error: any) {
      console.error('Erreur signup:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Identifiants incorrects",
            description: "Email ou mot de passe invalide",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Connexion réussie !",
        description: "Accès à votre espace Village...",
      });

      // Sauvegarder les données visiteur en base AVANT redirection
      if (authData.user) {
        navigationLogger.log({
          type: 'localstorage_action',
          action: 'Saving guest data to database',
          userId: authData.user.id,
          metadata: { hasGuestData: !!sessionStorage.getItem('astryd_guest_results') },
        });
        await saveGuestDataToDatabase(authData.user.id);
        
        // Reconcile guest analytics session (fire & forget)
        reconcileGuestSession(authData.user.id);
      }
      
      // Redirection après sauvegarde réussie
      navigationLogger.log({
        type: 'redirect_attempt',
        from: '/auth',
        to: 'post-signin-redirect',
        action: 'Signin successful, triggering redirection',
        userId: authData.user?.id,
      });
      handlePostAuthRedirection();
    } catch (error: any) {
      console.error('Erreur signin:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de se connecter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Connexion" />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl flex gap-12 items-center">

          {/* Logo Village à gauche */}
          <div className="hidden md:flex flex-col items-center gap-6 flex-1">
            <img
              src="/village/LOGO-VBCASavoie_coul.png"
              alt="Le Village by CA des Savoie"
              className="w-full max-w-xs object-contain"
            />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Accédez à votre espace d'accompagnement entrepreneurial
            </p>
          </div>

          {/* Auth Form */}
          <div className="w-full max-w-md space-y-6 flex-1">
        <Card className="p-8 border shadow-[var(--shadow-medium)] animate-scale-in">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="signin" className="text-base">Connexion</TabsTrigger>
              <TabsTrigger value="signup" className="text-base">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {showResetForm ? (
                <form onSubmit={handlePasswordReset} className="space-y-5">
                  <div className="text-center mb-4">
                    <Mail className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h3 className="font-semibold text-lg">Mot de passe oublié ?</h3>
                    <p className="text-sm text-muted-foreground">
                      Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reset">Email</Label>
                    <Input
                      id="email-reset"
                      type="email"
                      placeholder="ton@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le lien"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowResetForm(false)}
                  >
                    Retour à la connexion
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email-signin">Email</Label>
                      <Input
                        id="email-signin"
                        type="email"
                        placeholder="ton@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signin">Mot de passe</Label>
                      <Input
                        id="password-signin"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-12"
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="link" 
                      className="w-full text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowResetForm(true)}
                    >
                      Mot de passe oublié ?
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="ton@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Mot de passe</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            conditions d'utilisation
          </a>
        </p>

        <div className="text-center mt-3">
          <button
            onClick={() => navigate('/onboarding')}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Passer pour l'instant →
          </button>
        </div>
          </div>
        </div>
      </div>
      <CommonFooter pageTitle="Connexion / inscription" />
    </div>
  );
};

export default Auth;
