import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, RefreshCw, User, Mail, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
  conversationId: string;
  messages: SupportMessage[];
  lastMessageAt: string;
  userInfo: {
    userId: string | null;
    guestEmail: string | null;
    guestName: string | null;
  };
  hasUnread: boolean;
}

interface AdminSupportSectionProps {
  onStatsUpdate?: () => void;
}

export default function AdminSupportSection({ onStatsUpdate }: AdminSupportSectionProps) {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation_id
      const grouped = (data || []).reduce((acc: { [key: string]: ConversationGroup }, msg) => {
        if (!acc[msg.conversation_id]) {
          acc[msg.conversation_id] = {
            conversationId: msg.conversation_id,
            messages: [],
            lastMessageAt: msg.created_at,
            userInfo: {
              userId: msg.user_id,
              guestEmail: msg.guest_email,
              guestName: msg.guest_name,
            },
            hasUnread: false,
          };
        }
        acc[msg.conversation_id].messages.push(msg);
        if (msg.role === "user" && !msg.read) {
          acc[msg.conversation_id].hasUnread = true;
        }
        return acc;
      }, {});

      // Sort conversations by last message
      const sortedConversations = Object.values(grouped).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      // Sort messages within each conversation
      sortedConversations.forEach(conv => {
        conv.messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setConversations(sortedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Échec du chargement des conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from("support_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("role", "user")
        .eq("read", false);

      loadConversations();
      onStatsUpdate?.();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const selectConversation = (conv: ConversationGroup) => {
    setSelectedConversation(conv);
    if (conv.hasUnread) {
      markAsRead(conv.conversationId);
    }
  };

  const sendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: selectedConversation.conversationId,
        session_id: selectedConversation.messages[0]?.session_id,
        user_id: selectedConversation.userInfo.userId,
        guest_email: selectedConversation.userInfo.guestEmail,
        guest_name: selectedConversation.userInfo.guestName,
        role: "admin",
        message: replyMessage.trim(),
        read: true,
      });

      if (error) throw error;

      toast.success("Réponse envoyée");
      setReplyMessage("");
      loadConversations();
      onStatsUpdate?.();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Échec de l'envoi de la réponse");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Conversations</h3>
            <Button variant="outline" size="sm" onClick={loadConversations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune conversation
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card
                    key={conv.conversationId}
                    className={`cursor-pointer transition-colors ${
                      selectedConversation?.conversationId === conv.conversationId
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => selectConversation(conv)}
                  >
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {conv.userInfo.userId ? (
                            <User className="h-4 w-4 text-primary" />
                          ) : (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {conv.userInfo.guestName || conv.userInfo.guestEmail || "Utilisateur"}
                          </span>
                        </div>
                        {conv.hasUnread && (
                          <Badge variant="destructive" className="text-xs">Nouveau</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{conv.messages.length} messages</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{new Date(conv.lastMessageAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.messages[conv.messages.length - 1]?.message}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Conversation Detail */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          {!selectedConversation ? (
            <div className="flex items-center justify-center h-[600px] text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info Header */}
              <div className="pb-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  {selectedConversation.userInfo.userId ? (
                    <>
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Utilisateur connecté</span>
                      <Badge variant="secondary">ID: {selectedConversation.userInfo.userId.slice(0, 8)}</Badge>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">Visiteur</span>
                      <Badge variant="outline">{selectedConversation.userInfo.guestEmail}</Badge>
                    </>
                  )}
                </div>
                {selectedConversation.userInfo.guestName && (
                  <p className="text-sm text-muted-foreground">
                    Nom: {selectedConversation.userInfo.guestName}
                  </p>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "admin"
                            ? "bg-primary text-primary-foreground"
                            : msg.role === "assistant"
                            ? "bg-accent"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={msg.role === "admin" ? "secondary" : "outline"} className="text-xs">
                            {msg.role === "admin" ? "Admin" : msg.role === "assistant" ? "IA" : "Utilisateur"}
                          </Badge>
                          {msg.read && msg.role !== "admin" && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(msg.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Form */}
              <div className="space-y-2 pt-4 border-t">
                <Textarea
                  placeholder="Tapez votre réponse..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || isSending}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la réponse
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
