import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

interface ProgressionChartsProps {
  commitmentHistory: Array<{ created_at: string; status_after: string }>;
  attentionHistory: Array<{ created_at: string; resolved: boolean }>;
  timeline: Array<{ type: string; date: string; data: any }>;
  // Actual counts from main tables (not history tables)
  completedActionsCount: number;
  resolvedZonesCount: number;
}

export const ProgressionCharts = ({ 
  commitmentHistory, 
  attentionHistory,
  timeline,
  completedActionsCount,
  resolvedZonesCount
}: ProgressionChartsProps) => {
  
  // Calculer les données pour le graphique d'activité sur 14 jours
  const activityData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 13);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      // Compter les actions complétées ce jour
      const actionsCompleted = commitmentHistory.filter(c => {
        const cDate = new Date(c.created_at);
        return cDate >= dayStart && cDate < dayEnd && c.status_after === 'done';
      }).length;
      
      // Compter les zones résolues ce jour
      const zonesResolved = attentionHistory.filter(a => {
        const aDate = new Date(a.created_at);
        return aDate >= dayStart && aDate < dayEnd && a.resolved;
      }).length;
      
      // Compter tous les événements ce jour
      const totalEvents = timeline.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= dayStart && eDate < dayEnd;
      }).length;
      
      return {
        date: format(day, 'd MMM', { locale: fr }),
        fullDate: format(day, 'dd/MM', { locale: fr }),
        actions: actionsCompleted,
        zones: zonesResolved,
        total: totalEvents,
        engagement: actionsCompleted + zonesResolved
      };
    });
  }, [commitmentHistory, attentionHistory, timeline]);

  // Statistiques globales - use actual counts passed from parent
  const stats = useMemo(() => {
    const last7Days = activityData.slice(-7);
    const prev7Days = activityData.slice(0, 7);
    
    const recentEngagement = last7Days.reduce((sum, d) => sum + d.engagement, 0);
    const prevEngagement = prev7Days.reduce((sum, d) => sum + d.engagement, 0);
    
    const trend = recentEngagement > prevEngagement ? 'up' : recentEngagement < prevEngagement ? 'down' : 'stable';
    
    return {
      totalActions: completedActionsCount,
      totalZonesResolved: resolvedZonesCount,
      trend,
      recentEngagement,
      prevEngagement
    };
  }, [completedActionsCount, resolvedZonesCount, activityData]);

  const hasData = activityData.some(d => d.total > 0);

  // Afficher les stats même sans données historiques (valeurs à 0)
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {/* Statistiques rapides */}
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/20">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{stats.totalActions}</p>
            <p className="text-xs text-muted-foreground">Actions accomplies</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats.totalZonesResolved}</p>
            <p className="text-xs text-muted-foreground">Zones résolues</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">
              {stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→'}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.trend === 'up' ? 'En progression' : stats.trend === 'down' ? 'Ralentissement' : 'Stable'}
            </p>
          </div>
        </div>
      </Card>

      {/* Graphiques - affichés seulement si données d'activité */}
      {hasData && (
        <>
          <Card className="p-4 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Activité des 14 derniers jours
            </h3>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220, 75%, 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(220, 75%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="fullDate" 
                    tick={{ fontSize: 10, fill: 'hsl(220, 25%, 45%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(220, 25%, 45%)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(220, 18%, 90%)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'engagement') return [value, 'Activités'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="hsl(220, 75%, 55%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEngagement)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 md:col-span-3">
            <h3 className="text-sm font-semibold mb-4">Répartition de votre activité</h3>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={activityData} 
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  barGap={0}
                  barCategoryGap="20%"
                >
                  <XAxis 
                    dataKey="fullDate" 
                    tick={{ fontSize: 10, fill: 'hsl(220, 25%, 45%)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0, 0%, 100%)', 
                      border: '1px solid hsl(220, 18%, 90%)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'actions') return [value, 'Actions'];
                      if (name === 'zones') return [value, 'Zones résolues'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="actions" stackId="a" fill="hsl(142, 76%, 45%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="zones" stackId="a" fill="hsl(220, 75%, 55%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-success" />
                <span className="text-muted-foreground">Actions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-muted-foreground">Zones résolues</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};