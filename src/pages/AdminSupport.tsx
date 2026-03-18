import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, User, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import logo from "@/assets/logo-gradient.svg";
import AccountDropdown from "@/components/dashboard/AccountDropdown";

interface SupportMessage {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  conversation_id: string;
  session_id: string | null;
  role: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ConversationGroup {
  conversation_id: string;
  user_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  messages: SupportMessage[];
  last_message_at: string;
  unread_count: number;
}

const AdminSupport = () => {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Grouper les messages par conversation
      const grouped = messages?.reduce((acc, msg) => {
        const existing = acc.find((g) => g.conversation_id === msg.conversation_id);
        if (existing) {
          existing.messages.push(msg);
          if (msg.role === "user" && !msg.read) {
            existing.unread_count++;
          }
        } else {
          acc.push({
            conversation_id: msg.conversation_id,
            user_id: msg.user_id,
            guest_email: msg.guest_email,
            guest_name: msg.guest_name,
            messages: [msg],
            last_message_at: msg.created_at,
            unread_count: msg.role === "user" && !msg.read ? 1 : 0,
          });
        }
        return acc;
      }, [] as ConversationGroup[]) || [];

      // Trier par message le plus récent
      grouped.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      // Trier les messages dans chaque conversation par date croissante
      grouped.forEach(conv => {
        conv.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setConversations(grouped);
      setLoading(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Erreur lors du chargement des conversations");
      setLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("role", "user")
        .eq("read", false);

      if (error) throw error;

      // Recharger les conversations
      await loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const selectConversation = async (conv: ConversationGroup) => {
    setSelectedConversation(conv);
    if (conv.unread_count > 0) {
      await markAsRead(conv.conversation_id);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insérer le message admin
      const { error: insertError } = await supabase
        .from("support_messages")
        .insert({
          user_id: selectedConversation.user_id,
          guest_email: selectedConversation.guest_email,
          guest_name: selectedConversation.guest_name,
          conversation_id: selectedConversation.conversation_id,
          session_id: selectedConversation.messages[0]?.session_id,
          role: "admin",
          message: replyMessage,
        });

      if (insertError) throw insertError;

      // Envoyer email de notification
      const { error: emailError } = await supabase.functions.invoke("send-admin-reply-email", {
        body: {
          conversationId: selectedConversation.conversation_id,
          userEmail: selectedConversation.guest_email,
          userName: selectedConversation.guest_name,
          replyMessage,
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        toast.warning("Réponse envoyée mais email de notification échoué");
      } else {
        toast.success("Réponse envoyée avec succès");
      }

      setReplyMessage("");
      await loadConversations();
      
      // Mettre à jour la conversation sélectionnée
      const updatedConv = conversations.find(c => c.conversation_id === selectedConversation.conversation_id);
      if (updatedConv) {
        setSelectedConversation(updatedConv);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Erreur lors de l'envoi de la réponse");
    } finally {
      setSending(false);
    }
  };

  const getUserDisplay = (conv: ConversationGroup) => {
    if (conv.user_id) {
      return `Utilisateur connecté (${conv.user_id.slice(0, 8)}...)`;
    }
    return conv.guest_name || conv.guest_email || "Visiteur anonyme";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple header without sidebar dependency */}
      <header className="sticky top-0 z-[40] bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Astryd" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground">
                Astryd - Support Admin
              </span>
            </div>
            <AccountDropdown />
          </div>
        </div>
      </header>
      
      <div className="flex-1 container max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            Support Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les conversations de support des utilisateurs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Liste des conversations */}
          <Card className="md:col-span-1">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
              <p className="text-sm text-muted-foreground">
                {conversations.length} conversation(s)
              </p>
            </div>
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Chargement...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Aucune conversation
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? "bg-muted"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {conv.user_id ? (
                            <User className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <p className="font-medium text-sm truncate">
                            {getUserDisplay(conv)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.messages[conv.messages.length - 1]?.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Détail de la conversation */}
          <Card className="md:col-span-2">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-semibold">{getUserDisplay(selectedConversation)}</h2>
                  {selectedConversation.guest_email && (
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.guest_email}
                    </p>
                  )}
                </div>
                
                <ScrollArea className="h-[450px] p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-start"
                            : msg.role === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === "user"
                              ? "bg-muted"
                              : msg.role === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {msg.role === "user"
                                ? "Utilisateur"
                                : msg.role === "admin"
                                ? "Admin"
                                : "Assistant IA"}
                            </Badge>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs mt-2 opacity-70">
                            {formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                <div className="p-4 space-y-3">
                  <Textarea
                    placeholder="Écrivez votre réponse..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || sending}
                    className="w-full"
                  >
                    {sending ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer la réponse
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une conversation pour voir les détails</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
