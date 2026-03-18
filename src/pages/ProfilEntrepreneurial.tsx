import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Star, Target, AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { useCompleteResults } from "@/hooks/useCompleteResults";

import { cleanText } from "@/lib/utils";
import { trackEvent } from "@/hooks/usePageTracking";
import { supabase } from "@/integrations/supabase/client";

const ProfilEntrepreneurial = () => {
  const navigate = useNavigate();
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [imageProgress, setImageProgress] = useState(0);
  const [isGuest, setIsGuest] = useState(true);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Chargement passif depuis localStorage (redirection automatique si données absentes)
  const { results, isLoading } = useCompleteResults();

  // Timeout de 10s sur le loading
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isLoading && !results) {
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      setLoadingTimedOut(false);
    }
    return () => { if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current); };
  }, [isLoading, results]);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsGuest(!session?.user);
    };
    checkAuth();
  }, []);

  // Track profile generated event
  useEffect(() => {
    if (results?.personaData?.titre) {
      trackEvent("profile_generated", {
        persona_type: results.personaData.titre,
        has_visual: !!results.personaData.visualUrl,
      });
    }
  }, [results?.personaData?.titre]);

  // Écouter les mises à jour de l'image en arrière-plan
  useEffect(() => {
    if (results?.personaData?.visualUrl) {
      console.log('✅ Image déjà présente dans results:', results.personaData.visualUrl);
      // Ne mettre à jour que si l'URL a changé pour éviter le double visuel
      setImageUrl((prev) => {
        if (prev !== results.personaData.visualUrl) {
          setImageProgress(100);
          return results.personaData.visualUrl;
        }
        return prev;
      });
    }

    const handleDataUpdate = () => {
      console.log('🔔 Event astryd-data-update reçu');
      const stored = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.personaData?.visualUrl) {
          console.log('🎨 Image Nano Banana mise à jour détectée:', parsed.personaData.visualUrl);
          // Ne mettre à jour que si l'URL a changé pour éviter le double visuel
          setImageUrl((prev) => {
            if (prev !== parsed.personaData.visualUrl) {
              setImageProgress(100);
              return parsed.personaData.visualUrl;
            }
            return prev;
          });
        }
      }
    };

    window.addEventListener('astryd-data-update', handleDataUpdate);
    console.log('👂 Listener astryd-data-update installé');
    return () => {
      window.removeEventListener('astryd-data-update', handleDataUpdate);
      console.log('🔇 Listener astryd-data-update retiré');
    };
  }, [results]);

  // Simuler la progression de génération de l'image avec timeout de sécurité
  useEffect(() => {
    // On simule la génération uniquement tant que l'URL finale n'est pas connue
    if (!results?.personaData?.visualUrl && !isLoading) {
      const startTime = Date.now();

      const interval = setInterval(() => {
        setImageProgress((prev) => {
          const elapsed = Date.now() - startTime;
          if (elapsed > 15000) {
            // Timeout de 15s : on arrête la progression, on garde le placeholder propre
            clearInterval(interval);
            setImageUrl("/placeholder.svg");
            return 100;
          }

          if (prev >= 95) return 95; // Plafonner à 95% jusqu'à réception
          return prev + Math.random() * 15; // Progression non-linéaire
        });
      }, 800);

      return () => clearInterval(interval);
    }
  }, [results, isLoading]);

  if (loadingTimedOut) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader currentPage="Profil entrepreneurial" />
            <main className="flex-1 overflow-y-auto">
              <div className="container max-w-5xl mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Impossible de charger vos résultats</h2>
                  <p className="text-muted-foreground mb-6">
                    Les données n'ont pas pu être récupérées. Cela peut arriver si votre session a expiré.
                  </p>
                  <Button onClick={() => window.location.reload()}>Réessayer</Button>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (isLoading || !results) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader currentPage="Profil entrepreneurial" />
            <main className="flex-1 overflow-y-auto">
              <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
                <Card className="overflow-hidden">
                  <div className="bg-muted/50 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-8 w-64" />
                    </div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </div>
                  <div className="p-6">
                    <Skeleton className="w-full max-w-md mx-auto h-64 rounded-lg" />
                  </div>
                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <Skeleton className="h-6 w-32 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div>
                      <Skeleton className="h-6 w-32 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const { personaData } = results;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onOpenCoaching={() => setShowCoachingModal(true)} />

        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Profil entrepreneurial" />

          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-muted/50 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                      <h1 className="text-2xl font-display font-bold">
                        Votre profil entrepreneurial
                      </h1>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">{cleanText(personaData.titre)}</h2>
                    <p className="text-muted-foreground leading-relaxed">{cleanText(personaData.synthese)}</p>
                  </div>

                  <div className="p-6">
                    <div className="w-full max-w-md mx-auto space-y-6">
                      {/* Toujours afficher une image (placeholder par défaut) pour éviter un écran vide */}
                      {!imageUrl && (
                        <>
                          {/* Cercle de progression */}
                          <div className="relative w-48 h-48 mx-auto">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              {/* Cercle de fond */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="8"
                              />
                              {/* Cercle de progression */}
                              <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                animate={{
                                  strokeDashoffset: 2 * Math.PI * 45 * (1 - imageProgress / 100),
                                }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </svg>
                            {/* Pourcentage au centre */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <motion.span
                                className="text-4xl font-bold text-primary"
                                key={Math.floor(imageProgress)}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                {Math.floor(imageProgress)}%
                              </motion.span>
                              <Sparkles className="w-6 h-6 text-primary mt-2 animate-pulse" />
                            </div>
                          </div>

                          {/* Message de génération */}
                          <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Génération de votre visuel personnalisé
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Création d'une image unique basée sur votre profil...
                            </p>
                          </div>
                        </>
                      )}

                      <motion.img
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        src={imageUrl ?? "/placeholder.svg"}
                        alt="Profil entrepreneurial"
                        className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== "/placeholder.svg") {
                            target.src = "/placeholder.svg";
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {personaData.forces.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Star className="w-5 h-5 text-success" />
                          Vos forces
                        </h3>
                        <ul className="space-y-2">
                          {personaData.forces.map((force, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm leading-relaxed">{cleanText(force)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {personaData.verrous.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-accent" />
                          Vos freins à lever
                        </h3>
                        <ul className="space-y-2">
                          {personaData.verrous.map((verrou, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <span className="text-sm leading-relaxed">{cleanText(verrou)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {personaData.cap2_4semaines && (
                    <div className="p-6 pt-0">
                      <Card className="bg-muted/30 border-border p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Votre cap 2-4 semaines
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{cleanText(personaData.cap2_4semaines)}</p>
                      </Card>
                    </div>
                  )}
                </Card>
              </motion.div>

              <CTAFooter
                onProgressionClick={() => {
                  const hasProgressionAccess = localStorage.getItem("astryd_progression_access") === "granted";
                  if (hasProgressionAccess) {
                    navigate("/history");
                  } else {
                    setShowProgressionModal(true);
                  }
                }}
                onCoachingClick={() => setShowCoachingModal(true)}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Bandeau d'alerte Guest */}
      {isGuest && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-muted/95 backdrop-blur-sm border-t border-border py-3 px-4 z-50"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <p className="text-foreground text-sm">
              <span className="font-medium">Mode visiteur :</span> vos résultats ne sont pas sauvegardés.
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="whitespace-nowrap"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer un compte
            </Button>
          </div>
        </motion.div>
      )}

      <ProgressionAccessModal
        open={showProgressionModal}
        onOpenChange={setShowProgressionModal}
      />

      <CoachingComingSoonModal
        open={showCoachingModal}
        onOpenChange={setShowCoachingModal}
      />
    </SidebarProvider>
  );
};

export default ProfilEntrepreneurial;
