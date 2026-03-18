import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Upload, LogOut } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IdeaDocumentsUpload from "@/components/dashboard/IdeaDocumentsUpload";
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

const EditIdea = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  
  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  useEffect(() => {
    if (!ideaId) {
      navigate("/profil-entrepreneurial");
      return;
    }
    loadIdea();
  }, [ideaId]);

  const loadIdea = async () => {
    if (!ideaId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", ideaId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      setIdea(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading idea:", error);
      toast.error("Erreur lors du chargement de l'idée");
      navigate("/profil-entrepreneurial");
    }
  };

  const handleSavePitch = async () => {
    if (!ideaId) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilisateur non authentifié");
        setSaving(false);
        return;
      }

      // ✅ CORRECTION 1 : Charger l'ancienne version AVANT modification
      const { data: oldIdea } = await supabase
        .from("ideas")
        .select("title, description")
        .eq("id", ideaId)
        .single();

      // ✅ CORRECTION 2 : Créer un snapshot dans integration_events AVANT modification
      if (oldIdea && (oldIdea.title !== title || oldIdea.description !== description)) {
        await supabase.from('integration_events').insert({
          user_id: user.id,
          idea_id: ideaId,
          type: 'idea_version_snapshot',
          payload: {
            previous_title: oldIdea.title,
            previous_description: oldIdea.description,
            new_title: title,
            new_description: description,
            snapshot_date: new Date().toISOString()
          }
        });
        console.log('📸 Snapshot de l\'ancienne version créé dans l\'historique');
      }

      // ✅ CORRECTION 3 : Mettre à jour l'idée
      const { error } = await supabase
        .from("ideas")
        .update({
          title,
          description,
          updated_at: new Date().toISOString()
        })
        .eq("id", ideaId);

      if (error) throw error;
      
      toast.success("Pitch mis à jour");
      setIdea({ ...idea, title, description });
    } catch (error: any) {
      console.error("Error saving pitch:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeQuestionnaire = () => {
    setShowWarningModal(true);
  };

  const handleConfirmQuestionnaire = () => {
    setShowWarningModal(false);
    // Naviguer vers le questionnaire avec paramètre de pré-remplissage
    navigate(`/onboarding?ideaId=${ideaId}&prefill=true`);
  };

  const handleValidateAndRecalculate = async () => {
    if (!ideaId) return;
    
    setSaving(true);
    try {
      // Sauvegarder les modifications du pitch
      await handleSavePitch();
      
      // Récupérer l'ID utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilisateur non authentifié");
        setSaving(false);
        return;
      }
      
      // Appeler astryd-analyse pour recalculer
      const { error } = await supabase.functions.invoke("astryd-analyse", {
        body: { 
          ideaId,
          userId: user.id 
        }
      });

      if (error) throw error;
      
      toast.success("Résultats recalculés avec succès");
      navigate("/profil-entrepreneurial");
    } catch (error: any) {
      console.error("Error recalculating:", error);
      toast.error("Erreur lors du recalcul");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/profil-entrepreneurial")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Modifier mon idée
              </h1>
              <p className="text-sm text-muted-foreground">
                Vous pouvez ajuster votre idée et votre contexte. Vos résultats seront recalculés.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Section 1 - Résumé du pitch actuel */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Votre pitch actuel</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du projet</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nom de votre idée"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre idée en quelques lignes"
                rows={5}
                className="mt-1"
              />
            </div>

            <Button onClick={handleSavePitch} disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder le pitch"}
            </Button>
          </div>
        </Card>

        {/* Section 2 - Reprendre le questionnaire */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold mb-3">Ajuster votre profil entrepreneur</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Vous pouvez reprendre le questionnaire complet. Toutes vos réponses précédentes seront pré-remplies, 
            vous pourrez ajuster ce qui a changé dans votre situation.
          </p>
          <Button onClick={handleResumeQuestionnaire} variant="default">
            Reprendre le questionnaire (pré-rempli)
          </Button>
        </Card>

        {/* Section 3 - Documents complémentaires */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Documents complémentaires</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez des documents pour enrichir l'analyse (CV actualisé, documents descriptifs, notes...)
          </p>
          <IdeaDocumentsUpload 
            ideaId={ideaId!} 
            onDocumentAdded={() => toast.success("Document ajouté")}
          />
        </Card>

        {/* Section 4 - Validation */}
        <div className="flex justify-center pt-4">
          <Button 
            size="lg"
            onClick={handleValidateAndRecalculate}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Recalcul en cours..." : "Valider et recalculer mes résultats"}
          </Button>
        </div>

        {/* Info premium */}
        <Card className="p-4 bg-muted/30 border-muted">
          <p className="text-sm text-center text-muted-foreground">
            💡 Vos anciennes versions sont sauvegardées dans{" "}
            <Button 
              variant="link" 
              className="px-1 h-auto"
              onClick={() => navigate(`/history?ideaId=${ideaId}`)}
            >
              votre historique
            </Button>
          </p>
        </Card>
      </main>

      {/* Modale d'avertissement */}
      <AlertDialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Modifier votre profil va recalculer tous vos résultats
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                En ajustant votre profil entrepreneur, Astryd va régénérer :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Votre score d'alignement</li>
                <li>Tes zones d'attention</li>
                <li>Tes micro-actions</li>
                <li>Ton journal guidé</li>
                <li>Ta décision actuelle</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Tu pourras retrouver ton historique dans l'onglet Historique.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuestionnaire}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CommonFooter pageTitle="Modifier mon projet" />
    </div>
  );
};

export default EditIdea;
