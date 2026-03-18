import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Copy, Check, Users, Link2, Trash2, Calendar } from "lucide-react";
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
import B2BLayout from "@/components/b2b/B2BLayout";
import { toast } from "sonner";

interface Invitation {
  id: string;
  invite_code: string;
  cohort_id: string;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AffiliatedEntrepreneur {
  entrepreneur_id: string;
  display_name: string | null;
  activated_at: string | null;
  is_active: boolean;
  sharing_id: string;
}

const MentorInvitations = () => {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [affiliatedEntrepreneurs, setAffiliatedEntrepreneurs] = useState<AffiliatedEntrepreneur[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entrepreneurToDelete, setEntrepreneurToDelete] = useState<AffiliatedEntrepreneur | null>(null);

  useEffect(() => {
    loadInvitation();
  }, []);

  const loadInvitation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get mentor's cohort
      const { data: members } = await supabase
        .from("cohort_members")
        .select("cohort_id")
        .eq("mentor_id", user.id)
        .limit(1);

      if (!members?.[0]) {
        setLoading(false);
        return;
      }
      setCohortId(members[0].cohort_id);

      // Get existing invitation
      const { data: invites } = await supabase
        .from("mentor_invitations")
        .select("*")
        .eq("mentor_id", user.id)
        .eq("cohort_id", members[0].cohort_id)
        .limit(1);

      if (invites?.[0]) {
        setInvitation(invites[0] as Invitation);
      }

      // Get affiliated entrepreneurs via mentor_sharing
      const { data: sharingData } = await supabase
        .from("mentor_sharing")
        .select("id, entrepreneur_id, is_active, activated_at")
        .eq("mentor_id", user.id);

      if (sharingData && sharingData.length > 0) {
        const entrepreneurIds = sharingData.map(s => s.entrepreneur_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, display_name")
          .in("user_id", entrepreneurIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

        setAffiliatedEntrepreneurs(
          sharingData.map(s => ({
            entrepreneur_id: s.entrepreneur_id,
            display_name: profileMap.get(s.entrepreneur_id) || null,
            activated_at: s.activated_at,
            is_active: s.is_active ?? false,
            sharing_id: s.id,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!cohortId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = generateCode();
    const { data, error } = await supabase
      .from("mentor_invitations")
      .insert({
        mentor_id: user.id,
        invite_code: code,
        cohort_id: cohortId,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création du lien");
      return;
    }
    setInvitation(data as Invitation);
    toast.success("Lien d'invitation créé !");
  };

  const getInviteUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${invitation?.invite_code}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleDeleteRequest = (entrepreneur: AffiliatedEntrepreneur) => {
    setEntrepreneurToDelete(entrepreneur);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entrepreneurToDelete) return;
    setDeletingId(entrepreneurToDelete.sharing_id);
    setShowDeleteConfirm(false);

    try {
      // Deactivate sharing
      const { error } = await supabase
        .from("mentor_sharing")
        .update({ is_active: false })
        .eq("id", entrepreneurToDelete.sharing_id);

      if (error) throw error;

      // Remove from cohort_members
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("cohort_members")
          .delete()
          .eq("entrepreneur_id", entrepreneurToDelete.entrepreneur_id)
          .eq("mentor_id", user.id);
      }

      setAffiliatedEntrepreneurs(prev =>
        prev.filter(e => e.sharing_id !== entrepreneurToDelete.sharing_id)
      );
      toast.success("Lien avec l'entrepreneur supprimé");
    } catch (error) {
      console.error("Error deleting affiliation:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
      setEntrepreneurToDelete(null);
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
      <B2BLayout pageTitle="Invitations">
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </B2BLayout>
    );
  }

  return (
    <B2BLayout pageTitle="Invitations">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        <p className="text-sm text-muted-foreground">
          Partagez votre lien d'invitation pour que de nouveaux entrepreneurs rejoignent Astryd 
          et soient automatiquement affiliés à votre suivi. Ils bénéficieront du plan <strong>Élan</strong> (Premium+).
        </p>

        {!cohortId ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Vous n'êtes pas encore rattaché à une cohorte.
            </p>
          </Card>
        ) : !invitation ? (
          <Card className="p-8 text-center space-y-4">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Vous n'avez pas encore de lien d'invitation.
            </p>
            <Button onClick={handleCreate}>
              <Mail className="h-4 w-4 mr-2" /> Créer mon lien d'invitation
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Votre lien d'invitation
                </h3>
                <Badge variant={invitation.is_active ? "default" : "secondary"}>
                  {invitation.is_active ? "Actif" : "Désactivé"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getInviteUrl()}
                  className="text-xs font-mono bg-muted"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Les entrepreneurs qui s'inscrivent via ce lien seront automatiquement rattachés à votre cohorte 
                avec le plan <strong>Élan</strong> (Premium+ incluant le mentorat).
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inscriptions via ce lien</span>
                <Badge variant="outline" className="text-base font-semibold">
                  {invitation.used_count}
                </Badge>
              </div>
            </Card>
          </div>
        )}

        {/* Affiliated entrepreneurs list */}
        {affiliatedEntrepreneurs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Entrepreneurs affiliés</h3>
            {affiliatedEntrepreneurs.map((entrepreneur) => (
              <Card key={entrepreneur.sharing_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {entrepreneur.display_name || "Entrepreneur"}
                    </p>
                    {entrepreneur.activated_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Affilié depuis le {formatDate(entrepreneur.activated_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={entrepreneur.is_active ? "default" : "secondary"} className="text-xs">
                      {entrepreneur.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteRequest(entrepreneur)}
                      disabled={deletingId === entrepreneur.sharing_id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'affiliation ?</AlertDialogTitle>
            <AlertDialogDescription>
              {entrepreneurToDelete?.display_name || "Cet entrepreneur"} ne sera plus rattaché à votre suivi. 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </B2BLayout>
  );
};

export default MentorInvitations;
