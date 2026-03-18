import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Target, Save, Plus, Trash2, Calendar, TrendingUp, Users, Zap, Sun } from "lucide-react";
import B2BLayout from "@/components/b2b/B2BLayout";
import { toast } from "sonner";

interface Milestone {
  title: string;
  target_date: string;
  description: string;
}

interface ProgramConfig {
  name: string;
  description: string;
  program_objective: string;
  duration_months: string;
  start_date: string;
  end_date: string;
  milestones: Milestone[];
}

interface KpiTargets {
  id: string | null;
  target_active_rate: string;
  target_avg_mood: string;
  target_actions_per_week: string;
  target_usage_per_week: string;
}

interface RealKpis {
  activeRate: number;
  avgMood: number;
  actionsPerWeek: number;
  usagePerWeek: number;
}

const AdminObjectives = () => {
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<ProgramConfig>({
    name: "", description: "", program_objective: "", duration_months: "", start_date: "", end_date: "", milestones: [],
  });

  const [kpi, setKpi] = useState<KpiTargets>({
    id: null, target_active_rate: "", target_avg_mood: "", target_actions_per_week: "", target_usage_per_week: "",
  });

  const [realKpis, setRealKpis] = useState<RealKpis>({ activeRate: 0, avgMood: 0, actionsPerWeek: 0, usagePerWeek: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: cohorts } = await supabase.from("cohorts").select("*").order("created_at", { ascending: false }).limit(1);
      if (!cohorts?.[0]) { setLoading(false); return; }

      const c = cohorts[0] as any;
      setCohortId(c.id);

      setConfig({
        name: c.name || "",
        description: c.description || "",
        program_objective: c.program_objective || "",
        duration_months: c.duration_months?.toString() || "",
        start_date: c.start_date || "",
        end_date: c.end_date || "",
        milestones: (c.milestones as Milestone[]) || [],
      });

      // Load KPI targets
      const { data: objectives } = await supabase
        .from("cohort_objectives")
        .select("*")
        .eq("cohort_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (objectives?.[0]) {
        const obj = objectives[0] as any;
        setKpi({
          id: obj.id,
          target_active_rate: obj.target_active_rate?.toString() || "",
          target_avg_mood: obj.target_avg_mood?.toString() || "",
          target_actions_per_week: obj.target_actions_per_week?.toString() || "",
          target_usage_per_week: obj.target_usage_per_week?.toString() || "",
        });
      }

      // Load real KPIs
      await loadRealKpis(c.id);
    } catch (error) {
      console.error("Error loading objectives:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealKpis = async (cId: string) => {
    const { data: members } = await supabase.from("cohort_members").select("entrepreneur_id").eq("cohort_id", cId);
    const eIds = members?.map(m => m.entrepreneur_id) || [];
    if (eIds.length === 0) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [checkinsRes, actionsRes] = await Promise.all([
      supabase.from("daily_checkins").select("user_id, energy_level, clarity_level, mood_level, created_at").in("user_id", eIds).gte("created_at", sevenDaysAgo.toISOString()),
      supabase.from("daily_micro_actions").select("id, user_id").in("user_id", eIds).eq("status", "done").gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    const checkins = checkinsRes.data || [];
    const actions = actionsRes.data || [];

    // Active rate
    const activeUsers = new Set(checkins.map(c => c.user_id));
    const activeRate = (activeUsers.size / eIds.length) * 100;

    // Avg mood
    const allScores = checkins.map(c => (c.energy_level + c.clarity_level + c.mood_level) / 3);
    const avgMood = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    // Actions per week per entrepreneur
    const actionsPerWeek = (actions.length || 0) / Math.max(1, eIds.length);

    // Usage per week: avg number of unique days with checkins per entrepreneur
    const userDays: Record<string, Set<string>> = {};
    checkins.forEach(c => {
      if (!userDays[c.user_id]) userDays[c.user_id] = new Set();
      userDays[c.user_id].add(new Date(c.created_at).toISOString().slice(0, 10));
    });
    const totalSessions = Object.values(userDays).reduce((sum, days) => sum + days.size, 0);
    const usagePerWeek = eIds.length > 0 ? totalSessions / eIds.length : 0;

    setRealKpis({ activeRate: Math.round(activeRate), avgMood: Math.round(avgMood * 10) / 10, actionsPerWeek: Math.round(actionsPerWeek * 10) / 10, usagePerWeek: Math.round(usagePerWeek * 10) / 10 });
  };

  const handleSave = async () => {
    if (!cohortId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expirée, reconnectez-vous.");
        return;
      }

      const cohortPayload = {
        name: config.name.trim(),
        description: config.description.trim() || null,
        program_objective: config.program_objective.trim() || null,
        duration_months: config.duration_months ? parseInt(config.duration_months) : null,
        start_date: config.start_date || null,
        end_date: config.end_date || null,
        milestones: config.milestones,
      } as any;

      const kpiBasePayload = {
        cohort_id: cohortId,
        title: "KPIs cibles",
        target_active_rate: kpi.target_active_rate ? parseInt(kpi.target_active_rate) : null,
        target_avg_mood: kpi.target_avg_mood ? parseInt(kpi.target_avg_mood) : null,
        target_actions_per_week: kpi.target_actions_per_week ? parseInt(kpi.target_actions_per_week) : null,
        target_usage_per_week: kpi.target_usage_per_week ? parseInt(kpi.target_usage_per_week) : null,
      };

      const [cohortResult, kpiResult] = await Promise.all([
        supabase.from("cohorts").update(cohortPayload).eq("id", cohortId).select("id").single(),
        kpi.id
          ? supabase.from("cohort_objectives").update(kpiBasePayload).eq("id", kpi.id).select("id").single()
          : supabase.from("cohort_objectives").insert({ ...kpiBasePayload, created_by: user.id }).select("id").single(),
      ]);

      if (cohortResult.error) {
        throw new Error(`Programme non enregistré : ${cohortResult.error.message}`);
      }

      if (kpiResult.error) {
        throw new Error(`KPIs non enregistrés : ${kpiResult.error.message}`);
      }

      if (!kpi.id && kpiResult.data) {
        setKpi((prev) => ({ ...prev, id: (kpiResult.data as { id: string }).id }));
      }

      await loadData();
      toast.success("Objectifs enregistrés");
    } catch (error) {
      console.error("Error saving objectives:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = () => {
    setConfig(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", target_date: "", description: "" }],
    }));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setConfig(prev => {
      const ms = [...prev.milestones];
      ms[index] = { ...ms[index], [field]: value };
      return { ...prev, milestones: ms };
    });
  };

  const removeMilestone = (index: number) => {
    setConfig(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const getGaugeColor = (real: number, target: number) => {
    const ratio = target > 0 ? real / target : 0;
    if (ratio >= 0.9) return "[&>div]:bg-primary";
    if (ratio >= 0.6) return "[&>div]:bg-orange-400";
    return "[&>div]:bg-destructive";
  };

  if (loading) {
    return (
      <B2BLayout pageTitle="Objectifs">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </B2BLayout>
    );
  }

  if (!cohortId) {
    return (
      <B2BLayout pageTitle="Objectifs">
        <div className="flex items-center justify-center py-24">
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune cohorte configurée.</p>
          </Card>
        </div>
      </B2BLayout>
    );
  }

  const targetActive = parseInt(kpi.target_active_rate) || 0;
  const targetMood = parseInt(kpi.target_avg_mood) || 0;
  const targetActions = parseInt(kpi.target_actions_per_week) || 0;
  const targetUsage = parseInt(kpi.target_usage_per_week) || 0;
  const hasTargets = targetActive > 0 || targetMood > 0 || targetActions > 0 || targetUsage > 0;

  return (
    <B2BLayout pageTitle="Objectifs">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        {/* Section 1: Périmètre du programme */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Périmètre de l'accompagnement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Titre du programme *</label>
              <Input value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} placeholder="Ex: La Traversée" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Durée (mois)</label>
              <Input type="number" min={1} value={config.duration_months} onChange={(e) => setConfig({ ...config, duration_months: e.target.value })} placeholder="Ex: 6" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <Textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} placeholder="Description du programme d'accompagnement" rows={2} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Objectif principal</label>
            <Textarea value={config.program_objective} onChange={(e) => setConfig({ ...config, program_objective: e.target.value })} placeholder="L'objectif global que le programme vise à atteindre" rows={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date de début</label>
              <Input type="date" value={config.start_date} onChange={(e) => setConfig({ ...config, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date de fin</label>
              <Input type="date" value={config.end_date} onChange={(e) => setConfig({ ...config, end_date: e.target.value })} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Jalons intermédiaires */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Jalons intermédiaires
            </h2>
            <Button variant="outline" size="sm" onClick={addMilestone}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter un jalon
            </Button>
          </div>

          {config.milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun jalon défini. Ajoutez des étapes clés du programme.</p>
          ) : (
            <div className="space-y-3">
              {config.milestones.map((ms, i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Titre du jalon"
                          value={ms.title}
                          onChange={(e) => updateMilestone(i, "title", e.target.value)}
                          className="sm:col-span-2"
                        />
                        <Input
                          type="date"
                          value={ms.target_date}
                          onChange={(e) => updateMilestone(i, "target_date", e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Description (optionnel)"
                        value={ms.description}
                        onChange={(e) => updateMilestone(i, "description", e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeMilestone(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Section 3: KPIs cibles */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            KPIs cibles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <Users className="h-3 w-3" /> Taux d'actifs cible (%)
              </label>
              <Input type="number" min={0} max={100} value={kpi.target_active_rate} onChange={(e) => setKpi({ ...kpi, target_active_rate: e.target.value })} placeholder="80" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <Sun className="h-3 w-3" /> Météo moyenne cible (/10)
              </label>
              <Input type="number" min={0} max={10} value={kpi.target_avg_mood} onChange={(e) => setKpi({ ...kpi, target_avg_mood: e.target.value })} placeholder="7" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <Zap className="h-3 w-3" /> Actions/semaine/entrepreneur
              </label>
              <Input type="number" min={0} value={kpi.target_actions_per_week} onChange={(e) => setKpi({ ...kpi, target_actions_per_week: e.target.value })} placeholder="3" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fréquence d'utilisation cible (sessions/sem)
              </label>
              <Input type="number" min={0} value={kpi.target_usage_per_week} onChange={(e) => setKpi({ ...kpi, target_usage_per_week: e.target.value })} placeholder="3" />
              <p className="text-[10px] text-muted-foreground mt-1">Connexion + météo + actions = 1 session active</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 4: Écart objectifs / réalité */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Écart objectifs / réalité
            <Badge variant="outline" className="text-xs font-normal">7 derniers jours</Badge>
          </h2>

          {!hasTargets ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Renseignez au moins un KPI cible ci-dessus pour voir les jauges d'écart.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetActive > 0 && (
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Taux d'actifs</span>
                    <span className="font-semibold">{realKpis.activeRate}% <span className="text-muted-foreground font-normal">/ {targetActive}%</span></span>
                  </div>
                  <Progress value={Math.min(100, (realKpis.activeRate / targetActive) * 100)} className={`h-3 ${getGaugeColor(realKpis.activeRate, targetActive)}`} />
                </Card>
              )}

              {targetMood > 0 && (
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> Météo moyenne</span>
                    <span className="font-semibold">{realKpis.avgMood} <span className="text-muted-foreground font-normal">/ {targetMood}</span></span>
                  </div>
                  <Progress value={Math.min(100, (realKpis.avgMood / targetMood) * 100)} className={`h-3 ${getGaugeColor(realKpis.avgMood, targetMood)}`} />
                </Card>
              )}

              {targetActions > 0 && (
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Actions/sem</span>
                    <span className="font-semibold">{realKpis.actionsPerWeek} <span className="text-muted-foreground font-normal">/ {targetActions}</span></span>
                  </div>
                  <Progress value={Math.min(100, (realKpis.actionsPerWeek / targetActions) * 100)} className={`h-3 ${getGaugeColor(realKpis.actionsPerWeek, targetActions)}`} />
                </Card>
              )}

              {targetUsage > 0 && (
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Sessions/sem</span>
                    <span className="font-semibold">{realKpis.usagePerWeek} <span className="text-muted-foreground font-normal">/ {targetUsage}</span></span>
                  </div>
                  <Progress value={Math.min(100, (realKpis.usagePerWeek / targetUsage) * 100)} className={`h-3 ${getGaugeColor(realKpis.usagePerWeek, targetUsage)}`} />
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement…" : "Enregistrer les objectifs"}
          </Button>
        </div>
      </div>
    </B2BLayout>
  );
};

export default AdminObjectives;
