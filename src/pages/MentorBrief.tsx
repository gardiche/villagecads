import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus, Zap, Eye, Smile, HelpCircle, Activity, ShieldCheck } from "lucide-react";
import B2BLayout from "@/components/b2b/B2BLayout";
import { logAccess } from "@/hooks/useAccessLog";

interface CheckinDay {
  date: string;
  energy: number;
  clarity: number;
  mood: number;
}

interface ZoneEntry {
  label: string;
  severity: number;
}

interface ActionEntry {
  title: string;
  status: string;
  created_at: string;
}

const ZONE_QUESTIONS: Record<string, string> = {
  "Trésorerie": "Comment se présente votre visibilité financière à 3 mois ?",
  "Motivation": "Qu'est-ce qui vous donne envie de continuer en ce moment ?",
  "Organisation": "Comment gérez-vous votre priorisation cette semaine ?",
  "Acquisition": "Quel est votre canal d'acquisition principal aujourd'hui ?",
  "Équipe": "Comment se passe la collaboration avec votre équipe/associés ?",
  "Produit": "Quel est le prochain jalon produit qui débloque de la valeur ?",
  "Juridique": "Y a-t-il un sujet juridique qui vous bloque ou vous préoccupe ?",
  "Énergie": "Comment gérez-vous votre récupération cette semaine ?",
  "Énergie personnelle critique": "Avez-vous pu prendre du temps pour vous récemment ?",
  "Vie sociale et soutien limités": "Vous sentez-vous suffisamment entouré(e) dans ce projet ?",
  "Charge mentale intense et désenchantement": "Qu'est-ce qui pèse le plus sur votre moral en ce moment ?",
  "Manque de clarté sur votre idée": "Quel est l'élément le plus flou dans votre projet aujourd'hui ?",
  "Manque de clarté sur vos prochaines étapes": "Quelle serait votre prochaine action concrète ?",
};

