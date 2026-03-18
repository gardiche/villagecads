import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Send, Loader2, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAstrydSession } from "@/hooks/useAstrydSession";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ChatJournalCardProps {
  ideaId: string;
  onEntryAdded?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
  ai_context?: {
    validationSuggestions?: {
      suggestedIds: string[];
      message: string;
    };
  };
}

const ChatJournalCard = ({ ideaId, onEntryAdded }: ChatJournalCardProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { logJournalMessage } = useAstrydSession();

  useEffect(() => {
    loadConversation();
  }, [ideaId]);

  // Scroll to last message when conversation loads
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    // Manual scroll when user clicks send
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("idea_id", ideaId)
      .not("sender", "is", null)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as unknown as Message[]);
    }
    setLoading(false);
  };

  const handleValidateAction = async (actionIds: string[]) => {
    try {
      for (const actionId of actionIds) {
        await supabase
          .from('micro_commitments')
          .update({ status: 'done' })
          .eq('id', actionId);
      }

      // Show celebration
      setCelebrationMessage(`🎉 ${actionIds.length} micro-action${actionIds.length > 1 ? 's validées' : ' validée'} !`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      toast.success(`✨ ${actionIds.length} micro-action${actionIds.length > 1 ? 's validées' : ' validée'} !`, {
        description: "Votre progression évolue.",
        duration: 5000,
      });

      // Reload conversation to update UI
      await loadConversation();
      
      // Trigger parent callback to refresh data
      if (onEntryAdded) {
        onEntryAdded();
      }
    } catch (error) {
      console.error('Error validating action:', error);
      toast.error("Erreur lors de la validation de l'action");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    const userMessage = input;
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-journal', {
        body: { ideaId, userMessage }
      });

      if (error) throw error;

      // Add both user and AI messages
      setMessages(prev => [...prev, data.userEntry, data.aiEntry]);
      
      // 📊 LOG: User sent a journal message
      await logJournalMessage(ideaId);
      
      // Show notification if new content was generated
      if (data.newContentGenerated) {
        toast.success("🎯 Votre coaching évolue !", {
          description: "De nouvelles zones d'attention ou micro-actions personnalisées ont été générées. Actualisez pour les découvrir.",
          action: {
            label: "Actualiser",
            onClick: () => {
              window.location.href = `/profil-entrepreneurial?cb=${Date.now()}`;
            }
          },
          duration: 10000,
        });
      }
      
      // Trigger parent callback
      if (onEntryAdded) {
        onEntryAdded();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 flex flex-col h-[500px] relative">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5 animate-scale-in" />
            <span className="font-semibold">{celebrationMessage}</span>
            <Sparkles className="h-5 w-5 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Journal de progression</h3>
        </div>
        
        <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            >
              <span>💬 Comment fonctionne le journal ?</span>
              {isExplanationOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="text-xs text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg border border-primary/20">
              <p className="font-semibold text-foreground mb-1">Votre coach personnel Astryd</p>
              <p>Je suis là pour vous accompagner dans votre réflexion. Au fil de nos échanges, je vais :</p>
              <ul className="mt-2 space-y-1 text-xs ml-4">
                <li>• Détecter vos freins et zones d'attention</li>
                <li>• Vous proposer des micro-actions adaptées (15-30 min)</li>
                <li>• Faire évoluer votre accompagnement en continu</li>
                <li>• Valider automatiquement les actions que vous mentionnez avoir complétées</li>
              </ul>
              <p className="mt-2 text-primary font-medium">Parlez-moi de vos doutes, avancées, questionnements. Je vous écoute. 🎯</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Commencez la conversation avec Astryd</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const hasSuggestions = msg.sender === 'ai' && msg.ai_context?.validationSuggestions;
            
            return (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {hasSuggestions && msg.ai_context?.validationSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t border-border flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">
                        {msg.ai_context.validationSuggestions.message}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleValidateAction(msg.ai_context!.validationSuggestions!.suggestedIds)}
                        className="ml-auto h-7 text-xs"
                      >
                        ✓ Oui, valider
                      </Button>
                    </motion.div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez à Astryd... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
          className="resize-none"
          rows={2}
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          size="icon"
          className="shrink-0 h-auto"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ChatJournalCard;
