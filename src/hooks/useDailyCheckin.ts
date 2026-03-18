import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

export interface DailyCheckin {
  id: string;
  user_id: string;
  created_at: string;
  energy_level: number;
  clarity_level: number;
  mood_level: number;
  journal_entry: string | null;
  shared_with_mentor: boolean;
}

export interface DailyMicroAction {
  id: string;
  user_id: string;
  checkin_id: string | null;
  created_at: string;
  title: string;
  status: "pending" | "done" | "skipped";
  feeling_after: "relieved" | "proud" | "still_stuck" | null;
  action_type: "rest" | "small_win" | "progress";
  duree?: string;
  contexte?: string;
  sujet_detecte?: string;
}

interface ContextualActionResponse {
  action: string;
  duree: string;
  contexte: string;
  type: "securisation" | "regulation" | "progression" | "calibrage";
  urgence_detectee: boolean;
  sujet_detecte?: string;
}

export const useDailyCheckin = () => {
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [todayActions, setTodayActions] = useState<DailyMicroAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFirstCheckinEver, setIsFirstCheckinEver] = useState(false);
  const { toast } = useToast();

  // Charger le check-in du jour
  const fetchTodayCheckin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Récupérer le check-in du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: checkin, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setTodayCheckin(checkin as DailyCheckin | null);

      // Charger les micro-actions associées
      if (checkin) {
        const { data: actions, error: actionsError } = await supabase
          .from("daily_micro_actions")
          .select("*")
          .eq("checkin_id", checkin.id)
          .order("created_at", { ascending: true });

        if (actionsError) throw actionsError;
        setTodayActions((actions as DailyMicroAction[]) || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du check-in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayCheckin();
  }, []);

  // Générer une action contextuelle via l'edge function
  const generateContextualAction = async (checkinData: {
    energy: number;
    clarity: number;
    mood: number;
    journalText?: string;
  }): Promise<ContextualActionResponse | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contextual-action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ checkinData }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Limite atteinte",
            description: "Réessayez dans quelques instants.",
            variant: "destructive",
          });
          return null;
        }
        throw new Error("Erreur API");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur génération action contextuelle:", error);
      return null;
    }
  };

  // Créer un check-in
  const createCheckin = async (data: {
    energy_level: number;
    clarity_level: number;
    mood_level: number;
    journal_entry?: string;
    shared_with_mentor: boolean;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: checkin, error } = await supabase
        .from("daily_checkins")
        .insert({
          user_id: user.id,
          energy_level: data.energy_level,
          clarity_level: data.clarity_level,
          mood_level: data.mood_level,
          journal_entry: data.journal_entry,
          shared_with_mentor: data.shared_with_mentor,
        })
        .select()
        .single();

      if (error) throw error;

      setTodayCheckin(checkin as DailyCheckin);

      // Tenter de générer une action contextuelle via l'IA
      const contextualAction = await generateContextualAction({
        energy: data.energy_level,
        clarity: data.clarity_level,
        mood: data.mood_level,
        journalText: data.journal_entry,
      });

      let actionTitle: string;
      let actionType: "rest" | "small_win" | "progress";
      let actionDuree: string | undefined;
      let actionContexte: string | undefined;
      let actionSujetDetecte: string | undefined;

      if (contextualAction) {
        actionTitle = contextualAction.action;
        actionDuree = contextualAction.duree;
        actionContexte = contextualAction.contexte;
        actionSujetDetecte = contextualAction.sujet_detecte;
        // Mapper le type de l'IA vers notre type
        switch (contextualAction.type) {
          case "securisation":
            actionType = "small_win";
            break;
          case "regulation":
            actionType = "rest";
            break;
          case "progression":
            actionType = "progress";
            break;
          case "calibrage":
            actionType = "small_win";
            break;
          default:
            actionType = data.energy_level < 4 ? "rest" : "progress";
        }
      } else {
        // Fallback sur génération locale
        actionType = data.energy_level < 4 
          ? (Math.random() > 0.5 ? "rest" : "small_win")
          : "progress";
        actionTitle = generateActionTitle(actionType, data.energy_level);
      }

      const { data: action, error: actionError } = await supabase
        .from("daily_micro_actions")
        .insert({
          user_id: user.id,
          checkin_id: checkin.id,
          title: actionTitle,
          action_type: actionType,
          status: "pending",
        })
        .select()
        .single();

      if (actionError) throw actionError;
      
      // Enrichir avec les métadonnées contextuelles
      const enrichedAction = {
        ...(action as DailyMicroAction),
        duree: actionDuree,
        contexte: actionContexte,
        sujet_detecte: actionSujetDetecte,
      };
      
      setTodayActions([enrichedAction]);

      // Check if this is the user's first check-in ever
      const { count: checkinCount } = await supabase
        .from("daily_checkins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      const isFirstEver = checkinCount === 1;
      setIsFirstCheckinEver(isFirstEver);

      // Trigger confetti for first check-in celebration
      if (isFirstEver) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9b87f5', '#6366f1', '#f59e0b', '#22c55e']
        });
      }

      toast({
        title: isFirstEver ? "🎉 Premier check-in complété !" : "Check-in enregistré !",
        description: data.energy_level < 4 
          ? "Mode Régénération activé. Prenez soin de vous."
          : "Mode Action activé. C'est parti !",
      });

      return checkin;
    } catch (error) {
      console.error("Erreur lors de la création du check-in:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le check-in.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Régénérer une action contextuelle
  const regenerateAction = async (actionId: string) => {
    if (!todayCheckin) return;
    
    setIsRegenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const contextualAction = await generateContextualAction({
        energy: todayCheckin.energy_level,
        clarity: todayCheckin.clarity_level,
        mood: todayCheckin.mood_level,
        journalText: todayCheckin.journal_entry || undefined,
      });

      if (!contextualAction) {
        toast({
          title: "Impossible de générer une nouvelle action",
          description: "Réessayez dans quelques instants.",
          variant: "destructive",
        });
        return;
      }

      // Mapper le type
      let actionType: "rest" | "small_win" | "progress";
      switch (contextualAction.type) {
        case "securisation":
          actionType = "small_win";
          break;
        case "regulation":
          actionType = "rest";
          break;
        case "progression":
          actionType = "progress";
          break;
        default:
          actionType = todayCheckin.energy_level < 4 ? "rest" : "progress";
      }

      // Mettre à jour l'action existante
      const { error } = await supabase
        .from("daily_micro_actions")
        .update({
          title: contextualAction.action,
          action_type: actionType,
          status: "pending",
        })
        .eq("id", actionId);

      if (error) throw error;

      // Mettre à jour l'état local
      setTodayActions(prev => 
        prev.map(a => a.id === actionId 
          ? { 
              ...a, 
              title: contextualAction.action, 
              action_type: actionType,
              status: "pending" as const,
              duree: contextualAction.duree,
              contexte: contextualAction.contexte,
              sujet_detecte: contextualAction.sujet_detecte,
            } 
          : a
        )
      );

      toast({
        title: "Nouvelle action générée",
        description: contextualAction.urgence_detectee 
          ? "Action de sécurisation détectée suite à une urgence."
          : "Action adaptée à votre état actuel.",
      });
    } catch (error) {
      console.error("Erreur lors de la régénération:", error);
      toast({
        title: "Erreur",
        description: "Impossible de régénérer l'action.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Mettre à jour le statut d'une micro-action
  const updateActionStatus = async (
    actionId: string, 
    status: "done" | "skipped",
    feeling_after?: "relieved" | "proud" | "still_stuck"
  ) => {
    try {
      const { error } = await supabase
        .from("daily_micro_actions")
        .update({ 
          status, 
          feeling_after: feeling_after || null 
        })
        .eq("id", actionId);

      if (error) throw error;

      setTodayActions(prev => 
        prev.map(a => a.id === actionId 
          ? { ...a, status, feeling_after: feeling_after || null } 
          : a
        )
      );

      if (status === "done" && feeling_after) {
        toast({
          title: "Bravo ! 🎉",
          description: getFeelingMessage(feeling_after),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'action.",
        variant: "destructive",
      });
    }
  };

  return {
    todayCheckin,
    todayActions,
    isLoading,
    isRegenerating,
    createCheckin,
    updateActionStatus,
    regenerateAction,
    refetch: fetchTodayCheckin,
  };
};

// Générateur de titre d'action simulé (fallback)
function generateActionTitle(type: string, energy: number): string {
  const restActions = [
    "Prendre 10 minutes de pause sans écran",
    "Faire une courte marche dehors",
    "Boire un grand verre d'eau et respirer",
    "Écouter une musique qui vous apaise",
  ];

  const smallWinActions = [
    "Ranger un petit espace de travail",
    "Envoyer un message de gratitude à quelqu'un",
    "Compléter une tâche en moins de 5 minutes",
    "Noter une chose positive de la journée",
  ];

  const progressActions = [
    "Avancer sur votre priorité n°1 pendant 25 minutes",
    "Contacter une personne clé pour votre projet",
    "Rédiger ou réviser un document important",
    "Planifier la prochaine étape concrète",
  ];

  const actions = type === "rest" ? restActions 
    : type === "small_win" ? smallWinActions 
    : progressActions;

  return actions[Math.floor(Math.random() * actions.length)];
}

function getFeelingMessage(feeling: string): string {
  switch (feeling) {
    case "relieved":
      return "C'est bon de se libérer l'esprit. Continuez ainsi !";
    case "proud":
      return "Cette fierté est méritée. Vous avancez !";
    case "still_stuck":
      return "C'est normal d'avoir des moments difficiles. Demain est un nouveau jour.";
    default:
      return "Bien joué !";
  }
}
