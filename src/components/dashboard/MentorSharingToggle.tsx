import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Loader2, Shield, Lock, CheckCircle2, Info, UserX } from "lucide-react";
import { toast } from "sonner";
import { logAccess } from "@/hooks/useAccessLog";

const MentorSharingToggle = () => {
  const [isActive, setIsActive] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [hasMentorAssignment, setHasMentorAssignment] = useState(false);
  const [showConfirmOff, setShowConfirmOff] = useState(false);

  useEffect(() => {
    loadSharingStatus();
  }, []);

  const loadSharingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check cohort_members first for mentor assignment
      const { data: membership } = await supabase
        .from("cohort_members")
        .select("mentor_id")
        .eq("entrepreneur_id", user.id)
        .not("mentor_id", "is", null)
        .maybeSingle();

      if (!membership) {
        setHasMentorAssignment(false);
        setLoading(false);
        return;
      }

      setHasMentorAssignment(true);

      // Get mentor name
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", membership.mentor_id)
        .maybeSingle();

      setMentorName(profile?.display_name || "ton mentor");

      // Get sharing status
      const { data: sharing } = await supabase
        .from("mentor_sharing")
        .select("is_active, activated_at")
        .eq("entrepreneur_id", user.id)
        .eq("mentor_id", membership.mentor_id)
        .maybeSingle();

      if (sharing) {
        setIsActive(sharing.is_active ?? false);
        setActivatedAt(sharing.activated_at);
      }
    } catch (error) {
      console.error("Error loading sharing status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRequest = (checked: boolean) => {
    if (!checked && isActive) {
      setShowConfirmOff(true);
      return;
    }
    performToggle(checked);
  };

  const performToggle = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: Record<string, unknown> = {
        is_active: checked,
      };

      // Only set activated_at on first activation
      if (checked && !activatedAt) {
        updateData.activated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("mentor_sharing")
        .update(updateData)
        .eq("entrepreneur_id", user.id);

      if (error) throw error;

      setIsActive(checked);
      if (checked && !activatedAt) {
        setActivatedAt(new Date().toISOString());
      }

      logAccess("entrepreneur_toggle_sharing", "entrepreneur", undefined, { action: checked ? "activate" : "deactivate" });
      toast.success(checked
        ? "Partage activé avec ton mentor"
        : "Partage désactivé"
      );
    } catch (error) {
      console.error("Error updating sharing:", error);
      toast.error("Erreur lors de la mise à jour du partage");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!hasMentorAssignment) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserX className="h-5 w-5 text-muted-foreground" />
            Partage mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tu n'es pas encore rattaché à un programme de mentorat.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-primary" />
            Partage avec {mentorName || "ton mentor"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Toggle row */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="sharing-toggle" className="cursor-pointer text-sm font-medium">
              Partager mes avancées avec {mentorName || "mon mentor"}
            </Label>
            <div className="flex items-center gap-2">
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                id="sharing-toggle"
                checked={isActive}
                onCheckedChange={handleToggleRequest}
                disabled={updating}
                aria-label={`${isActive ? "Désactiver" : "Activer"} le partage avec ${mentorName || "ton mentor"}`}
              />
            </div>
          </div>

          {/* Status detail */}
          {!isActive ? (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Le partage est désactivé. {mentorName || "Ton mentor"} ne peut voir aucune de tes données.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Activation date */}
              {activatedAt && (
                <p className="text-sm text-muted-foreground">
                  Le partage est activé depuis le <span className="font-medium text-foreground">{formatDate(activatedAt)}</span>.{" "}
                  {mentorName || "Ton mentor"} peut voir :
                </p>
              )}

              {/* What IS shared */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Tes check-ins quotidiens (énergie, clarté, humeur)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Tes zones d'attention</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Tes micro-actions</span>
                </div>
              </div>

              {/* What is NOT shared */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Ton journal personnel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Tes conversations avec le Brain</span>
                </div>
              </div>

              {/* Non-retroactivity notice */}
              {activatedAt && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Seules les données à partir du{" "}
                    <span className="font-medium">{formatDate(activatedAt)}</span>{" "}
                    sont visibles. Rien d'antérieur.
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog for deactivation */}
      <AlertDialog open={showConfirmOff} onOpenChange={setShowConfirmOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver le partage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Es-tu sûr ? {mentorName || "Ton mentor"} ne pourra plus accéder à tes données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmOff(false);
                performToggle(false);
              }}
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MentorSharingToggle;
