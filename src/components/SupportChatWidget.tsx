import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Message {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    currentPage?: string;
  };
}

export const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [emailCollected, setEmailCollected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => {
    // Persister conversationId dans localStorage
    const stored = localStorage.getItem("astryd_support_conversation_id");
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem("astryd_support_conversation_id", newId);
    return newId;
  });
  const [sessionId] = useState(() => {
    // Persister sessionId dans localStorage
    const stored = localStorage.getItem("astryd_support_session_id");
    if (stored) return stored;
    const newId = `session_${Date.now()}`;
    localStorage.setItem("astryd_support_session_id", newId);
    return newId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if user is authenticated and listen for auth changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setEmailCollected(authenticated);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      setEmailCollected(authenticated);
      
      // Reset messages when auth state changes to show appropriate welcome message
      if (isOpen) {
        setMessages([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Message de bienvenue avec pré-remplissage contextuel
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const currentPath = window.location.pathname;
      const isPremiumPage = currentPath === "/history";
      
      // Pré-remplir le message si l'utilisateur ouvre le chat depuis une page premium bloquée
      if (isPremiumPage && !isAuthenticated) {
        setInputMessage("Comment puis-je y accéder ? Ça me demande un code");
      }
      
      setMessages([
        {
          role: "assistant",
          content: isAuthenticated 
            ? "Bonjour ! 👋 Je suis l'assistant support d'Astryd. Comment puis-je vous aider aujourd'hui ?"
            : "Bonjour ! 👋 Je suis l'assistant support d'Astryd. Avant de commencer, pourriez-vous me donner votre email pour que nous puissions vous recontacter si besoin ?",
        },
      ]);
    }
  }, [isOpen, isAuthenticated]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestEmail || !guestEmail.includes("@")) {
      toast({
        title: "Email invalide",
        description: "Veuillez saisir un email valide.",
        variant: "destructive",
      });
      return;
    }

    setEmailCollected(true);
    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: `Merci ${guestName || ""}! Comment puis-je vous aider aujourd'hui ?`,
      },
    ]);
  };

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
    const { data: { session } } = await supabase.auth.getSession();

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: JSON.stringify({
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
        })),
        conversationId,
        sessionId,
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Erreur lors de la connexion au chat");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantMessage = "";

    // Ajouter un message assistant vide qu'on va remplir progressivement
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantMessage += content;
            // Mettre à jour le dernier message assistant
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: assistantMessage,
              };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Sauvegarder la conversation complète
    await supabase.functions.invoke("save-support-conversation", {
      body: {
        conversationId,
        sessionId,
        assistantMessage,
        guestEmail: !isAuthenticated ? guestEmail : undefined,
        guestName: !isAuthenticated ? guestName : undefined,
      },
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });

    return assistantMessage;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
    
    // Pré-remplir automatiquement le message "demande code accès" si c'est le contexte
    const currentPath = window.location.pathname;
    const autoFilledMessage = currentPath === "/history" && inputMessage.trim() === "" 
      ? "Comment puis-je y accéder ? Ça me demande un code"
      : inputMessage;

    const userMessage: Message = {
      role: "user",
      content: autoFilledMessage,
      metadata: {
        currentPage: window.location.pathname,
      },
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 1. D'abord sauvegarder le message user en base de données
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from("support_messages").insert({
        user_id: session?.user?.id || null,
        guest_email: !isAuthenticated ? guestEmail : null,
        guest_name: !isAuthenticated ? guestName : null,
        conversation_id: conversationId,
        session_id: sessionId,
        role: "user",
        message: inputMessage.trim(),
      });
      
      // 2. Envoyer email notification pour le premier message
      const { count } = await supabase
        .from("support_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .eq("role", "user");
      
      if (count === 1) {
        // Premier message de la conversation, envoyer notif email
        await supabase.functions.invoke("send-support-message", {
          body: {
            message: inputMessage.trim(),
            guestEmail: !isAuthenticated ? guestEmail : undefined,
            guestName: !isAuthenticated ? guestName : undefined,
            userContext: {
              currentPage: window.location.pathname,
              conversationId,
              sessionId,
            },
          },
          headers: session?.access_token ? {
            Authorization: `Bearer ${session.access_token}`,
          } : undefined,
        });
      }
      
      // 3. Puis streamer la réponse IA
      await streamChat(userMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
      // Retirer le message assistant vide en cas d'erreur
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-sm bg-primary hover:bg-primary/90 z-[90]"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Support Astryd</SheetTitle>
            <SheetDescription>
              Posez vos questions, nous sommes là pour vous aider ! 🤖
            </SheetDescription>
          </SheetHeader>

          {/* Email collection form for guests */}
          {!emailCollected && !isAuthenticated && (
            <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="guestName" className="text-sm font-medium">
                  Votre nom (optionnel)
                </label>
                <Input
                  id="guestName"
                  placeholder="Jean Dupont"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="guestEmail" className="text-sm font-medium">
                  Votre email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Démarrer la conversation
              </Button>
            </form>
          )}

          {/* Chat messages */}
          {emailCollected && (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 my-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};