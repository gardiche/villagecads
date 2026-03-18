import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";
import { IdeaContextSection } from "@/components/assessment/IdeaContextSection";
import RecalculatingProgress from "@/components/dashboard/RecalculatingProgress";

/**
 * OnboardingIdea - Questionnaire idée post-inscription (2 étapes)
 * 
 * RIASEC + CV sont collectés dans l'onboarding profile (étape 4) et déjà en base.
 * Ce questionnaire ne collecte que les infos spécifiques à l'idée.
 */
const OnboardingIdea = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showRecalculating, setShowRecalculating] = useState(false);
  
  // Step 0 (1/2): Idea details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contextDetails, setContextDetails] = useState("");
  
  // Step 1 (2/2): Idea context gauges (optional)
  const [ideaContext, setIdeaContext] = useState({
    investissementEstime: 50,
    tempsHebdoEstime: 50,
    competencesTechniquesRequises: 50,
    interactionSocialeRequise: 50,
    risquePercu: 50,
  });

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      const draftData = {
        step,
        title,
        description,
        contextDetails,
        ideaContext,
        timestamp: Date.now()
      };
      localStorage.setItem('astryd_onboarding_idea_draft', JSON.stringify(draftData));
    };

    const debounceTimer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(debounceTimer);
  }, [step, title, description, contextDetails, ideaContext]);

  // Load existing idea from DB on mount, fallback to localStorage draft
  useEffect(() => {
    const loadExistingIdea = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingIdea } = await supabase
          .from("ideas")
          .select("id, title, description")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingIdea && existingIdea.title) {
          // Pré-remplir avec les données existantes en base
          setTitle(existingIdea.title);
          
          // Séparer description et contexte si le format "Contexte:" est utilisé
          const fullDesc = existingIdea.description || "";
          const contextSplit = fullDesc.split("\n\nContexte:\n");
          setDescription(contextSplit[0] || "");
          setContextDetails(contextSplit[1] || "");
          console.log("✅ Formulaire pré-rempli avec l'idée existante:", existingIdea.id);
          return; // Ne pas charger le draft si on a des données en base
        }
      } catch (e) {
        console.error("Error loading existing idea:", e);
      }

      // Fallback: charger le draft localStorage
      const draft = localStorage.getItem('astryd_onboarding_idea_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setStep(parsed.step || 0);
          setTitle(parsed.title || "");
          setDescription(parsed.description || "");
          setContextDetails(parsed.contextDetails || "");
          setIdeaContext(parsed.ideaContext || {
            investissementEstime: 50,
            tempsHebdoEstime: 50,
            competencesTechniquesRequises: 50,
            interactionSocialeRequise: 50,
            risquePercu: 50,
          });
        } catch (e) {
          console.error("Error loading draft:", e);
        }
      }
    };

    loadExistingIdea();
  }, []);

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      // Validate idea title (Step 0 = idea details, 1/2)
      if (!title.trim()) {
        toast.error("Le nom de votre idée est obligatoire");
        return;
      }
      setStep(1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      return;
    }
    
    if (step === 1) {
      // Step 1 = idea context gauges (2/2) - submit
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setShowRecalculating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // 1. Get assessment (déjà créé dans l'onboarding profile)
      const { data: assessment } = await supabase
        .from("user_assessments")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!assessment) {
        toast.error("Nous n'avons pas trouvé votre profil. Merci de refaire le questionnaire.");
        setShowRecalculating(false);
        setLoading(false);
        navigate("/onboarding");
        return;
      }

      // NOTE: RIASEC + CV sont déjà en base depuis l'onboarding profile
      // Pas besoin de les sauvegarder ici

      // 2. Update or create idea
      const fullDescription = description.trim() + 
        (contextDetails.trim() ? `\n\nContexte:\n${contextDetails.trim()}` : "");

      // Check if user already has an idea
      const { data: existingIdea } = await supabase
        .from("ideas")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let idea;
      if (existingIdea) {
        // Update existing idea to preserve ideaId and all associated localStorage data
        const { data: updatedIdea, error: updateError } = await supabase
          .from("ideas")
          .update({
            title: title.trim(),
            description: fullDescription,
          })
          .eq("id", existingIdea.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        idea = updatedIdea;
        console.log("✅ Existing idea updated, preserving ideaId:", idea.id);
      } else {
        // Create new idea only if none exists
        const { data: newIdea, error: ideaError } = await supabase
          .from("ideas")
          .insert({
            user_id: user.id,
            title: title.trim(),
            description: fullDescription,
          })
          .select()
          .single();

        if (ideaError) throw ideaError;
        idea = newIdea;
        console.log("✅ New idea created:", idea.id);
      }

      // Save idea to localStorage
      try {
        localStorage.setItem('ASTRYD_IDEA_DATA', JSON.stringify({
          id: idea.id,
          title: idea.title,
          description: idea.description,
        }));
      } catch (e) {
        console.error('❌ Erreur lors de la sauvegarde de ASTRYD_IDEA_DATA', e);
      }
 
      // 3. Récupérer personaData depuis localStorage pour le passer à astryd-analyse
      let personaData = null;
      const personaStr = sessionStorage.getItem('astryd_persona_data');
      if (personaStr) {
        try {
          personaData = JSON.parse(personaStr);
          console.log("✅ Persona data loaded from localStorage:", personaData.titre);
        } catch (e) {
          console.error("Error parsing persona data:", e);
        }
      }

      // Vérifier que personaData contient les champs minimum
      if (!personaData || !personaData.titre || !personaData.synthese) {
        console.warn("⚠️ personaData absent ou incomplet, l'analyse IA utilisera uniquement les données en base");
        // On continue sans personaData - astryd-analyse peut fonctionner sans
      }

      // 4. Appeler astryd-analyse pour recalculer tout le coaching avec l'idée
      // astryd-analyse récupère RIASEC/CV depuis la base de données
      console.log("🚀 Calling astryd-analyse for personalization with idea context...");
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "astryd-analyse",
        {
          body: {
            ideaId: idea.id,
            userId: user.id,
            personaData,
          },
        }
      );

      if (analysisError) {
        console.error("Error in astryd-analyse:", analysisError);
        toast.error("Erreur lors du recalcul de votre accompagnement");
        setShowRecalculating(false);
        return;
      }

      console.log("✅ Astryd analyse completed:", analysisData);
      
      // Sauvegarder / enrichir les résultats dans localStorage
      try {
        const existingResultsStr = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
        const existingPersona = existingResultsStr 
          ? JSON.parse(existingResultsStr).personaData 
          : (personaData || {
              titre: "Votre profil entrepreneurial",
              synthese: "Analyse en cours...",
              forces: [],
              verrous: [],
              visualUrl: null,
            });

        // NE PAS écraser l'objectif s'il a déjà été validé par l'utilisateur
        const isObjectiveValidated = localStorage.getItem("objective_validated") === "true";
        
        const enrichedPersona = {
          ...existingPersona,
          cap2_4semaines: isObjectiveValidated 
            ? existingPersona.cap2_4semaines 
            : ((analysisData as any)?.personaData?.cap2_4semaines || "Définir votre priorité pour avancer sereinement."),
        };

        const resultsToStore = {
          personaData: enrichedPersona,
          zones_attention: (analysisData as any)?.zones_attention || [],
          micro_actions: (analysisData as any)?.micro_actions || [],
          parcours: (analysisData as any)?.parcours || [],
          generatedAt: new Date().toISOString(),
        };

        localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(resultsToStore));
        console.log('✅ Résultats (profil + idée) sauvegardés dans localStorage');
        console.log('→ cap2_4semaines:', enrichedPersona.cap2_4semaines);
      } catch (e) {
        console.error('❌ Erreur lors de la sauvegarde des résultats idée dans localStorage', e);
      }
      
      // Clear draft and notification flag
      localStorage.removeItem('astryd_onboarding_idea_draft');
      localStorage.removeItem('personalization_notif_dismissed');
      
      // Bandeau de confirmation avant la redirection
      toast.success("Votre idée a été prise en compte", {
        description: "Votre coach IA a recalculé votre objectif, vos zones d'attention et vos micro-actions. Vous retrouverez tout cela dans Objectifs & parcours.",
      });
       
      // 5. Naviguer vers Objectif et parcours
      navigate(`/cap-parcours?ideaId=${idea.id}`);
 
    } catch (error: any) {
      console.error("Error in onboarding idea:", error);
      toast.error("Erreur lors de la soumission");
      setShowRecalculating(false);
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) return true; // No validation for context gauges
    return true;
  };

  const totalSteps = 2;
  const progress = ((step + 1) / totalSteps) * 100;

  // Show recalculating animation during submission
  if (showRecalculating) {
    return <RecalculatingProgress />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <CommonHeader pageTitle="Personnaliser mon accompagnement">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/micro-actions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <span className="text-sm text-muted-foreground">
            Étape {step + 1} / {totalSteps}
          </span>
        </div>
      </CommonHeader>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <Card className="p-6 md:p-8 space-y-6">
            {/* Step 0 = Idea details (1/2) */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Parlez-nous de votre idée
                  </h2>
                  <p className="text-muted-foreground">
                    Plus vous en dites, plus l'analyse sera précise et personnalisée
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Quel est le nom de votre projet ? *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Donnez un nom à votre projet"
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Décrivez votre idée
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Expliquez brièvement votre concept..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Contexte supplémentaire (optionnel)
                    </label>
                    <Textarea
                      value={contextDetails}
                      onChange={(e) => setContextDetails(e.target.value)}
                      placeholder="Ex: clients cibles, modèle économique, stratégie marketing, valeur différenciante..."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Plus vous en dites, plus l'IA sera précise
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 = Idea context gauges (2/2) */}
            {step === 1 && (
              <div className="space-y-6">
                <IdeaContextSection
                  values={ideaContext}
                  onChange={(key, value) =>
                    setIdeaContext({ ...ideaContext, [key]: value })
                  }
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-6 border-t">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Précédent
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading}
                className="gap-2 ml-auto"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Personnalisation en cours...
                  </>
                ) : step === totalSteps - 1 ? (
                  <>
                    Finaliser la personnalisation
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <CommonFooter pageTitle="Personnaliser mon accompagnement" />
    </div>
  );
};

export default OnboardingIdea;
