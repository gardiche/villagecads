import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Bug, Activity, Key, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import AccountPageLayout from "@/components/AccountPageLayout";
import AdminDebugLogsSection from "@/components/dashboard/AdminDebugLogsSection";
import AdminSupportSection from "@/components/dashboard/AdminSupportSection";
import AdminBetaCodesSection from "@/components/dashboard/AdminBetaCodesSection";
import AdminUsersSection from "@/components/dashboard/AdminUsersSection";
import AdminDistressAlertsSection from "@/components/dashboard/AdminDistressAlertsSection";
import NavigationDebugger from "@/components/NavigationDebugger";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    unreadMessages: 0,
    recentLogs: 0,
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !roleData) {
        toast.error("Accès refusé : rôle administrateur requis");
        navigate("/profil-entrepreneurial");
        return;
      }

      setIsAdmin(true);
      loadStats();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/profil-entrepreneurial");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count total users from auth
      const { count: usersCount } = await supabase
        .from("user_assessments")
        .select("*", { count: "exact", head: true });

      // Count unread support messages
      const { count: unreadCount } = await supabase
        .from("support_messages")
        .select("*", { count: "exact", head: true })
        .eq("role", "user")
        .eq("read", false);

      // Count recent logs (last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: logsCount } = await supabase
        .from("astryd_debug_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        unreadMessages: unreadCount || 0,
        recentLogs: logsCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AccountPageLayout>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard Administrateur</h1>
          <p className="text-muted-foreground">
            Gestion centralisée des logs, debug et support
          </p>
        </div>


        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Utilisateurs totaux
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Messages non lus
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Logs (24h)
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentLogs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="distress" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="distress">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="analytics">
              📊 Analytics
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageSquare className="h-4 w-4 mr-2" />
              Support Chat
            </TabsTrigger>
            <TabsTrigger value="betacodes">
              <Key className="h-4 w-4 mr-2" />
              Codes Bêta
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Bug className="h-4 w-4 mr-2" />
              Debug Logs
            </TabsTrigger>
            <TabsTrigger value="navigation">
              <Activity className="h-4 w-4 mr-2" />
              Navigation Debug
            </TabsTrigger>
            <TabsTrigger value="routes">
              📖 Routes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distress" className="mt-6">
            <AdminDistressAlertsSection />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Analytics</CardTitle>
                <CardDescription>
                  Consultez les statistiques détaillées d'utilisation de l'application (compte admin exclu)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate("/account/admin/analytics")}
                  className="w-full"
                >
                  Voir le dashboard analytics complet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUsersSection />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <AdminSupportSection onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="betacodes" className="mt-6">
            <AdminBetaCodesSection />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <AdminDebugLogsSection />
          </TabsContent>

          <TabsContent value="navigation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Navigation Debugger</CardTitle>
                <CardDescription>
                  Outil de débogage de navigation en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NavigationDebugger />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation des Routes</CardTitle>
                <CardDescription>
                  Liste complète des routes de l'application avec descriptions, paramètres et accès requis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <iframe 
                    src="/ROUTES.md" 
                    className="w-full h-[600px] border rounded-lg"
                    title="Documentation des routes"
                  />
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open('/ROUTES.md', '_blank')}
                    >
                      Ouvrir dans un nouvel onglet
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        fetch('/ROUTES.md')
                          .then(res => res.text())
                          .then(text => {
                            const blob = new Blob([text], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'ROUTES.md';
                            a.click();
                            URL.revokeObjectURL(url);
                          });
                      }}
                    >
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccountPageLayout>
  );
}
