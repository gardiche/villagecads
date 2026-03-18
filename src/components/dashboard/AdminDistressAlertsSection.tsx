import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, User, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface DistressAlert {
  id: string;
  user_id: string;
  created_at: string;
  entry_type: string | null;
  sender: string;
}

interface UserDistressGroup {
  user_id: string;
  alerts: DistressAlert[];
  latest_at: string;
  alertCount: number;
}

export default function AdminDistressAlertsSection() {
  const [groups, setGroups] = useState<UserDistressGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    loadDistressAlerts();
  }, []);

  const loadDistressAlerts = async () => {
    try {
      // Use secure RPC function — returns only metadata, NO content
      const { data, error } = await supabase.rpc("get_distress_alerts");

      if (error) throw error;

      // Group by user_id
      const grouped = ((data as DistressAlert[]) || []).reduce((acc, alert) => {
        const existing = acc.find((g) => g.user_id === alert.user_id);
        if (existing) {
          existing.alerts.push(alert);
          existing.alertCount++;
        } else {
          acc.push({
            user_id: alert.user_id,
            alerts: [alert],
            latest_at: alert.created_at,
            alertCount: 1,
          });
        }
        return acc;
      }, [] as UserDistressGroup[]);

      grouped.sort((a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime());

      setGroups(grouped);
    } catch (error) {
      console.error("Error loading distress alerts:", error);
      toast.error("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          Chargement des alertes...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Alertes Détresse Psychologique
        </CardTitle>
        <CardDescription>
          Signaux de détresse détectés (flag uniquement — contenu non accessible pour préserver la confidentialité).
          {groups.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {groups.length} utilisateur{groups.length > 1 ? "s" : ""} concerné{groups.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucune alerte détectée</p>
            <p className="text-sm mt-1">Aucune entrée de journal n'a été flaggée pour le moment.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {groups.map((group) => (
                <Card key={group.user_id} className="border-destructive/30">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(group.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Utilisateur {group.user_id.slice(0, 8)}...
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Dernière alerte :{" "}
                            {formatDistanceToNow(new Date(group.latest_at), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {group.alertCount} alerte{group.alertCount > 1 ? "s" : ""}
                        </Badge>
                        {expandedUser === group.user_id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedUser === group.user_id && (
                    <div className="border-t px-4 pb-4">
                      <div className="space-y-3 mt-3">
                        {group.alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="rounded-lg border p-3 bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {alert.sender === "user" ? "Message utilisateur" : "Réponse IA"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Contenu non accessible — seul le flag de détresse est visible.
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(group.user_id);
                            toast.success("User ID copié");
                          }}
                        >
                          Copier User ID
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "/account/admin/support";
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contacter via Support
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
