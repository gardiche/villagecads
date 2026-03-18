import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Send, Loader2, MessageSquarePlus, Target, AlertTriangle, Layers, Rocket, X, MessageSquare } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import CTAFooter from "@/components/dashboard/CTAFooter";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import { LoginGateModal } from "@/components/dashboard/LoginGateModal";

interface JournalEntry {
  id: string;
  content: string;
  sender: string;
  created_at: string;
}

const Journal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const ideaId = searchParams.get("ideaId");
  
  // Récupérer le topic suggéré depuis la navigation (ex: depuis "Mes actions")
  const suggestedTopic = (location.state as { suggestedTopic?: string })?.suggestedTopic || null;
  const [showSuggestedBanner, setShowSuggestedBanner] = useState(!!suggestedTopic);
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Visiteur sans compte et sans idée : charger un message de bienvenue local
        if (!user && !ideaId) {
          await loadEntries();
          return;
        }

        // Utilisateur connecté sans ideaId : récupérer l'idée la plus récente si elle existe
        if (user && !ideaId) {
          const { data: latestIdea } = await supabase
            .from("ideas")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestIdea?.id) {
            navigate(`/journal?ideaId=${latestIdea.id}`, { replace: true });
            return;
          }

          // Pas d'idée : continuer avec journal basé profil seul
          loadEntries();
          return;
        }

        // Cas normal : ideaId présent
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        loadEntries();
      } catch (e) {
        console.error("Error initializing Journal:", e);
        setLoading(false);
      }
    };

    init();
  }, [ideaId, navigate]);

  // Auto-scroll quand les messages changent
  useEffect(() => {
    if (entries.length > 0) {
      scrollToBottom();
    }
  }, [entries]);

  const loadEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // Mode invité : afficher un message de bienvenue proactif en mémoire sans accès base
    if (!user) {
      const welcomeMessage = `Bonjour. Je suis votre coach.

Vous pouvez vider votre sac ici, mais je vous suggère de commencer par l'une de ces pistes :

1. **Prioriser votre journée** — Qu'est-ce qui mérite vraiment votre énergie aujourd'hui ?
2. **Analyser un blocage spécifique** — Y a-t-il quelque chose qui vous freine en ce moment ?
3. **Préparer un rendez-vous clé** — Une réunion importante à venir que vous voulez aborder sereinement ?

Par quoi souhaitez-vous commencer ?`;

      const entry: JournalEntry = {
        id: "guest-welcome",
        content: welcomeMessage,
        sender: "ai",
        created_at: new Date().toISOString(),
      };
      setEntries([entry]);
      setLoading(false);
      return;
    }

    // Charger les entrées du journal (avec ou sans ideaId)
    let query = supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id);

    if (ideaId) {
      query = query.eq("idea_id", ideaId);
    } else {
      query = query.is("idea_id", null);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (!error && data) {
      // Si aucun message n'existe encore, créer un message de bienvenue proactif
      if (data.length === 0) {
        const welcomeMessage = `Bonjour. Je suis votre coach.

Vous pouvez vider votre sac ici, mais je vous suggère de commencer par l'une de ces pistes :

1. **Prioriser votre journée** — Qu'est-ce qui mérite vraiment votre énergie aujourd'hui ?
2. **Analyser un blocage spécifique** — Y a-t-il quelque chose qui vous freine en ce moment ?
3. **Préparer un rendez-vous clé** — Une réunion importante à venir que vous voulez aborder sereinement ?

Par quoi souhaitez-vous commencer ?`;

        const { data: welcomeEntry, error: welcomeError } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            idea_id: ideaId || null,
            sender: "ai",
            content: welcomeMessage,
          })
          .select()
          .single();

        if (!welcomeError && welcomeEntry) {
          setEntries([welcomeEntry]);
        }
      } else {
        setEntries(data);
      }
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    // ✅ CORRECTION BUG #3 : Vérifier l'auth en temps réel, pas depuis le state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowLoginGate(true);
      return;
    }

    setSending(true);
    try {
      // Sauvegarder temporairement le message pour l'affichage optimiste
      const tempUserEntry = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: "user",
        created_at: new Date().toISOString(),
      };

      setEntries([...entries, tempUserEntry]);
      const messageToSend = newMessage;
      setNewMessage("");

      // ✅ Tracker automatique : marquer le journal comme démarré
      const existingEntries = JSON.parse(localStorage.getItem('ASTRYD_JOURNAL_ENTRIES') || '[]');
      existingEntries.push({ id: tempUserEntry.id, timestamp: new Date().toISOString() });
      localStorage.setItem('ASTRYD_JOURNAL_ENTRIES', JSON.stringify(existingEntries));

      // Appeler l'edge function qui va sauvegarder le message user ET générer la réponse
      const { data: coachResponse, error: coachError } = await supabase.functions.invoke('chat-journal', {
        body: {
          ideaId: ideaId || null,
          userMessage: messageToSend,
        }
      });

      if (coachError) {
        console.error("Error getting coach response:", coachError);
        toast.error("Erreur lors de la réponse du coach");
        // Recharger depuis la DB en cas d'erreur
        loadEntries();
      } else if (coachResponse?.userEntry && coachResponse?.aiEntry) {
        // Remplacer le message temporaire par les vrais messages depuis la DB
        setEntries(prev => {
          const withoutTemp = prev.filter(e => e.id !== tempUserEntry.id);
          return [...withoutTemp, coachResponse.userEntry, coachResponse.aiEntry];
        });
        
        // Dispatch event pour mettre à jour les autres composants
        window.dispatchEvent(new Event('astryd-data-update'));
        
        // Toaster de confirmation
        toast.success("Message envoyé", {
          description: "Votre réflexion a été prise en compte par votre coach IA.",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi");
      // Recharger depuis la DB en cas d'erreur
      loadEntries();
    } finally {
      setSending(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          currentIdeaId={ideaId || undefined}
          onOpenCoaching={() => setShowCoachingModal(true)}
        />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Journal entrepreneurial" />
          
          <main className="flex-1 flex flex-col p-3 md:p-8 max-w-5xl mx-auto w-full min-h-0">
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
              <div className="flex-shrink-0">
                <h1 className="font-display text-xl md:text-3xl font-bold mb-1 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  Journal
                </h1>
              </div>

              <Card className="p-4 md:p-6 flex flex-col h-[calc(100dvh-10rem)] md:h-auto md:min-h-[500px]">
                {loading ? (
                  <div className="flex items-center justify-center flex-1">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pb-safe">
                      {entries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                          <p className="font-medium mb-2">Commencez votre dialogue</p>
                          <p className="text-sm leading-relaxed">
                            Partagez librement vos réflexions pour recevoir un accompagnement personnalisé.
                          </p>
                        </div>
                      ) : (
                        entries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`flex ${entry.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-4 ${
                                entry.sender === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {entry.sender === "ai" && (
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                  <span className="font-semibold text-sm">Coach IA</span>
                                </div>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                              <p className={`text-xs mt-2 ${entry.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatDistanceToNow(new Date(entry.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input - sticky on mobile */}
                    <div className="space-y-3 border-t pt-4 sticky bottom-0 bg-background">
                      {/* Bannière de suggestion contextuelle (depuis Mes actions) */}
                      {showSuggestedBanner && suggestedTopic && (
                        <div className="flex items-center justify-between gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                          <div className="flex items-center gap-2 text-primary">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span>{suggestedTopic}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSuggestedBanner(false)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Conversation Starters - Chips dynamiques */}
                      {entries.length <= 2 && !showSuggestedBanner && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              setNewMessage("🎯 J'aimerais que tu challenges ma posture entrepreneuriale actuelle.");
                              setTimeout(() => handleSend(), 100);
                            }}
                            disabled={sending}
                          >
                            <Target className="h-3 w-3 mr-1" />
                            Challenger ma posture
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              setNewMessage("🌪️ J'ai un doute ou un blocage que j'aimerais explorer.");
                              setTimeout(() => handleSend(), 100);
                            }}
                            disabled={sending}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            J'ai un doute / blocage
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              setNewMessage("🏗️ J'aimerais structurer ma pensée sur mon projet.");
                              setTimeout(() => handleSend(), 100);
                            }}
                            disabled={sending}
                          >
                            <Layers className="h-3 w-3 mr-1" />
                            Structurer ma pensée
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
                              setNewMessage("🚀 Aide-moi à définir ma prochaine action concrète.");
                              setTimeout(() => handleSend(), 100);
                            }}
                            disabled={sending}
                          >
                            <Rocket className="h-3 w-3 mr-1" />
                            Définir ma prochaine action
                          </Button>
                        </div>
                      )}
                      
                      <Textarea
                        placeholder="Partagez vos réflexions, doutes, avancées..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={3}
                        className="resize-none text-base md:text-sm"
                        style={{ fontSize: '16px' }}
                        disabled={sending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="w-full min-h-[44px]"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Réflexion en cours...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer mon message
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>

            <CTAFooter 
              onProgressionClick={() => {
                const hasProgressionAccess = localStorage.getItem("astryd_progression_access") === "granted";
                if (hasProgressionAccess) {
                  navigate(ideaId ? `/history?ideaId=${ideaId}` : "/history");
                } else {
                  setShowProgressionModal(true);
                }
              }}
              onCoachingClick={() => setShowCoachingModal(true)}
            />
          </main>
        </div>
      </div>

      <ProgressionAccessModal 
        open={showProgressionModal} 
        onOpenChange={setShowProgressionModal}
      />
      <CoachingComingSoonModal 
        open={showCoachingModal} 
        onOpenChange={setShowCoachingModal}
      />
      <LoginGateModal
        open={showLoginGate}
        onOpenChange={setShowLoginGate}
        action="journal"
      />
    </SidebarProvider>
  );
};

export default Journal;