const MentorBrief = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const briefRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [displayName, setDisplayName] = useState("Entrepreneur");
  const [cohortName, setCohortName] = useState("");
  const [activatedAt, setActivatedAt] = useState<string | null>(null);

  const [checkins, setCheckins] = useState<CheckinDay[]>([]);
  const [zones, setZones] = useState<ZoneEntry[]>([]);
  const [actions, setActions] = useState<ActionEntry[]>([]);
  const [totalDaysSinceActivation, setTotalDaysSinceActivation] = useState(0);
  const [daysWithCheckin, setDaysWithCheckin] = useState(0);

  useEffect(() => {
    if (id) loadBriefData();
  }, [id]);

  const loadBriefData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data: membership } = await supabase
        .from("cohort_members")
        .select("id, cohort_id")
        .eq("mentor_id", user.id)
        .eq("entrepreneur_id", id)
        .maybeSingle();

      if (!membership) { setLoading(false); return; }

      const { data: cohort } = await supabase
        .from("cohorts")
        .select("name")
        .eq("id", membership.cohort_id)
        .maybeSingle();
      setCohortName(cohort?.name || "");

      const { data: sharing } = await supabase
        .from("mentor_sharing")
        .select("is_active, activated_at")
        .eq("mentor_id", user.id)
        .eq("entrepreneur_id", id)
        .maybeSingle();

      if (!sharing?.is_active || !sharing?.activated_at) { setLoading(false); return; }

      setAuthorized(true);
      setActivatedAt(sharing.activated_at);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", id)
        .maybeSingle();
      setDisplayName(profile?.display_name || "Entrepreneur");

      const activatedDate = sharing.activated_at;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const filterDate = new Date(activatedDate) > sevenDaysAgo ? activatedDate : sevenDaysAgo.toISOString();

      // Checkins 7 days
      const { data: checkinData } = await supabase
        .from("daily_checkins")
        .select("energy_level, clarity_level, mood_level, created_at")
        .eq("user_id", id)
        .gte("created_at", filterDate)
        .order("created_at", { ascending: true });

      const mapped = (checkinData || []).map(c => ({
        date: new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        energy: c.energy_level,
        clarity: c.clarity_level,
        mood: c.mood_level,
      }));
      setCheckins(mapped);

      // Attention zones (deduplicated, highest severity)
      const { data: zoneData } = await supabase
        .from("attention_zones")
        .select("label, severity")
        .eq("user_id", id)
        .gte("created_at", filterDate)
        .eq("archived", false)
        .order("severity", { ascending: false });

      const uniqueZones = new Map<string, number>();
      (zoneData || []).forEach(z => {
        if (!uniqueZones.has(z.label) || z.severity > (uniqueZones.get(z.label) || 0)) {
          uniqueZones.set(z.label, z.severity);
        }
      });
      const sortedZones = Array.from(uniqueZones.entries())
        .map(([label, severity]) => ({ label, severity }))
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 3);
      setZones(sortedZones);

      // Last 5 micro-actions
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

      const allActions: ActionEntry[] = [
        ...(dailyActions || []).map(a => ({ title: a.title, status: a.status, created_at: a.created_at })),
        ...(commitments || []).map(c => ({ title: c.text, status: c.status, created_at: c.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setActions(allActions);

      // Confidence score
      const daysSince = Math.max(1, Math.floor((Date.now() - new Date(activatedDate).getTime()) / 86400000));
      setTotalDaysSinceActivation(daysSince);

      const { data: allCheckins } = await supabase
        .from("daily_checkins")
        .select("created_at")
        .eq("user_id", id)
        .gte("created_at", activatedDate);

      const uniqueDays = new Set((allCheckins || []).map(c => new Date(c.created_at).toDateString()));
      setDaysWithCheckin(uniqueDays.size);

      logAccess("mentor_view_detail", "brief", id);
    } catch (error) {
      console.error("Error loading brief:", error);
    } finally {
      setLoading(false);
    }
  };

  const trend = useMemo(() => {
    if (checkins.length < 2) return "stable";
    const mid = Math.floor(checkins.length / 2);
    const avgFirst = checkins.slice(0, mid).reduce((s, c) => s + c.energy + c.clarity + c.mood, 0) / (Math.max(mid, 1) * 3);
    const avgSecond = checkins.slice(mid).reduce((s, c) => s + c.energy + c.clarity + c.mood, 0) / (Math.max(checkins.length - mid, 1) * 3);
    const diff = avgSecond - avgFirst;
    if (diff > 0.5) return "up";
    if (diff < -0.5) return "down";
    return "stable";
  }, [checkins]);

  // Latest checkin averages
  const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const avgScore = latestCheckin
    ? Math.round(((latestCheckin.energy + latestCheckin.clarity + latestCheckin.mood) / 3) * 10) / 10
    : null;

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 7) return "bg-green-50 border-green-200";
    if (score >= 4) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const hypothesis = useMemo(() => {
    const parts: string[] = [];
    if (trend === "down") parts.push("La tendance météo est en baisse cette semaine");
    else if (trend === "up") parts.push("La tendance météo est en progression");
    else parts.push("La météo est stable");

    if (zones.length > 0) {
      parts.push(`${zones.length} zone${zones.length > 1 ? "s" : ""} d'attention identifiée${zones.length > 1 ? "s" : ""}`);
    }
    const doneCount = actions.filter(a => a.status === "done").length;
    const totalActions = actions.length;
    if (totalActions > 0) {
      parts.push(`${doneCount}/${totalActions} action${totalActions > 1 ? "s" : ""} complétée${doneCount > 1 ? "s" : ""}`);
    }
    return parts.join(" · ");
  }, [trend, zones, actions]);

  const suggestedQuestions = useMemo(() => {
    const questions: string[] = [];
    for (const z of zones) {
      const q = ZONE_QUESTIONS[z.label];
      if (q && questions.length < 3) questions.push(q);
    }
    if (questions.length < 3 && trend === "down") questions.push("Comment gérez-vous votre récupération cette semaine ?");
    if (questions.length < 3) questions.push("Qu'est-ce qui vous donne envie de continuer en ce moment ?");
    if (questions.length < 3) questions.push("Comment gérez-vous votre priorisation cette semaine ?");
    return questions.slice(0, 3);
  }, [zones, trend]);

  const confidenceScore = totalDaysSinceActivation > 0 ? Math.round((daysWithCheckin / totalDaysSinceActivation) * 100) : 0;

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js" as any);
      const element = briefRef.current;
      if (!element) return;

      const opt = {
        margin: [8, 12, 8, 12],
        filename: `Brief_${displayName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendLabel = trend === "up" ? "En hausse" : trend === "down" ? "En baisse" : "Stable";
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-orange-600" : "text-muted-foreground";
  const trendBg = trend === "up" ? "bg-green-50" : trend === "down" ? "bg-orange-50" : "bg-muted/30";

  if (loading) {
    return (
      <B2BLayout pageTitle="Brief pré-séance">
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
          <p className="text-muted-foreground">Partage non activé ou accès refusé.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </B2BLayout>
    );
  }

  const doneActions = actions.filter(a => a.status === "done").length;

  return (
    <B2BLayout pageTitle={`Brief — ${displayName}`}>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/pro/mentor/entrepreneur/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour fiche
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting} size="sm">
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Télécharger en PDF
          </Button>
        </div>

        {/* Brief content — exported to PDF */}
        <div ref={briefRef} className="bg-background p-6 md:p-8 space-y-5 rounded-lg border" style={{ pageBreakInside: 'avoid' }}>
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-widest uppercase text-primary">ASTRYD · BRIEF PRÉ-SÉANCE</span>
              <span className="text-xs text-muted-foreground">{today}</span>
            </div>
            <h1 className="text-xl font-bold mt-2">{displayName}</h1>
            {cohortName && <p className="text-sm text-muted-foreground">{cohortName}</p>}
          </div>

          {/* Snapshot — Vue d'ensemble en un coup d'œil */}
          <div className={`rounded-lg p-4 border ${trendBg}`} style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Vue d'ensemble</span>
            </div>
            <p className="text-sm mb-3">{hypothesis}</p>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Score moyen */}
              <div className={`rounded-lg border p-3 text-center ${avgScore ? getScoreBg(avgScore) : 'bg-muted/30 border-border'}`}>
                <p className="text-xs text-muted-foreground mb-1">Score moyen</p>
                <p className={`text-2xl font-bold ${avgScore ? getScoreColor(avgScore) : 'text-muted-foreground'}`}>
                  {avgScore ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">/10</p>
              </div>

              {/* Tendance */}
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Tendance</p>
                <div className={`flex items-center justify-center gap-1 ${trendColor}`}>
                  <TrendIcon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{trendLabel}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Actions</p>
                <p className="text-2xl font-bold text-foreground">{doneActions}<span className="text-sm font-normal text-muted-foreground">/{actions.length}</span></p>
                <p className="text-[10px] text-muted-foreground">complétées</p>
              </div>

              {/* Fiabilité */}
              <div className="rounded-lg border bg-background p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Fiabilité</p>
                <p className={`text-2xl font-bold ${confidenceScore >= 60 ? 'text-green-600' : confidenceScore >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {confidenceScore}%
                </p>
                <p className="text-[10px] text-muted-foreground">{daysWithCheckin}/{totalDaysSinceActivation}j</p>
              </div>
            </div>
          </div>

          {/* Météo détaillée */}
          {checkins.length > 0 && (
            <div style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center gap-2 mb-3">
                <Smile className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Météo — 7 derniers jours</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-2 rounded-lg bg-muted/30 border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-medium text-muted-foreground">Énergie</span>
                  </div>
                  {checkins.map((c, i) => (
                    <span key={i} className={`inline-block w-6 text-xs font-mono ${getScoreColor(c.energy)}`}>{c.energy}</span>
                  ))}
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30 border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-3 w-3 text-blue-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Clarté</span>
                  </div>
                  {checkins.map((c, i) => (
                    <span key={i} className={`inline-block w-6 text-xs font-mono ${getScoreColor(c.clarity)}`}>{c.clarity}</span>
                  ))}
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30 border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Smile className="h-3 w-3 text-green-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Humeur</span>
                  </div>
                  {checkins.map((c, i) => (
                    <span key={i} className={`inline-block w-6 text-xs font-mono ${getScoreColor(c.mood)}`}>{c.mood}</span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-right">
                {checkins.map(c => c.date).join(" → ")}
              </p>
            </div>
          )}

          {/* Zones d'attention */}
          {zones.length > 0 && (
            <div style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">Zones d'attention</span>
              </div>
              <div className="space-y-2">
                {zones.map(z => (
                  <div key={z.label} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${z.severity >= 2 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm flex-1">{z.label}</span>
                    <Badge variant="secondary" className={`text-[10px] ${z.severity >= 2 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                      {z.severity >= 2 ? "Élevée" : "Modérée"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions suggérées */}
          <div style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">Questions à poser</span>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-blue-50/50">
                  <span className="text-xs font-bold text-blue-500 mt-0.5">{i + 1}.</span>
                  <p className="text-sm">{q}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Micro-actions récentes */}
          <div style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Dernières actions</span>
            </div>
            {actions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune action enregistrée sur cette période.</p>
            ) : (
              <div className="space-y-1.5">
                {actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    {a.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm flex-1 truncate">{a.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-4 flex items-start gap-2 text-xs text-muted-foreground" style={{ pageBreakInside: 'avoid' }}>
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Généré par Astryd — Document confidentiel</p>
              <p>Ce brief est un support de préparation à l'échange, pas un diagnostic. Les données sont déclaratives.</p>
            </div>
          </div>
        </div>
      </div>
    </B2BLayout>
  );
};

export default MentorBrief;
