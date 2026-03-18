import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import B2BLayout from "@/components/b2b/B2BLayout";
import { logAccess } from "@/hooks/useAccessLog";

interface CheckinData {
  energy_level: number;
  clarity_level: number;
  mood_level: number;
  created_at: string;
}

interface AttentionZoneAgg {
  label: string;
  count: number;
}

interface MicroActionEntry {
  title: string;
  status: string;
  created_at: string;
}

const MentorEntrepreneurDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Entrepreneur");
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [attentionZones, setAttentionZones] = useState<AttentionZoneAgg[]>([]);
  const [microActions, setMicroActions] = useState<MicroActionEntry[]>([]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      // 1. Verify assignment via cohort_members
      const { data: membership } = await supabase
        .from("cohort_members")
        .select("id")
        .eq("mentor_id", user.id)
        .eq("entrepreneur_id", id)
        .maybeSingle();

      if (!membership) {
        setLoading(false);
        return;
      }

      // 2. Check mentor_sharing
      const { data: sharing } = await supabase
        .from("mentor_sharing")
        .select("is_active, activated_at")
        .eq("mentor_id", user.id)
        .eq("entrepreneur_id", id)
        .maybeSingle();

      setAuthorized(true);
      setIsActive(sharing?.is_active ?? false);
      logAccess("mentor_view_detail", "entrepreneur", id);
      setActivatedAt(sharing?.activated_at ?? null);

      // Get profile name
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", id)
        .maybeSingle();

      setDisplayName(profile?.display_name || "Entrepreneur");

      if (!sharing?.is_active || !sharing?.activated_at) {
        setLoading(false);
        return;
      }

      const activatedDate = sharing.activated_at;

      // 3. Load checkins (7 days, non-retroactive)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const filterDate = new Date(activatedDate) > sevenDaysAgo
        ? activatedDate
        : sevenDaysAgo.toISOString();

      const { data: checkinData } = await supabase
        .from("daily_checkins")
        .select("energy_level, clarity_level, mood_level, created_at")
        .eq("user_id", id)
        .gte("created_at", filterDate)
        .order("created_at", { ascending: true });

      setCheckins(checkinData || []);

      // 4. Load attention zones (active, non-retroactive, deduplicated)
      const { data: zones } = await supabase
        .from("attention_zones")
        .select("label, severity, created_at")
        .eq("user_id", id)
        .gte("created_at", filterDate)
        .eq("archived", false)
        .order("severity", { ascending: false });

      // Deduplicate by label, keep highest severity
      const uniqueZones = new Map<string, number>();
      (zones || []).forEach(z => {
        if (!uniqueZones.has(z.label) || z.severity > (uniqueZones.get(z.label) || 0)) {
          uniqueZones.set(z.label, z.severity);
        }
      });
      const sortedZones = Array.from(uniqueZones.entries())
        .map(([label, severity]) => ({ label, count: severity }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setAttentionZones(sortedZones);

      // 5. Load micro-actions (last 5, non-retroactive)
      const { data: dailyActions } = await supabase
        .from("daily_micro_actions")
        .select("title, status, created_at")
        .eq("user_id", id)
        .gte("created_at", activatedDate)
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: commitments } = await supabase
        .from("micro_commitments")
        .select("text, status, created_at")
        .eq("user_id", id)
        .gte("created_at", activatedDate)
        .order("created_at", { ascending: false })
        .limit(5);

      const allActions: MicroActionEntry[] = [
        ...(dailyActions || []).map(a => ({ title: a.title, status: a.status, created_at: a.created_at })),
        ...(commitments || []).map(c => ({ title: c.text, status: c.status, created_at: c.created_at })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setMicroActions(allActions);
    } catch (error) {
      console.error("Error loading entrepreneur detail:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const chartData = useMemo(() => {
    return checkins.map(c => ({
      date: new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      Énergie: c.energy_level,
      Clarté: c.clarity_level,
      Humeur: c.mood_level,
    }));
  }, [checkins]);

  // Trend indicator
  const trend = useMemo(() => {
    if (checkins.length < 2) return "stable";
    const mid = Math.floor(checkins.length / 2);
    const firstHalf = checkins.slice(0, mid);
    const secondHalf = checkins.slice(mid);
    const avg = (arr: CheckinData[]) =>
      arr.reduce((s, c) => s + c.energy_level + c.clarity_level + c.mood_level, 0) / (arr.length * 3);
    const diff = avg(secondHalf) - avg(firstHalf);
    if (diff > 0.5) return "up";
    if (diff < -0.5) return "down";
    return "stable";
  }, [checkins]);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendLabel = trend === "up" ? "En hausse" : trend === "down" ? "En baisse" : "Stable";
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-orange-600" : "text-muted-foreground";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const formatShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  if (loading) {
    return (
      <B2BLayout pageTitle="Détail entrepreneur">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </B2BLayout>
    );
  }

  if (!authorized) {
    return (
      <B2BLayout pageTitle="Accès refusé">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
          <p className="text-muted-foreground">Vous n'êtes pas autorisé à accéder à ce profil.</p>
          <Button variant="outline" onClick={() => navigate("/pro/mentor/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </B2BLayout>
    );
  }

  if (!isActive) {
    return (
      <B2BLayout pageTitle={displayName}>
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Partage non activé</h2>
          <p className="text-muted-foreground">
            Le partage n'est pas activé pour cet entrepreneur. Les données ne sont pas accessibles.
          </p>
          <Button variant="outline" onClick={() => navigate("/pro/mentor/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </B2BLayout>
    );
  }

  return (
    <B2BLayout pageTitle={displayName}>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Back button + Brief CTA */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/pro/mentor/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Mes entrepreneurs
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/pro/mentor/entrepreneur/${id}/brief`)}>
            Voir le brief pré-séance
          </Button>
        </div>

        {/* Section 1 — Météo 7 jours */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Météo — 7 derniers jours</CardTitle>
              <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span>{trendLabel}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun check-in sur cette période.</p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Énergie" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Clarté" stroke="hsl(210, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Humeur" stroke="hsl(150, 60%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2 — Zones d'attention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Zones d'attention</CardTitle>
          </CardHeader>
          <CardContent>
            {attentionZones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune zone d'attention sur cette période.</p>
            ) : (
              <div className="space-y-3">
                {attentionZones.map(z => {
                  const severityLabel = z.count >= 2 ? "Élevée" : "Modérée";
                  const severityClass = z.count >= 2
                    ? "bg-orange-500/15 text-orange-700 border-orange-200"
                    : "bg-yellow-500/15 text-yellow-700 border-yellow-200";
                  return (
                    <div key={z.label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{z.label}</span>
                      <Badge variant="secondary" className={`text-xs ${severityClass}`}>
                        {severityLabel}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3 — Micro-actions récentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Micro-actions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {microActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune micro-action sur cette période.</p>
            ) : (
              <div className="space-y-3">
                {microActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {a.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatShort(a.created_at)}</p>
                    </div>
                    <Badge variant={a.status === "done" ? "default" : "secondary"} className="text-xs shrink-0">
                      {a.status === "done" ? "✅ Fait" : "⏸️ En cours"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4 — Indicateur de partage */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm">
                  Partage activé le{" "}
                  <span className="font-medium">{activatedAt ? formatDate(activatedAt) : "—"}</span>
                </p>
              </div>
              <Badge className="bg-green-600/15 text-green-700 border-green-200 hover:bg-green-600/15">Actif</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </B2BLayout>
  );
};

export default MentorEntrepreneurDetail;
