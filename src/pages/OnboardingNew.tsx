import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Sparkles, ChevronLeft, ChevronRight, Save, Loader2, Check, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";
import { GuestCodeModal } from "@/components/dashboard/GuestCodeModal";
import LoadingProgress from "@/components/dashboard/LoadingProgress";
import { Bloc1EquilibreSection } from "@/components/assessment/Bloc1EquilibreSection";
import { Bloc2ComportementSection } from "@/components/assessment/Bloc2ComportementSection";
import { Bloc4AtoutsSection } from "@/components/assessment/Bloc4AtoutsSection";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CalendarStep from "@/components/onboarding/CalendarStep";

const OnboardingNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefill = searchParams.get("prefill") === "true";
  const existingIdeaId = searchParams.get("ideaId");
  
  const introSeen = localStorage.getItem("intro_bilan_seen") === "true";
  const [step, setStep] = useState(introSeen ? 0 : -1); // -1 = intro screen
  const [checkingExisting, setCheckingExisting] = useState(!introSeen);
  const [loading, setLoading] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(prefill);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Modale code de récupération guest
  const [showGuestCodeModal, setShowGuestCodeModal] = useState(false);
  const [guestCode, setGuestCode] = useState<string>("");
  const [guestCodeExpiry, setGuestCodeExpiry] = useState<string>("");

  // Bloc 1: Équilibre + Motivations
  const [equilibreValues, setEquilibreValues] = useState({
    energie: 50,
    sante: 50,
    temps: 50,
    finances: 50,
    soutien: 50,
    famille: 50,
    couple: 50,
    loisirs: 50,
    reseau: 50,
    pro: 50,
  });
  const [motivations, setMotivations] = useState<string[]>([]);
  const [isCelibataire, setIsCelibataire] = useState(false);

  // Bloc 2: Comportement + Environnement
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<number, string>>({});
  const [environnement, setEnvironnement] = useState({
    reseau: 50,
    contextePro: 50,
    margeManoeuvre: 50,
  });

  // Bloc 3: Champ libre contextuel + Situation
  const [champsLibre, setChampsLibre] = useState("");
  const [experienceEntrepreneuriale, setExperienceEntrepreneuriale] = useState<string>("");
  const [situationPro, setSituationPro] = useState<string>(""); // Salarié, Chômage, etc.
  const [tempsConsacre, setTempsConsacre] = useState<string>(""); // Soirs/WE, Mi-temps, Plein temps
  const [causesEngagees, setCausesEngagees] = useState<string[]>([]); // Causes qui touchent l'utilisateur

  // Idea (après profil express)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Bloc 4: Atouts (RIASEC sliders + CV)
  const [riasecValues, setRiasecValues] = useState<Record<string, number>>({
    realiste: 50,
    investigateur: 50,
    artistique: 50,
    social: 50,
    entreprenant: 50,
    conventionnel: 50,
  });
  const [cvContent, setCvContent] = useState("");

  // Check if user already has daily_checkins → skip intro
  useEffect(() => {
    if (introSeen) return;
    const checkExisting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("daily_checkins")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id);
          if (count && count > 0) {
            localStorage.setItem("intro_bilan_seen", "true");
            setStep(0);
          }
        }
      } catch (e) {
        console.error("Error checking daily_checkins:", e);
      } finally {
        setCheckingExisting(false);
      }
    };
    checkExisting();
  }, [introSeen]);

  // Check for existing draft on mount (only if NOT in prefill mode)
  useEffect(() => {
    if (!prefill) {
      const draftKey = existingIdeaId 
        ? `astryd_onboarding_draft_${existingIdeaId}`
        : 'astryd_onboarding_draft_new';
      const draft = localStorage.getItem(draftKey);
      
      if (draft) {
        setHasDraft(true);
        setShowDraftDialog(true);
      }
    }
  }, [prefill, existingIdeaId]);

  // Auto-save draft on any change
  useEffect(() => {
    const saveDraft = () => {
      const draftKey = existingIdeaId 
        ? `astryd_onboarding_draft_${existingIdeaId}`
        : 'astryd_onboarding_draft_new';
      
      const draftData = {
        step,
        equilibreValues,
        motivations,
        isCelibataire,
        scenarioAnswers,
        environnement,
        champsLibre,
        situationPro,
        tempsConsacre,
        experienceEntrepreneuriale,
        title,
        description,
        riasecValues,
        cvContent,
        timestamp: Date.now()
      };
      
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date());
    };

    // Only auto-save if user has started filling the form
    if (motivations.length > 0 || Object.keys(scenarioAnswers).length > 0 || champsLibre || situationPro || tempsConsacre || title || description || Object.values(riasecValues).some(v => v !== 50)) {
      const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1s
      return () => clearTimeout(timeoutId);
    }
  }, [step, equilibreValues, motivations, scenarioAnswers, environnement, champsLibre, situationPro, tempsConsacre, experienceEntrepreneuriale, title, description, riasecValues, cvContent, existingIdeaId]);

  const loadDraft = () => {
    const draftKey = existingIdeaId 
      ? `astryd_onboarding_draft_${existingIdeaId}`
      : 'astryd_onboarding_draft_new';
    const draft = localStorage.getItem(draftKey);
    
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setStep(data.step || 0);
        setEquilibreValues(data.equilibreValues || {
          energie: 50, sante: 50, temps: 50, finances: 50, soutien: 50, famille: 50, couple: 50, loisirs: 50, reseau: 50, pro: 50
        });
        setMotivations(data.motivations || []);
        setIsCelibataire(data.isCelibataire || false);
        setScenarioAnswers(data.scenarioAnswers || {});
        setEnvironnement(data.environnement || { reseau: 50, contextePro: 50, margeManoeuvre: 50 });
        setChampsLibre(data.champsLibre || "");
        setSituationPro(data.situationPro || "");
        setTempsConsacre(data.tempsConsacre || "");
        setExperienceEntrepreneuriale(data.experienceEntrepreneuriale || "");
        setTitle(data.title || "");
        setDescription(data.description || "");
        // Support old format (riasecRanking) and new format (riasecValues)
        if (data.riasecValues) {
          setRiasecValues(data.riasecValues);
        } else if (data.riasecRanking) {
          // Convert old ranking to values (top 3 get high scores)
          const converted: Record<string, number> = { realiste: 50, investigateur: 50, artistique: 50, social: 50, entreprenant: 50, conventionnel: 50 };
          const keyMap: Record<string, string> = { R: "realiste", I: "investigateur", A: "artistique", S: "social", E: "entreprenant", C: "conventionnel" };
          data.riasecRanking.forEach((key: string, idx: number) => {
            const fullKey = keyMap[key];
            if (fullKey) converted[fullKey] = 90 - idx * 15;
          });
          setRiasecValues(converted);
        }
        setCvContent(data.cvContent || "");
        toast.success("Brouillon chargé");
      } catch (error) {
        console.error("Error loading draft:", error);
        toast.error("Erreur lors du chargement du brouillon");
      }
    }
    setShowDraftDialog(false);
  };

  const discardDraft = () => {
    const draftKey = existingIdeaId 
      ? `astryd_onboarding_draft_${existingIdeaId}`
      : 'astryd_onboarding_draft_new';
    localStorage.removeItem(draftKey);
    setShowDraftDialog(false);
    setHasDraft(false);
  };

  // Load existing data if prefill mode
  useEffect(() => {
    if (prefill && existingIdeaId) {
      loadExistingData();
    }
  }, [prefill, existingIdeaId]);

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger l'idée
      const { data: idea } = await supabase
        .from("ideas")
        .select("title, description")
        .eq("id", existingIdeaId)
        .eq("user_id", user.id)
        .single();

      if (idea) {
        setTitle(idea.title || "");
        setDescription(idea.description || "");
      }

      // Charger l'assessment de l'utilisateur
      const { data: assessment } = await supabase
        .from("user_assessments")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessment) {
        // Charger les life_spheres (equilibreValues)
        const { data: lifeSpheres } = await supabase
          .from("life_spheres")
          .select("*")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (lifeSpheres) {
          setEquilibreValues({
            energie: lifeSpheres.soi || 50,
            sante: 50,
            temps: 50,
            finances: 50,
            soutien: lifeSpheres.soi || 50,
            famille: lifeSpheres.famille || 50,
            couple: lifeSpheres.couple || 50,
            loisirs: lifeSpheres.loisirs || 50,
            reseau: lifeSpheres.amis || 50,
            pro: lifeSpheres.pro || 50,
          });
        }

        // Charger les schwartz_values (motivations)
        const { data: schwartz } = await supabase
          .from("schwartz_values")
          .select("*")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (schwartz) {
          const mots: string[] = [];
          if ((schwartz.autonomie || 0) > 60) mots.push("autonomie");
          if ((schwartz.bienveillance || 0) > 60) mots.push("bienveillance");
          if ((schwartz.accomplissement || 0) > 60) mots.push("ambition");
          if ((schwartz.securite || 0) > 60) mots.push("securite");
          setMotivations(mots.slice(0, 2));
        }

        // Charger user_context (champs libre + environnement)
        const { data: context } = await supabase
          .from("user_context")
          .select("*")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (context) {
          // Normaliser competences_techniques (peut être un JSON natif ou une string JSON)
          let contextData: any = context.competences_techniques as any;
          if (typeof contextData === "string") {
            try {
              contextData = JSON.parse(contextData);
            } catch (e) {
              console.error("Error parsing competences_techniques string:", e);
              contextData = {};
            }
          }

          // Charger champsLibre s'il existe
          if (contextData && contextData.champsLibre) {
            setChampsLibre(contextData.champsLibre);
          }
          
          // Charger environnement s'il existe
          if (contextData && contextData.environnement) {
            setEnvironnement(contextData.environnement);
          } else {
            setEnvironnement({
              reseau: context.reseau_professionnel === "fort" ? 80 : context.reseau_professionnel === "moyen" ? 50 : 20,
              contextePro: 50,
              margeManoeuvre: context.temps_disponible === "beaucoup" ? 80 : context.temps_disponible === "moyen" ? 50 : 20,
            });
          }

          // Reconstituer les jauges d'équilibre à partir de user_context lorsque possible
          setEquilibreValues((prev) => ({
            ...prev,
            energie: context.energie_sociale ? Number(context.energie_sociale) || prev.energie : prev.energie,
            temps: context.temps_disponible ? Number(context.temps_disponible) || prev.temps : prev.temps,
            finances: context.situation_financiere ? Number(context.situation_financiere) || prev.finances : prev.finances,
            soutien: context.soutien_entourage ? Number(context.soutien_entourage) || prev.soutien : prev.soutien,
            famille: context.charge_mentale ? Number(context.charge_mentale) || prev.famille : prev.famille,
          }));
        }

        // Charger big_five_traits pour reconstruire scenarioAnswers
        const { data: bigFive } = await supabase
          .from("big_five_traits")
          .select("*")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (bigFive) {
          // Essayer de charger les scenarioAnswers stockés dans user_context
          const contextData = context?.competences_techniques as any;
          if (contextData && contextData.scenarioAnswers) {
            setScenarioAnswers(contextData.scenarioAnswers);
          } else {
            // Fallback: reconstruire les réponses aux scénarios basées sur les traits
            const reconstructedAnswers: Record<number, string> = {};
            
            // Scénario 0: incertitude
            if ((bigFive.ouverture || 0) > 60) reconstructedAnswers[0] = "B";
            else if ((bigFive.conscienciosite || 0) > 60) reconstructedAnswers[0] = "C";
            else reconstructedAnswers[0] = "A";
            
            // Scénario 1: projet nouveau
            if ((bigFive.conscienciosite || 0) > 60) reconstructedAnswers[1] = "A";
            else if ((bigFive.ouverture || 0) > 60) reconstructedAnswers[1] = "B";
            else reconstructedAnswers[1] = "C";
            
            // Scénario 2: difficultés
            if ((bigFive.extraversion || 0) < 40) reconstructedAnswers[2] = "A";
            else if ((bigFive.extraversion || 0) > 60) reconstructedAnswers[2] = "B";
            else reconstructedAnswers[2] = "C";
            
            // Scénario 3: énergie sociale
            if ((bigFive.extraversion || 0) < 40) reconstructedAnswers[3] = "A";
            else if ((bigFive.extraversion || 0) > 60) reconstructedAnswers[3] = "C";
            else reconstructedAnswers[3] = "B";
            
            setScenarioAnswers(reconstructedAnswers);
          }
        }

        // Charger riasec_scores (riasecRanking)
        const { data: riasec } = await supabase
          .from("riasec_scores")
          .select("*")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (riasec) {
          setRiasecValues({
            realiste: riasec.realiste || 50,
            investigateur: riasec.investigateur || 50,
            artistique: riasec.artistique || 50,
            social: riasec.social || 50,
            entreprenant: riasec.entreprenant || 50,
            conventionnel: riasec.conventionnel || 50,
          });
        }

        // Charger le CV (user_learning_profiles)
        const { data: profile } = await supabase
          .from("user_learning_profiles")
          .select("cv_insights")
          .eq("assessment_id", assessment.id)
          .maybeSingle();

        if (profile?.cv_insights && typeof profile.cv_insights === 'object') {
          const insights = profile.cv_insights as any;
          setCvContent(insights.cv_text || "");
        }
      }

      setLoadingPrefill(false);
      toast.success("Données chargées");
    } catch (error) {
      console.error("Error loading data:", error);
      setLoadingPrefill(false);
      toast.error("Erreur lors du chargement");
    }
  };

  const handleEquilibreChange = (key: string, value: number) => {
    setEquilibreValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleScenarioChange = (scenarioIndex: number, optionKey: string) => {
    setScenarioAnswers((prev) => ({ ...prev, [scenarioIndex]: optionKey }));
  };

  const handleEnvironnementChange = (key: string, value: number) => {
    setEnvironnement((prev) => ({ ...prev, [key]: value }));
  };

  const canGoNext = () => {
    if (step === 0) return motivations.length === 2;
    if (step === 1) return Object.keys(scenarioAnswers).length >= 4;
    if (step === 2) return situationPro !== "" && tempsConsacre !== ""; // Now requires situation + temps
    if (step === 3) return true; // RIASEC + CV optionnels
    return false;
  };

  const createFallbackResults = () => ({
    personaData: {
      titre: "Votre profil entrepreneurial",
      synthese: "Nous finalisons votre analyse personnalisée. Vos résultats seront bientôt disponibles.",
      cap2_4semaines: "Définir une priorité claire pour avancer sereinement",
      forces: ["Motivation à entreprendre", "Engagement dans la démarche"],
      verrous: ["Analyse en cours de finalisation"],
      visualUrl: null,
    },
    zones_attention: [
      {
        id: 'zone-fallback-1',
        label: "Analyse en cours",
        recommendation: "Vos zones d'attention personnalisées sont en cours de génération. Revenez dans quelques instants.",
        severity: 2,
      }
    ],
    micro_actions: [
      {
        id: 'action-fallback-1',
        text: "Prendre le temps de réfléchir à votre projet",
        duree: "15-30min",
        status: 'todo',
        impact_attendu: "Clarifier votre vision",
        objectif: null,
        jauge_ciblee: null,
        period: 'once',
      }
    ],
    parcours: [],
    generatedAt: new Date().toISOString(),
    fallbackMode: true,
  });

  const handleNext = async () => {
    // 🎨 OPTIMISATION VITESSE : À la fin de l'étape 3, lancer l'IMAGE en temps masqué
    // L'image a besoin du Big5 (Step 2) et du Texte (Step 3) mais PAS du CV
    if (step === 2) {
      console.log('🎨 Temps masqué: Lancement génération IMAGE anticipée pendant étape 4...');
      
      const finalEquilibreValues = isCelibataire 
        ? { ...equilibreValues, couple: 50 } 
        : equilibreValues;
      
      // Stocker la promesse d'image pour récupérer plus tard
      const imageGenerationPromise = supabase.functions.invoke("generate-persona-visual", {
        body: {
          personaId: null, // Sera déterminé côté backend
          equilibreValues: finalEquilibreValues,
          motivations,
          champsLibre,
          scenarioAnswers,
        }
      });
      
      // Sauvegarder la promesse pour la récupérer à l'étape 4
      (window as any).__astrydImagePromise = imageGenerationPromise;
    }
    
    // 🎯 ÉTAPE 4/4 : SUBMIT FINAL - Génération PROFIL avec RIASEC + CV
    if (step === 4) {
      console.log("✅ Questionnaire complet terminé - Loader final");

      // 🔒 Override couple à 50 si célibataire
      const finalEquilibreValues = isCelibataire 
        ? { ...equilibreValues, couple: 50 } 
        : equilibreValues;
      
      // 🧠 PSYCHOLOGY FIRST : Calculer Big Five à partir des scénarios
      const computeBigFiveFromScenarios = () => {
        const bigFive = {
          ouverture: 50,
          conscienciosite: 50,
          extraversion: 50,
          agreabilite: 50,
          nevrosisme: 50
        };
        
        // Scénario 0: Incertitude
        if (scenarioAnswers[0] === "A") bigFive.nevrosisme = 75;
        else if (scenarioAnswers[0] === "B") bigFive.ouverture = 75;
        else if (scenarioAnswers[0] === "C") bigFive.conscienciosite = 75;
        
        // Scénario 1: Projet nouveau
        if (scenarioAnswers[1] === "A") bigFive.conscienciosite = Math.max(bigFive.conscienciosite, 75);
        else if (scenarioAnswers[1] === "B") bigFive.ouverture = Math.max(bigFive.ouverture, 75);
        else if (scenarioAnswers[1] === "C") bigFive.agreabilite = 75;
        
        // Scénario 2 & 3: Extraversion
        if (scenarioAnswers[2] === "A") bigFive.extraversion = 25;
        else if (scenarioAnswers[2] === "B") bigFive.extraversion = 75;
        else if (scenarioAnswers[2] === "C") bigFive.nevrosisme = Math.min(bigFive.nevrosisme, 25);
        
        if (scenarioAnswers[3] === "A") bigFive.extraversion = Math.min(bigFive.extraversion, 25);
        else if (scenarioAnswers[3] === "C") bigFive.extraversion = Math.max(bigFive.extraversion, 75);
        
        return bigFive;
      };
      
      const bigFiveValues = computeBigFiveFromScenarios();
      console.log('🧠 Big Five calculé:', bigFiveValues);
      
      // 🆕 SKILLS FIRST + PSYCHOLOGY FIRST : Inclure Big Five, RIASEC, CV
      const questionnaireData = {
        equilibreValues: finalEquilibreValues,
        motivations,
        scenarioAnswers,
        environnement,
        champsLibre,
        bigFiveValues, // 🆕 PSYCHOLOGY FIRST
        riasecValues,
        cvContent,
        situationPro,
        tempsConsacre,
        experienceEntrepreneuriale,
        causesEngagees,
        timestamp: Date.now()
      };

      sessionStorage.setItem('astryd_onboarding_data', JSON.stringify(questionnaireData));

      // Vérifier si l'utilisateur est authentifié
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session?.user;

      if (isAuthenticated) {
        localStorage.setItem('astryd_user_authenticated', 'true');
      } else {
        localStorage.setItem('astryd_user_authenticated', 'false');
      }

      setLoading(true);

      try {
        console.log('🚀 LAZY LOADING : Génération PROFIL avec RIASEC + CV');
        
        // 🔒 SÉCURITÉ 1: Timeout 60s pour éviter gel infini
        const API_TIMEOUT_MS = 60000;
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_60S')), API_TIMEOUT_MS)
        );
        
        const apiPromise = supabase.functions.invoke(
          "generate-persona-profile",
          { body: questionnaireData }
        );

        // Race entre l'API et le timeout
        let profileData: any;
        let profileError: any;
        
        try {
          const result = await Promise.race([apiPromise, timeoutPromise]);
          profileData = result.data;
          profileError = result.error;
        } catch (raceError: any) {
          if (raceError?.message === 'TIMEOUT_60S') {
            console.error('❌ Timeout 60s dépassé pour génération profil');
            toast.error("La génération prend trop de temps. Veuillez réessayer.");
            setLoading(false);
            return;
          }
          throw raceError;
        }

        if (profileError || !profileData || !profileData.titre) {
          console.error('❌ Erreur génération profil:', profileError);
          const fallbackResults = createFallbackResults();
          localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(fallbackResults));
          toast.error("Une erreur est survenue lors de la génération de votre profil. Redirection avec données partielles.");
          navigate('/profil-entrepreneurial?from=onboarding');
          return;
        }

        // Sauvegarder UNIQUEMENT le profil dans localStorage
        const resultsToStore = {
          personaData: {
            titre: profileData.titre || "Votre profil entrepreneurial",
            synthese: profileData.synthese || "Analyse en cours...",
            cap2_4semaines: profileData.cap2_4semaines || "Définir une priorité claire",
            forces: profileData.forces || [],
            verrous: profileData.verrous || [],
            visualUrl: null, // Sera mis à jour par l'image anticipée
          },
          micro_actions: [],
          zones_attention: [],
          parcours: [],
          generatedAt: new Date().toISOString(),
        };

        localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(resultsToStore));
        localStorage.setItem('ASTRYD_ASSESSMENT_DATA', JSON.stringify(questionnaireData));

        // 🔒 SÉCURITÉ 2: Vérification localStorage
        const savedData = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
        if (!savedData) {
          console.error('❌ ERREUR CRITIQUE: localStorage vide après sauvegarde');
          toast.error("Erreur sauvegarde navigateur. Veuillez réessayer.");
          setLoading(false);
          return;
        }

        // Vérifier que les données sont parsables et contiennent le minimum
        try {
          const parsed = JSON.parse(savedData);
          if (!parsed?.personaData?.titre) {
            console.error('❌ ERREUR: données sauvegardées incomplètes');
            toast.error("Erreur de sauvegarde des résultats. Veuillez réessayer.");
            setLoading(false);
            return;
          }
        } catch {
          console.error('❌ ERREUR: données localStorage non parsables');
          toast.error("Erreur de sauvegarde des résultats. Veuillez réessayer.");
          setLoading(false);
          return;
        }

        console.log('✅ Profil généré et sauvegardé (vérifié)');
        navigate('/profil-entrepreneurial?from=onboarding');

        // Nettoyer
        sessionStorage.removeItem('astryd_guest_results');
        sessionStorage.removeItem('astryd_persona_data');
        localStorage.removeItem('astryd_onboarding_draft_new');

        // 🎨 Récupérer l'image anticipée (lancée à l'étape 3)
        const imagePromise = (window as any).__astrydImagePromise;
        if (imagePromise) {
          imagePromise.then(({ data: visualData, error: visualError }: any) => {
            if (visualError || !visualData?.imageUrl) {
              console.warn('⚠️ Image anticipée non disponible, relance...');
              // Fallback: relancer la génération
              supabase.functions.invoke("generate-persona-visual", {
                body: {
                  personaId: profileData.personaId || "profil_entrepreneur",
                  equilibreValues: questionnaireData.equilibreValues,
                  motivations: questionnaireData.motivations,
                  champsLibre: questionnaireData.champsLibre,
                }
              }).then(({ data: retryData }) => {
                if (retryData?.imageUrl) {
                  updateImageInLocalStorage(retryData.imageUrl);
                }
              });
              return;
            }
            console.log('✅ Image anticipée récupérée avec succès');
            updateImageInLocalStorage(visualData.imageUrl);
          }).catch(() => {
            console.warn('⚠️ Erreur récupération image anticipée');
          });
          delete (window as any).__astrydImagePromise;
        }

        // Helper pour mise à jour image
        function updateImageInLocalStorage(imageUrl: string) {
          const currentResults = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
          if (currentResults) {
            const parsed = JSON.parse(currentResults);
            parsed.personaData.visualUrl = imageUrl;
            localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(parsed));
            window.dispatchEvent(new Event('astryd-data-update'));
            console.log('🔔 Image mise à jour dans localStorage');
          }
        }

        // 🎯 GÉNÉRATION MICRO-ACTIONS/ZONES/PARCOURS (avec RIASEC + CV)
        console.log('🎯 Lancement génération micro-actions/zones/parcours avec compétences...');
        supabase.functions.invoke("generate-persona-micro-actions", {
          body: questionnaireData
        }).then(({ data: actionsData, error: actionsError }) => {
          if (actionsError || !actionsData) {
            console.warn('⚠️ Micro-actions/zones non générées:', actionsError);
            return;
          }
          console.log('✅ Micro-actions/zones/parcours générés avec succès');
          
          const currentResults = localStorage.getItem('ASTRYD_COMPLETE_RESULTS');
          if (currentResults) {
            const parsed = JSON.parse(currentResults);
            parsed.micro_actions = actionsData.micro_actions || [];
            parsed.zones_attention = actionsData.zones_attention || [];
            parsed.parcours = actionsData.parcours || [];
            localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(parsed));
            window.dispatchEvent(new Event('astryd-data-update'));
          }
        }).catch((err) => {
          console.warn('⚠️ Erreur génération micro-actions:', err);
        });

      } catch (error) {
        console.error('❌ ERREUR génération:', error);
        const fallbackResults = createFallbackResults();
        localStorage.setItem('ASTRYD_COMPLETE_RESULTS', JSON.stringify(fallbackResults));
        toast.error("Une erreur est survenue", {
          description: "Des résultats partiels sont affichés. Veuillez réessayer.",
        });
        navigate('/profil-entrepreneurial?from=onboarding');
        return;
      }

      return;
    } 
    
    // 🎯 TRANSITIONS NORMALES ENTRE ÉTAPES (0→1, 1→2, 2→3)
    if (step < 4) {
      const nextStep = step + 1;
      
      const currentStepEl = document.querySelector(`[data-step="${step}"]`);
      if (currentStepEl) {
        currentStepEl.classList.add('animate-fade-out');
      }
      
      setTimeout(() => {
        setStep(nextStep);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (step > -1) {
      setStep(step - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  // Ancien: Soumission complète (avec idée) - conservé pour le questionnaire idée séparé
  const handleSubmit = () => {
    console.time('handleSubmit');
    
    const personaDataStr = sessionStorage.getItem('astryd_persona_data');
    const personaData = personaDataStr ? JSON.parse(personaDataStr) : null;
    
    const onboardingData = {
      existingIdeaId,
      motivations,
      equilibreValues,
      scenarioAnswers,
      environnement,
      champsLibre,
      title,
      description,
      riasecValues,
      cvContent,
      personaData,
      profileOnly: false,
      timestamp: Date.now()
    };
    
    localStorage.setItem('astryd_onboarding_pending', JSON.stringify(onboardingData));
    
    if (existingIdeaId) {
      localStorage.setItem('astryd_target_idea_id', existingIdeaId);
    }
    
    const draftKey = existingIdeaId 
      ? `astryd_onboarding_draft_${existingIdeaId}`
      : 'astryd_onboarding_draft_new';
    localStorage.removeItem(draftKey);
    
    console.timeEnd('handleSubmit');
    
    navigate("/profil-entrepreneurial?calculating=true");
  };

  const stepTitles = [
    "Vous & votre équilibre",
    "Votre manière d'agir",
    "Votre contexte & disponibilité",
    "Vos atouts",
  ];

  if (loadingPrefill || checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher le loader avec les étapes UNIQUEMENT après validation étape 4/4
  if (loading && step === 4) {
    return <LoadingProgress />;
  }


  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Bilan profil">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/auth')}
          className="text-sm"
        >
          Connexion
        </Button>
      </CommonHeader>

      {/* Draft Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprendre votre brouillon&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Nous avons retrouvé un brouillon de votre profil. Vous pouvez le reprendre là où vous vous étiez arrêté(e) ou repartir de zéro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>Repartir de zéro</AlertDialogCancel>
            <AlertDialogAction onClick={loadDraft}>Reprendre mon brouillon</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* INTRO SCREEN */}
        {step === -1 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-xl mx-auto text-center space-y-8 py-12"
          >
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
                Avant de commencer…
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Nous avons besoin de mieux vous connaître pour vous proposer un accompagnement personnalisé. Ce bilan rapide va nous permettre de calibrer vos micro-actions selon votre réalité entrepreneuriale.
              </p>
            </div>

            <div className="space-y-3 text-left max-w-sm mx-auto">
              {[
                { emoji: "⏱", text: "Durée : 2 minutes" },
                { emoji: "🎯", text: "Objectif : comprendre votre situation actuelle" },
                { emoji: "✨", text: "Résultat : un parcours adapté à vous" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => { localStorage.setItem("intro_bilan_seen", "true"); setStep(0); }}
              className="min-w-[200px]"
            >
              Lancer mon bilan
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* BILAN STEPS */}
        {step >= 0 && step <= 3 && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">
                    Étape {step + 1}/4 : {stepTitles[step]}
                  </p>
                  {lastSaved && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Save className="h-3 w-3" />
                      Sauvegardé automatiquement
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">≈ 2 min</p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${((step + 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Content avec animation de transition */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="p-6 md:p-8">
                {/* Step 0: Équilibre */}
                <div className={step === 0 ? "block" : "hidden"}>
                  <Bloc1EquilibreSection
                    values={isCelibataire ? { ...equilibreValues, couple: 50 } : equilibreValues}
                    motivations={motivations}
                    isCelibataire={isCelibataire}
                    onChange={handleEquilibreChange}
                    onMotivationsChange={setMotivations}
                    onCelibataireChange={setIsCelibataire}
                  />
                </div>

                {/* Step 1: Comportement */}
                <div className={step === 1 ? "block" : "hidden"}>
                  <Bloc2ComportementSection
                    scenarioAnswers={scenarioAnswers}
                    environnement={environnement}
                    onScenarioChange={handleScenarioChange}
                    onEnvironnementChange={handleEnvironnementChange}
                  />
                </div>

                {/* Step 2: Contexte & Situation */}
                <div className={step === 2 ? "space-y-6" : "hidden"}>
                  {/* Situation professionnelle actuelle */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Votre situation professionnelle actuelle *
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cela nous permet de calibrer nos conseils à votre réalité logistique
                    </p>
                    <div className="grid gap-2">
                      {[
                        { value: "salarie", label: "Salarié(e)" },
                        { value: "chomage", label: "En recherche d'emploi" },
                        { value: "independant", label: "Indépendant / Freelance" },
                        { value: "etudiant", label: "Étudiant(e)" },
                        { value: "transition", label: "En transition" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={situationPro === option.value ? "default" : "outline"}
                          onClick={() => setSituationPro(option.value)}
                          className="w-full justify-start text-left h-auto py-3"
                        >
                          {situationPro === option.value && <Check className="h-4 w-4 mr-2" />}
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Temps consacré au projet */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Temps que vous pouvez consacrer à votre projet *
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Soyez réaliste : l'IA adaptera l'ambition de ses conseils à cette contrainte
                    </p>
                    <div className="grid gap-2">
                      {[
                        { value: "soirwe", label: "Soirs et week-ends (<10h/sem)" },
                        { value: "mitemps", label: "Mi-temps (~20h/sem)" },
                        { value: "pleintemps", label: "Plein temps (35h+)" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={tempsConsacre === option.value ? "default" : "outline"}
                          onClick={() => setTempsConsacre(option.value)}
                          className="w-full justify-start text-left h-auto py-3"
                        >
                          {tempsConsacre === option.value && <Check className="h-4 w-4 mr-2" />}
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Sélecteur expérience entrepreneuriale */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Votre expérience entrepreneuriale
                    </Label>
                    <div className="grid gap-2">
                      {[
                        { value: "jamais", label: "Jamais entrepris" },
                        { value: "debutant", label: "Débutant (1-2 projets)" },
                        { value: "serial", label: "Serial entrepreneur" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={experienceEntrepreneuriale === option.value ? "default" : "outline"}
                          onClick={() => setExperienceEntrepreneuriale(option.value)}
                          className="w-full justify-start text-left h-auto py-3"
                        >
                          {experienceEntrepreneuriale === option.value && <Check className="h-4 w-4 mr-2" />}
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Causes qui touchent l'utilisateur */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Les causes qui vous touchent
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sélectionnez les thématiques qui résonnent avec vos valeurs (optionnel)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "environnement", label: "Environnement" },
                        { value: "social", label: "Social / Inclusion" },
                        { value: "sante", label: "Santé / Bien-être" },
                        { value: "education", label: "Éducation" },
                        { value: "techforgood", label: "Tech for Good" },
                        { value: "culture", label: "Art / Culture" },
                        { value: "local", label: "Local / Territoire" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={causesEngagees.includes(option.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (causesEngagees.includes(option.value)) {
                              setCausesEngagees(prev => prev.filter(c => c !== option.value));
                            } else {
                              setCausesEngagees(prev => [...prev, option.value]);
                            }
                          }}
                          className="transition-all"
                        >
                          {causesEngagees.includes(option.value) && <Check className="h-3 w-3 mr-1" />}
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Champ libre */}
                  <div>
                    <Label htmlFor="champsLibre" className="text-base font-semibold mb-2 block">
                      Ajoutez quelque chose sur vous ou votre environnement
                    </Label>
                    <Textarea
                      id="champsLibre"
                      placeholder="Y a-t-il quelque chose d'important à savoir sur votre situation, votre contexte, vos contraintes ou vos atouts ?"
                      value={champsLibre}
                      onChange={(e) => setChampsLibre(e.target.value)}
                      rows={4}
                      className="text-base"
                    />
                    
                    {/* Chips de suggestion */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["J'ai peur de me lancer", "Je pivote d'un projet précédent", "Je cherche des fonds"].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setChampsLibre(prev => prev ? `${prev} ${suggestion}` : suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      Ce champ est optionnel mais aide l'IA à mieux comprendre votre profil
                    </p>
                  </div>
                </div>

                {/* Step 3: Vos atouts (RIASEC + CV) */}
                <div className={step === 3 ? "block" : "hidden"}>
                  <Bloc4AtoutsSection
                    riasecValues={riasecValues}
                    cvContent={cvContent}
                    onRiasecChange={(key, value) => setRiasecValues(prev => ({ ...prev, [key]: value }))}
                    onCvChange={setCvContent}
                  />
                </div>

              {/* Les étapes idée ont été retirées - dans questionnaire séparé */}
            </Card>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canGoNext() || loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : step === 3 ? (
                  <>
                    Générer mon profil
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
                </Button>
              </div>
            </motion.div>
          </>
        )}

        {/* Step 4: Calendar planning */}
        {step === 4 && (
          <motion.div
            key="calendar-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-6 md:p-8">
              <CalendarStep onNext={handleNext} />
            </Card>
          </motion.div>
        )}
      </div>
      
      <GuestCodeModal
        open={showGuestCodeModal}
        onOpenChange={setShowGuestCodeModal}
        code={guestCode}
        expiresAt={guestCodeExpiry}
      />
      
      <CommonFooter pageTitle="Bilan d'alignement" />
    </div>
  );

};

export default OnboardingNew;
