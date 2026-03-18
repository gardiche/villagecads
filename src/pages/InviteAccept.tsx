import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import astrydLogo from "@/assets/astryd-logo-transparent.png";

const InviteAccept = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "processing" | "done">("loading");
  const [mentorName, setMentorName] = useState<string | null>(null);

  useEffect(() => {
    validateCode();
  }, [code]);

  const validateCode = async () => {
    if (!code) { setStatus("invalid"); return; }

    const { data } = await supabase
      .from("mentor_invitations")
      .select("id, mentor_id, is_active, cohort_id")
      .eq("invite_code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!data) { setStatus("invalid"); return; }

    // Get mentor name
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("user_id", data.mentor_id)
      .maybeSingle();

    setMentorName(profile?.display_name || "votre mentor");
    setStatus("valid");
  };

  const handleAccept = async () => {
    setStatus("processing");

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Store invite code in localStorage and redirect to auth
      localStorage.setItem("pending_invite_code", code!);
      navigate("/auth?redirect=invite");
      return;
    }

    await processInvite(user.id);
  };

  const processInvite = async (userId: string) => {
    try {
      // Get invitation details
      const { data: invite } = await supabase
        .from("mentor_invitations")
        .select("id, mentor_id, cohort_id")
        .eq("invite_code", code!)
        .eq("is_active", true)
        .single();

      if (!invite) { setStatus("invalid"); return; }

      // Add to cohort_members
      await supabase.from("cohort_members").upsert({
        cohort_id: invite.cohort_id,
        entrepreneur_id: userId,
        mentor_id: invite.mentor_id,
      }, { onConflict: "entrepreneur_id,cohort_id" });

      // Create mentor_sharing entry
      await supabase.from("mentor_sharing").upsert({
        entrepreneur_id: userId,
        mentor_id: invite.mentor_id,
        is_active: false, // entrepreneur activates it themselves
      }, { onConflict: "entrepreneur_id,mentor_id" });

      // Set Élan subscription
      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        plan: "elan" as any,
        status: "active" as any,
      }, { onConflict: "user_id" });

      // Record usage
      await supabase.from("invitation_usage").insert({
        invitation_id: invite.id,
        user_id: userId,
      });

      // Increment used_count
      await supabase.from("mentor_invitations")
        .update({ used_count: (await supabase.from("mentor_invitations").select("used_count").eq("id", invite.id).single()).data?.used_count! + 1 })
        .eq("id", invite.id);

      setStatus("done");
      localStorage.removeItem("pending_invite_code");
    } catch (error) {
      console.error("Error processing invite:", error);
      setStatus("invalid");
    }
  };

  // Check for pending invite after auth
  useEffect(() => {
    const checkPending = async () => {
      const pending = localStorage.getItem("pending_invite_code");
      if (pending && pending === code) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setStatus("processing");
          await processInvite(user.id);
        }
      }
    };
    checkPending();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <img src={astrydLogo} alt="Astryd" className="h-12 w-12 mx-auto" />

        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Vérification de l'invitation…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <h2 className="text-xl font-semibold">Invitation à rejoindre Astryd</h2>
            <p className="text-muted-foreground">
              <strong>{mentorName}</strong> vous invite à rejoindre le programme d'accompagnement.
              Vous bénéficierez automatiquement du plan <strong>Élan</strong> (Premium+).
            </p>
            <Button size="lg" className="w-full" onClick={handleAccept}>
              Accepter l'invitation
            </Button>
          </>
        )}

        {status === "processing" && (
          <>
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Configuration de votre espace…</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Bienvenue sur Astryd !</h2>
            <p className="text-muted-foreground">
              Votre espace est prêt avec le plan Élan. Commencez par découvrir votre profil entrepreneurial.
            </p>
            <Button className="w-full" onClick={() => navigate("/onboarding")}>
              Commencer
            </Button>
          </>
        )}

        {status === "invalid" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Invitation invalide</h2>
            <p className="text-muted-foreground">
              Ce lien d'invitation n'est plus valide ou a expiré.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default InviteAccept;
