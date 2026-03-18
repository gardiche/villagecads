import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

const OnboardingNewIdea = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contextDetails, setContextDetails] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Create new idea
      const { data: newIdea, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() + (contextDetails.trim() ? `\n\nContexte:\n${contextDetails.trim()}` : ""),
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ Tracker automatique : marquer l'idée comme renseignée
      localStorage.setItem('ASTRYD_IDEA_DATA', JSON.stringify({
        id: newIdea.id,
        title: newIdea.title,
        timestamp: new Date().toISOString()
      }));

      // 🔄 RÉGÉNÉRER zones et micro-actions après création idée
      console.log('🔄 Déclenchement régénération après création idée...');
      try {
        const regenResponse = await supabase.functions.invoke('regenerate-recommendations', {
          body: {
            ideaId: newIdea.id,
            trigger: 'idea_created'
          }
        });
        
        const regenData = regenResponse.data;
        if (regenData?.archived?.actions > 0) {
          toast.success(`Projet créé et recommandations actualisées 🎯`, {
            description: `${regenData.archived.actions} anciennes actions obsolètes archivées, ${regenData.added.micro_actions} nouvelles actions générées.`,
            duration: 8000
          });
        } else {
          toast.success("Projet créé avec succès !");
        }
      } catch (regenError) {
        console.error('Erreur régénération (non-bloquant):', regenError);
        toast.success("Projet créé avec succès !");
      }

      // Redirect to dashboard with new idea
      navigate(`/profil-entrepreneurial?ideaId=${newIdea.id}`);
    } catch (error: any) {
      console.error("Error creating idea:", error);
      toast.error("Erreur lors de la création du projet");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Nouveau projet">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/micro-actions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </CommonHeader>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Décrivez votre idée. Votre profil entrepreneur est déjà connu d'Astryd,<br />
            donc ce sera rapide !
          </p>
          </div>

          {/* Form */}
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Quel est le nom de votre projet ? *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Mon restaurant végétarien"
                  className="text-lg"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Décrivez votre idée
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Expliquez brièvement votre concept..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Contexte supplémentaire (optionnel)
                </label>
                <Textarea
                  value={contextDetails}
                  onChange={(e) => setContextDetails(e.target.value)}
                  placeholder="Ex: clients cibles, modèle économique, stratégie marketing, valeur différenciante..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Plus tu en dis, plus l'analyse sera précise.
                </p>
              </div>

              <Button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="w-full"
                size="lg"
              >
                {creating ? (
                  <>Création en cours...</>
                ) : (
                  <>
                    Créer le projet
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/micro-actions")}
                className="w-full"
              >
                Retour à mon espace
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <CommonFooter pageTitle="Nouveau projet" />
    </div>
  );
};

export default OnboardingNewIdea;
