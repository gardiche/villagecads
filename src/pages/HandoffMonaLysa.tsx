import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

const HandoffMonaLysa = () => {
  const navigate = useNavigate();
  const [idea, setIdea] = useState<any>(null);
  const [decision, setDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load latest idea
    const { data: ideaData } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ideaData) {
      setLoading(false);
      return; // Will show empty state in-page
    }

    setIdea(ideaData);

    // Load latest decision
    const { data: decisionData } = await supabase
      .from("decisions")
      .select("*")
      .eq("idea_id", ideaData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setDecision(decisionData);
    setLoading(false);
  };

  const handleExport = async () => {
    if (!idea) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      title: idea.title,
      description: idea.description || "",
      current_decision: decision?.state || "KEEP",
      rationale: decision?.rationale || "",
      exported_at: new Date().toISOString(),
    };

    // Save integration event
    const { error } = await supabase
      .from("integration_events")
      .insert({
        user_id: user.id,
        idea_id: idea.id,
        type: "handoff_monalysa",
        payload,
      });

    if (error) {
      toast.error("Erreur lors de l'export");
      return;
    }

    toast.success("Export réussi !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CommonHeader pageTitle="Passage à Mona Lysa">
          <Button variant="ghost" onClick={() => navigate("/profil-entrepreneurial")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </CommonHeader>
        <div className="flex-1 container max-w-3xl mx-auto py-8 px-4 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-bold mb-2">Aucun projet trouvé</h2>
            <p className="text-muted-foreground mb-6">
              Commencez par décrire votre idée pour pouvoir utiliser cette fonctionnalité.
            </p>
            <Button onClick={() => navigate("/onboarding/idea")}>Décrire mon idée</Button>
          </Card>
        </div>
        <CommonFooter pageTitle="Passage à Mona Lysa" />
      </div>
    );
  }

  const payload = {
    title: idea.title,
    description: idea.description || "",
    current_decision: decision?.state || "KEEP",
    rationale: decision?.rationale || "",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CommonHeader pageTitle="Passage à Mona Lysa">
        <Button variant="ghost" onClick={() => navigate("/profil-entrepreneurial")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </CommonHeader>
      
      <div className="flex-1 container max-w-3xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">
              Passage à Mona Lysa
            </h1>
            <p className="text-muted-foreground">
              Astryd vous a accompagné sur votre posture et votre alignement.
              <br />
              Mona Lysa prend le relais pour l'exécution marché.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">Données exportées</h2>
            <pre className="bg-background p-4 rounded text-sm overflow-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          <div className="space-y-4">
            <Button onClick={handleExport} className="w-full" size="lg">
              Enregistrer l'export
            </Button>
            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href="https://monalysa.io" target="_blank" rel="noopener noreferrer">
                Ouvrir Mona Lysa
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          <div className="mt-8 p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Rappel :</strong> Astryd reste disponible pour vous accompagner sur votre posture,
              votre alignement et votre équilibre pendant toute la phase d'exécution avec Mona Lysa.
            </p>
          </div>
        </Card>
      </div>
      
      <CommonFooter pageTitle="Passage à Mona Lysa" />
    </div>
  );
};

export default HandoffMonaLysa;
