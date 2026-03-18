import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";
import B2BLayout from "@/components/b2b/B2BLayout";
import { logAccess } from "@/hooks/useAccessLog";

interface EntrepreneurSummary {
  userId: string;
  displayName: string;
  lastCheckin: { energy: number; clarity: number; mood: number; date: string } | null;
  status: "active" | "silent" | "inactive";
  lastActionText: string | null;
  lastActionDate: string | null;
  activatedAt: string | null;
  isActive: boolean;
}

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [entrepreneurs, setEntrepreneurs] = useState<EntrepreneurSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "silent">("all");

  useEffect(() => {
    loadEntrepreneurs();
    logAccess("mentor_view_list", "entrepreneur");
  }, []);

  const loadEntrepreneurs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get entrepreneurs from cohort_members assigned to this mentor
      const { data: members } = await supabase
        .from("cohort_members")
        .select("entrepreneur_id")
        .eq("mentor_id", user.id);

      if (!members || members.length === 0) {
        setLoading(false);
        return;
      }

      const entrepreneurIds = members.map(m => m.entrepreneur_id);

      // Get sharing status for all entrepreneurs
      const { data: sharing } = await supabase
        .from("mentor_sharing")
        .select("entrepreneur_id, is_active, activated_at")
        .eq("mentor_id", user.id)
        .in("entrepreneur_id", entrepreneurIds);

      const sharingMap = new Map(
        (sharing || []).map(s => [s.entrepreneur_id, s])
      );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const summaries: EntrepreneurSummary[] = [];

      for (const eid of entrepreneurIds) {
        const share = sharingMap.get(eid);
        const isActive = share?.is_active ?? false;
        const activatedAt = share?.activated_at ?? null;

        // Get profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("user_id", eid)
          .maybeSingle();

        let lastCheckin: EntrepreneurSummary["lastCheckin"] = null;
        let lastActionText: string | null = null;
        let lastActionDate: string | null = null;
        let status: EntrepreneurSummary["status"] = "inactive";

        if (isActive && activatedAt) {
          // Get last checkin (non-retroactive)
          const { data: checkins } = await supabase
            .from("daily_checkins")
            .select("energy_level, clarity_level, mood_level, created_at")
            .eq("user_id", eid)
            .gte("created_at", activatedAt)
            .order("created_at", { ascending: false })
            .limit(1);

          if (checkins?.[0]) {
            lastCheckin = {
              energy: checkins[0].energy_level,
              clarity: checkins[0].clarity_level,
              mood: checkins[0].mood_level,
              date: checkins[0].created_at,
            };
          }

          // Get last completed daily_micro_actions (non-retroactive)
          const { data: microActions } = await supabase
            .from("daily_micro_actions")
            .select("title, created_at")
            .eq("user_id", eid)
            .eq("status", "done")
            .gte("created_at", activatedAt)
            .order("created_at", { ascending: false })
            .limit(1);

          if (microActions?.[0]) {
            lastActionText = microActions[0].title;
            lastActionDate = microActions[0].created_at;
          } else {
            // Fallback to micro_commitments
            const { data: commitments } = await supabase
              .from("micro_commitments")
              .select("text, created_at")
              .eq("user_id", eid)
              .eq("status", "done")
              .gte("created_at", activatedAt)
              .order("created_at", { ascending: false })
              .limit(1);

            if (commitments?.[0]) {
              lastActionText = commitments[0].text;
              lastActionDate = commitments[0].created_at;
            }
          }

          // Determine status
          const lastActivity = lastCheckin?.date || lastActionDate;
          const isSilent = !lastActivity || new Date(lastActivity) < sevenDaysAgo;
          status = isSilent ? "silent" : "active";
        }

        summaries.push({
          userId: eid,
          displayName: profile?.display_name || "Entrepreneur",
          lastCheckin,
          status,
          lastActionText,
          lastActionDate,
          activatedAt,
          isActive,
        });
      }

      setEntrepreneurs(summaries);
    } catch (error) {
      console.error("Error loading entrepreneurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return "😊";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    if (score >= 2) return "😕";
    return "😢";
  };

  const getStatusBadge = (status: EntrepreneurSummary["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600/15 text-green-700 border-green-200 hover:bg-green-600/15">🟢 Actif</Badge>;
      case "silent":
        return <Badge variant="secondary" className="bg-orange-500/15 text-orange-700 border-orange-200 hover:bg-orange-500/15">🟠 Silencieux</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border hover:bg-muted">⚫ Partage inactif</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Filter logic (inactive always shown, filter applies to active/silent)
  const filtered = entrepreneurs.filter(e => {
    if (e.status === "inactive") return filter === "all";
    return filter === "all" || e.status === filter;
  });

  const activeCount = entrepreneurs.filter(e => e.status === "active").length;
  const silentCount = entrepreneurs.filter(e => e.status === "silent").length;

  if (loading) {
    return (
      <B2BLayout pageTitle="Mes entrepreneurs">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </B2BLayout>
    );
  }

  return (
    <B2BLayout pageTitle="Mes entrepreneurs">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tous ({entrepreneurs.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            🟢 Actifs ({activeCount})
          </Button>
          <Button
            variant={filter === "silent" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("silent")}
          >
            🟠 Silencieux ({silentCount})
          </Button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {entrepreneurs.length === 0
                ? "Aucun entrepreneur n'est encore assigné à votre cohorte."
                : "Aucun entrepreneur ne correspond au filtre sélectionné."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(e => (
              <Card
                key={e.userId}
                className={`p-4 cursor-pointer transition-colors ${
                  e.status === "inactive"
                    ? "opacity-50 border-dashed"
                    : "hover:border-primary/30"
                }`}
                onClick={() => navigate(`/pro/mentor/entrepreneur/${e.userId}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{e.displayName}</span>
                      {getStatusBadge(e.status)}
                    </div>

                    {e.status === "inactive" ? (
                      <p className="text-xs text-muted-foreground">Partage non activé</p>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {/* Météo */}
                        {e.lastCheckin ? (
                          <span>
                            Météo : {getMoodEmoji(Math.round((e.lastCheckin.energy + e.lastCheckin.clarity + e.lastCheckin.mood) / 3))}{" "}
                            É{e.lastCheckin.energy} · C{e.lastCheckin.clarity} · H{e.lastCheckin.mood}
                          </span>
                        ) : (
                          <span>Météo : —</span>
                        )}

                        {/* Last action */}
                        {e.lastActionText ? (
                          <span className="truncate max-w-[200px]">
                            ✅ {e.lastActionText} ({formatDate(e.lastActionDate!)})
                          </span>
                        ) : (
                          <span>Aucune action validée</span>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </B2BLayout>
  );
};

export default MentorDashboard;
