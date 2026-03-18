import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, AlertTriangle, BarChart3, Target, Clock, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import B2BLayout from "@/components/b2b/B2BLayout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { logAccess } from "@/hooks/useAccessLog";

type PeriodDays = 7 | 14 | 30 | "all";

interface CohortData {
  name: string;
  objective: string | null;
  description: string | null;
  durationMonths: number | null;
  memberCount: number;
  startDate: string | null;
  endDate: string | null;
}

interface WeatherAvg {
  energy: number;
  clarity: number;
  mood: number;
  prevEnergy: number;
  prevClarity: number;
  prevMood: number;
}

interface BlockageItem {
  label: string;
  family: "entrepreneur" | "projet" | "marche";
  count: number;
  total: number;
  percentage: number;
}

interface AlertItem {
  name: string;
  type: "silent" | "low_mood" | "low_actions" | "mood_drop" | "inactive";
  userId: string;
  duration: string;
}

const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const getScoreColor = (score: number) => {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-orange-500";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 7) return "[&>div]:bg-green-500";
  if (score >= 5) return "[&>div]:bg-orange-400";
  return "[&>div]:bg-red-500";
};

const CohortAdminDashboard = () => {
  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [weather, setWeather] = useState<WeatherAvg | null>(null);
  const [blockages, setBlockages] = useState<BlockageItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [distressCount, setDistressCount] = useState(0);
  const [period, setPeriod] = useState<PeriodDays>(7);

  useEffect(() => {
    // Persist period
    const saved = localStorage.getItem("astryd_admin_period");
    if (saved && ["7", "14", "30", "all"].includes(saved)) {
      setPeriod(saved === "all" ? "all" : Number(saved) as PeriodDays);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("astryd_admin_period", String(period));
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadCohortData();
    logAccess("admin_view_dashboard", "dashboard");
  }, [period]);

  const loadCohortData = async () => {
    try {
      const { data: cohorts } = await supabase
        .from("cohorts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!cohorts || cohorts.length === 0) {
        setLoading(false);
        return;
      }

      const c = cohorts[0];

      const [membersRes, objectivesRes] = await Promise.all([
        supabase.from("cohort_members").select("entrepreneur_id").eq("cohort_id", c.id),
        supabase.from("cohort_objectives").select("target_usage_per_week, target_actions_per_week, target_avg_mood").eq("cohort_id", c.id).order("created_at", { ascending: false }).limit(1),
      ]);

      const entrepreneurIds = membersRes.data?.map(m => m.entrepreneur_id) || [];
      const objectives = objectivesRes.data?.[0] as any;

      setCohort({
        name: c.name,
        objective: c.program_objective,
        description: (c as any).description,
        durationMonths: c.duration_months,
        memberCount: entrepreneurIds.length,
        startDate: (c as any).start_date,
        endDate: (c as any).end_date,
      });

      if (entrepreneurIds.length === 0) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const periodMs = period === "all" ? null : (period as number) * 24 * 60 * 60 * 1000;
      const oneWeekAgo = periodMs ? new Date(now.getTime() - periodMs) : null;
      const twoWeeksAgo = periodMs ? new Date(now.getTime() - periodMs * 2) : null;

      let recentQuery = supabase
        .from("daily_checkins")
        .select("energy_level, clarity_level, mood_level, user_id, created_at")
        .in("user_id", entrepreneurIds);
      if (oneWeekAgo) recentQuery = recentQuery.gte("created_at", oneWeekAgo.toISOString());

      let prevQuery = supabase
        .from("daily_checkins")
        .select("energy_level, clarity_level, mood_level")
        .in("user_id", entrepreneurIds);
      if (twoWeeksAgo && oneWeekAgo) {
        prevQuery = prevQuery.gte("created_at", twoWeeksAgo.toISOString()).lt("created_at", oneWeekAgo.toISOString());
      }

      const [recentRes, prevRes, zonesRes] = await Promise.all([
        recentQuery,
        oneWeekAgo ? prevQuery : Promise.resolve({ data: [] }),
        supabase
          .from("attention_zones")
          .select("label, user_id")
          .in("user_id", entrepreneurIds)
          .eq("archived", false),
      ]);

      const recentCheckins = recentRes.data || [];
      const prevCheckins = (prevRes as any).data || [];

      if (recentCheckins.length === 0) {
        setWeather(null);
      } else {
        setWeather({
          energy: avg(recentCheckins.map(c => c.energy_level)),
          clarity: avg(recentCheckins.map(c => c.clarity_level)),
          mood: avg(recentCheckins.map(c => c.mood_level)),
          prevEnergy: avg(prevCheckins.map(c => c.energy_level)),
          prevClarity: avg(prevCheckins.map(c => c.clarity_level)),
          prevMood: avg(prevCheckins.map(c => c.mood_level)),
        });
      }

      // Blockages — AI categorization
      const zones = zonesRes.data || [];
      if (zones.length > 0) {
        try {
          const { data: catData, error: catError } = await supabase.functions.invoke("categorize-blocages", {
            body: { zones: zones.map(z => ({ label: z.label, user_id: z.user_id })) },
          });
          if (catError) throw catError;
          setBlockages(catData.categories || []);
        } catch (catErr) {
          console.error("AI categorization failed, falling back:", catErr);
          // Fallback: raw label grouping
          const zoneCounts: Record<string, Set<string>> = {};
          zones.forEach(z => {
            if (!zoneCounts[z.label]) zoneCounts[z.label] = new Set();
            zoneCounts[z.label].add(z.user_id);
          });
          setBlockages(
            Object.entries(zoneCounts)
              .map(([label, users]) => ({
                label,
                family: "entrepreneur" as const,
                count: users.size,
                total: entrepreneurIds.length,
                percentage: Math.round((users.size / entrepreneurIds.length) * 100),
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          );
        }
      }

      // Alerts — enhanced with usage frequency, actions gap, mood trends
      const alertItems: AlertItem[] = [];
      const oneWeekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

      // Targets from objectives
      const targetUsagePerWeek = (objectives as any)?.target_usage_per_week || 0;
      const targetActionsPerWeek = (objectives as any)?.target_actions_per_week || 0;

      // Batch fetch profiles + all checkins + actions for all entrepreneurs
      const [profilesRes, allCheckinsRes, allActionsRes] = await Promise.all([
        supabase.from("user_profiles").select("user_id, display_name").in("user_id", entrepreneurIds),
        supabase.from("daily_checkins").select("user_id, energy_level, clarity_level, mood_level, created_at").in("user_id", entrepreneurIds).order("created_at", { ascending: false }),
        supabase.from("daily_micro_actions").select("user_id, created_at").in("user_id", entrepreneurIds).eq("status", "done").gte("created_at", oneWeekAgoDate.toISOString()),
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p.display_name]) || []);
      const allCheckins = allCheckinsRes.data || [];
      const allActions = allActionsRes.data || [];

      for (const eid of entrepreneurIds) {
        const name = profileMap.get(eid) || "Entrepreneur";
        const userCheckins = allCheckins.filter(c => c.user_id === eid);
        const userActionsCount = allActions.filter(a => a.user_id === eid).length;

        // 1. Silent check (no checkin in 7 days)
        const lastDate = userCheckins[0]?.created_at;
        if (!lastDate || new Date(lastDate) < oneWeekAgoDate) {
          const daysSilent = lastDate
            ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000))
            : null;
          alertItems.push({
            name, type: "silent", userId: eid,
            duration: daysSilent ? `${daysSilent} jours sans activité` : "Aucun check-in",
          });
          continue; // Skip other checks if completely silent
        }

        // 2. Usage frequency below target (checkins this week < target)
        if (targetUsagePerWeek > 0) {
          const weekCheckins = userCheckins.filter(c => new Date(c.created_at) >= oneWeekAgoDate);
          if (weekCheckins.length < targetUsagePerWeek) {
            alertItems.push({
              name, type: "inactive", userId: eid,
              duration: `${weekCheckins.length}/${targetUsagePerWeek} sessions cette semaine`,
            });
          }
        }

        // 3. Actions per week below target
        if (targetActionsPerWeek > 0 && userActionsCount < targetActionsPerWeek) {
          alertItems.push({
            name, type: "low_actions", userId: eid,
            duration: `${userActionsCount}/${targetActionsPerWeek} actions cette semaine`,
          });
        }

        // 4. Sustained low mood (avg < 5 over 3 weeks)
        const threeWeekCheckins = userCheckins.filter(c => new Date(c.created_at) >= threeWeeksAgo);
        if (threeWeekCheckins.length >= 3) {
          const avgMood = avg(threeWeekCheckins.map(c => (c.energy_level + c.clarity_level + c.mood_level) / 3));
          if (avgMood < 5) {
            alertItems.push({
              name, type: "low_mood", userId: eid,
              duration: `Météo moyenne ${avgMood.toFixed(1)}/10 sur ${threeWeekCheckins.length} entrées`,
            });
          }
        }

        // 5. Drastic mood drop (last week vs previous week, drop > 2 points)
        const thisWeekCheckins = userCheckins.filter(c => new Date(c.created_at) >= oneWeekAgoDate);
        const prevWeekCheckins = userCheckins.filter(c => {
          const d = new Date(c.created_at);
          return d >= twoWeeksAgoDate && d < oneWeekAgoDate;
        });
        if (thisWeekCheckins.length >= 1 && prevWeekCheckins.length >= 1) {
          const thisAvg = avg(thisWeekCheckins.map(c => (c.energy_level + c.clarity_level + c.mood_level) / 3));
          const prevAvg = avg(prevWeekCheckins.map(c => (c.energy_level + c.clarity_level + c.mood_level) / 3));
          const drop = prevAvg - thisAvg;
          if (drop >= 2) {
            alertItems.push({
              name, type: "mood_drop", userId: eid,
              duration: `Chute de ${drop.toFixed(1)} pts (${prevAvg.toFixed(1)} → ${thisAvg.toFixed(1)})`,
            });
          }
        }
      }

      setAlerts(alertItems);

      // Distress alerts — anonymized count only (no verbatim, no names)
      try {
        const { data: distressData } = await supabase.rpc("get_distress_alerts");
        if (distressData) {
          const distressUserIds = new Set((distressData as any[]).map((d: any) => d.user_id));
          const cohortDistressCount = entrepreneurIds.filter(id => distressUserIds.has(id)).length;
          setDistressCount(cohortDistressCount);
        }
      } catch {
        // Non-blocking — admin role may not have access
      }
    } catch (error) {
      console.error("Error loading cohort data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrend = (current: number, previous: number) => {
    const delta = current - previous;
    if (Math.abs(delta) < 0.3) return { icon: "→", color: "text-muted-foreground", label: "stable" };
    if (delta > 0) return { icon: "↗", color: "text-green-600", label: `+${delta.toFixed(1)}` };
    return { icon: "↘", color: "text-red-500", label: delta.toFixed(1) };
  };

  if (loading) {
    return (
      <B2BLayout pageTitle="Dashboard cohorte">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </B2BLayout>
    );
  }

  if (!cohort) {
    return (
      <B2BLayout pageTitle="Dashboard cohorte">
        <div className="flex items-center justify-center py-24">
          <Card className="p-12 text-center max-w-md">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-bold mb-2">Aucune cohorte</h2>
            <p className="text-sm text-muted-foreground">
              Aucune cohorte n'a été créée pour le moment.
            </p>
          </Card>
        </div>
      </B2BLayout>
    );
  }

  return (
    <B2BLayout pageTitle="Dashboard cohorte">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header — Program info */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            Vue macro
          </div>
          <h1 className="text-2xl font-bold">{cohort.name}</h1>
          {cohort.description && (
            <p className="text-sm text-muted-foreground mt-1">{cohort.description}</p>
          )}
          {cohort.objective && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0" />
              {cohort.objective}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {cohort.memberCount} entrepreneurs
            </span>
            {cohort.durationMonths && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {cohort.durationMonths} mois
              </span>
            )}
            {cohort.startDate && cohort.endDate && (
              <span className="flex items-center gap-1">
                📅 {new Date(cohort.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} → {new Date(cohort.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          {/* Timeline progress */}
          {cohort.startDate && cohort.endDate && (() => {
            const start = new Date(cohort.startDate!).getTime();
            const end = new Date(cohort.endDate!).getTime();
            const now = Date.now();
            const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
            return (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Avancement temporel</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })()}
        </div>

        {/* Section 1: Météo Cohorte */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 flex-wrap">
            <TrendingUp className="h-5 w-5 text-primary" />
            Météo de la cohorte
            <span className="text-xs text-muted-foreground font-normal ml-auto mr-2">{period === "all" ? "Tout" : `${period} jours`}</span>
            <ToggleGroup
              type="single"
              value={String(period)}
              onValueChange={(v) => v && setPeriod(v === "all" ? "all" : Number(v) as PeriodDays)}
              className="gap-1"
            >
              {([7, 14, 30, "all"] as const).map((d) => (
                <ToggleGroupItem
                  key={String(d)}
                  value={String(d)}
                  size="sm"
                  className="text-xs px-2 h-7"
                >
                  {d === "all" ? "Tout" : `${d}j`}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </h2>
          {weather ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([
                { label: "Énergie", current: weather.energy, prev: weather.prevEnergy },
                { label: "Clarté", current: weather.clarity, prev: weather.prevClarity },
                { label: "Humeur", current: weather.mood, prev: weather.prevMood },
              ] as const).map(({ label, current, prev }) => {
                const trend = getTrend(current, prev);
                return (
                  <div key={label} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={`text-xs font-medium ${trend.color}`}>
                        {trend.icon} {trend.label}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={`text-3xl font-bold ${getScoreColor(current)}`}>
                        {current.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">/ 10</span>
                    </div>
                    <Progress
                      value={current * 10}
                      className={`h-2 ${getProgressColor(current)}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune donnée météo disponible</p>
          )}
        </Card>

        {/* Section 2: Top Blocages */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Tendances Collectives
          </h2>
          {blockages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune zone d'attention détectée</p>
          ) : (
            <div className="space-y-4">
              {blockages.map((b, i) => {
                const familyConfig = {
                  entrepreneur: { label: "Entrepreneur", color: "bg-orange-100 text-orange-700 border-orange-200" },
                  projet: { label: "Projet", color: "bg-blue-100 text-blue-700 border-blue-200" },
                  marche: { label: "Marché", color: "bg-purple-100 text-purple-700 border-purple-200" },
                };
                const family = familyConfig[b.family] || familyConfig.entrepreneur;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${family.color}`}>
                          {family.label}
                        </Badge>
                        <span className="text-sm font-medium">{b.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {b.percentage}% — {b.count}/{b.total} entrepreneurs
                      </span>
                    </div>
                    <Progress value={b.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Section 3: Signaux d'Alerte */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Signaux d'Alerte
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
            )}
          </h2>
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Aucun signal d'alerte cette semaine 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const alertConfig: Record<string, { icon: string; label: string }> = {
                  silent: { icon: "🟠", label: "Silencieux" },
                  inactive: { icon: "🟡", label: "Sous-utilisation" },
                  low_actions: { icon: "⚡", label: "Peu d'actions" },
                  low_mood: { icon: "🔴", label: "Météo basse" },
                  mood_drop: { icon: "📉", label: "Chute météo" },
                };
                const cfg = alertConfig[a.type] || alertConfig.silent;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <span className="text-sm font-medium">{a.name}</span>
                        <p className="text-xs text-muted-foreground">{a.duration}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Section 4: Détresse psychologique (anonymisé) */}
        {distressCount > 0 && (
          <Card className="p-6 border-destructive/30">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Alerte détresse psychologique
              <Badge variant="destructive" className="ml-2">{distressCount}</Badge>
            </h2>
            <Separator className="mb-3" />
            <p className="text-sm text-muted-foreground">
              <strong>{distressCount} entrepreneur{distressCount > 1 ? "s" : ""}</strong> de la cohorte {distressCount > 1 ? "ont" : "a"} déclenché
              un signal de détresse psychologique.
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Données anonymisées — aucun verbatim ni identification accessible. Contactez l'équipe Astryd pour le suivi.
            </p>
          </Card>
        )}
      </div>
    </B2BLayout>
  );
};

export default CohortAdminDashboard;