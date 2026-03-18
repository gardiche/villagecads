import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, FileText, CheckSquare, Eye, TrendingUp, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsStats {
  totalUsers: number;
  uniqueVisitors: number;
  conversionRate: number;
  profilesGenerated: number;
  microActionsCompleted: number;
  totalPageViews: number;
  topPages: { page: string; views: number }[];
  recentActivity: { event: string; count: number }[];
  visitsLast30Days: { date: string; visits: number }[];
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalUsers: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    profilesGenerated: 0,
    microActionsCompleted: 0,
    totalPageViews: 0,
    topPages: [],
    recentActivity: [],
    visitsLast30Days: [],
  });

  useEffect(() => {
    checkAdminAndLoadStats();
  }, []);

  const checkAdminAndLoadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/profil-entrepreneurial");
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/profil-entrepreneurial");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get admin user ID to exclude from analytics
      const { data: adminUser } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .single();
      
      const adminUserId = adminUser?.user_id;

      // Total registered users (excluding admin)
      let usersQuery = supabase
        .from("user_assessments")
        .select("*", { count: "exact", head: true });
      
      if (adminUserId) {
        usersQuery = usersQuery.neq("user_id", adminUserId);
      }
      
      const { count: usersCount } = await usersQuery;

      // Unique visitors (distinct session_id, excluding admin)
      let sessionsQuery = supabase
        .from("analytics_events")
        .select("session_id, user_id");
      
      if (adminUserId) {
        sessionsQuery = sessionsQuery.or(`user_id.is.null,user_id.neq.${adminUserId}`);
      }
      
      const { data: sessionsData } = await sessionsQuery;
      const uniqueSessions = new Set(sessionsData?.map(e => e.session_id) || []);
      const uniqueVisitors = uniqueSessions.size;

      // Conversion rate
      const conversionRate = uniqueVisitors > 0 
        ? ((usersCount || 0) / uniqueVisitors) * 100 
        : 0;

      // Profiles generated
      const { count: profilesCount } = await supabase
        .from("persona_cache")
        .select("*", { count: "exact", head: true });

      // Micro-actions completed (excluding admin)
      let microActionsQuery = supabase
        .from("micro_commitments")
        .select("*", { count: "exact", head: true })
        .eq("status", "done");
      
      if (adminUserId) {
        microActionsQuery = microActionsQuery.neq("user_id", adminUserId);
      }
      
      const { count: microActionsCount } = await microActionsQuery;

      // Total page views (excluding admin)
      let pageViewsQuery = supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view");
      
      if (adminUserId) {
        pageViewsQuery = pageViewsQuery.or(`user_id.is.null,user_id.neq.${adminUserId}`);
      }
      
      const { count: pageViewsCount } = await pageViewsQuery;

      // Top pages (excluding admin)
      let topPagesQuery = supabase
        .from("analytics_events")
        .select("page_path, user_id")
        .eq("event_type", "page_view");
      
      if (adminUserId) {
        topPagesQuery = topPagesQuery.or(`user_id.is.null,user_id.neq.${adminUserId}`);
      }
      
      const { data: pageViewsData } = await topPagesQuery;

      const pageCounts = pageViewsData?.reduce((acc: Record<string, number>, item) => {
        const path = item.page_path || "unknown";
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      }, {}) || {};

      const topPages = Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views: views as number }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Recent activity (last 7 days, excluding admin)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let recentEventsQuery = supabase
        .from("analytics_events")
        .select("event_type, user_id")
        .gte("created_at", sevenDaysAgo.toISOString());
      
      if (adminUserId) {
        recentEventsQuery = recentEventsQuery.or(`user_id.is.null,user_id.neq.${adminUserId}`);
      }
      
      const { data: recentEvents } = await recentEventsQuery;

      const eventCounts = recentEvents?.reduce((acc: Record<string, number>, item) => {
        acc[item.event_type] = (acc[item.event_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const recentActivity = Object.entries(eventCounts)
        .map(([event, count]) => ({ event, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Last 30 days visits chart data (excluding admin)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let last30DaysQuery = supabase
        .from("analytics_events")
        .select("created_at, user_id")
        .eq("event_type", "page_view")
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      if (adminUserId) {
        last30DaysQuery = last30DaysQuery.or(`user_id.is.null,user_id.neq.${adminUserId}`);
      }
      
      const { data: last30DaysData } = await last30DaysQuery;

      // Group by date
      const visitsByDate: Record<string, number> = {};
      last30DaysData?.forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        visitsByDate[date] = (visitsByDate[date] || 0) + 1;
      });

      const visitsLast30Days = Object.entries(visitsByDate)
        .map(([date, visits]) => ({ date, visits }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalUsers: usersCount || 0,
        uniqueVisitors,
        conversionRate: Math.round(conversionRate * 10) / 10,
        profilesGenerated: profilesCount || 0,
        microActionsCompleted: microActionsCount || 0,
        totalPageViews: pageViewsCount || 0,
        topPages,
        recentActivity,
        visitsLast30Days,
      });
    } catch (error) {
      console.error("Error loading analytics stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/account/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au dashboard admin
          </Button>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Pilotage avancé de l'utilisation et du comportement utilisateur
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visiteurs Uniques</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
              <p className="text-xs text-muted-foreground">
                Sessions distinctes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers} inscrits / {stats.uniqueVisitors} visiteurs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profils générés</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profilesGenerated}</div>
              <p className="text-xs text-muted-foreground">
                Profils entrepreneuriaux
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.microActionsCompleted}</div>
              <p className="text-xs text-muted-foreground">
                Micro-actions cochées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 30 Days Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visites des 30 derniers jours</CardTitle>
            <CardDescription>Évolution du trafic sur le dernier mois</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.visitsLast30Days.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.visitsLast30Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                    formatter={(value) => [`${value} visites`, 'Visites']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">
                Aucune donnée disponible pour les 30 derniers jours
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Pages & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Pages</CardTitle>
              <CardDescription>Pages les plus visitées</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topPages.length > 0 ? (
                <div className="space-y-4">
                  {stats.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-sm truncate max-w-[200px]">
                          {page.page}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{page.views}</span>
                        <span className="text-xs text-muted-foreground">vues</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Événements des 7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm capitalize">
                          {activity.event.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{activity.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
