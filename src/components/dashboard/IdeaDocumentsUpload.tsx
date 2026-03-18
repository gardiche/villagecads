import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

interface IdeaDocumentsUploadProps {
  ideaId: string;
  onDocumentAdded?: () => void;
}

const IdeaDocumentsUpload = ({ ideaId, onDocumentAdded }: IdeaDocumentsUploadProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [ideaId]);

  const loadDocuments = async () => {
    const { data, error } = await (supabase as any)
      .from("idea_documents")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 20MB");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${ideaId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('idea-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Parse PDF content (note: this would need a backend function to parse PDF)
      // For now, we'll store the reference and parse it server-side when needed

      // Save document reference
      const { error: dbError } = await (supabase as any)
        .from('idea_documents')
        .insert({
          user_id: user.id,
          idea_id: ideaId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast.success("📄 Document ajouté !", {
        description: "Votre idée s'enrichit. Actualisez pour voir vos recommandations personnalisées mises à jour.",
        action: {
          label: "Actualiser",
          onClick: () => window.location.reload()
        },
        duration: 8000
      });
      await loadDocuments();
      
      if (onDocumentAdded) {
        onDocumentAdded();
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error("Erreur lors de l'upload du document");
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (doc: any) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('idea-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await (supabase as any)
        .from('idea_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast.success("Document supprimé");
      await loadDocuments();
      
      if (onDocumentAdded) {
        onDocumentAdded();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Documents annexes</h4>
          </div>
          <ContextualTooltip
            content="Ajoutez des PDF (études de marché, business model, notes) pour enrichir l'analyse de votre idée et obtenir des recommandations encore plus personnalisées."
            side="left"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="h-3 w-3 mr-2" />
                  Ajouter PDF
                </>
              )}
            </Button>
          </ContextualTooltip>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun document. Ajoutez des PDFs pour personnaliser les propositions d'actions.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{doc.file_name}</span>
                  <span className="text-muted-foreground shrink-0">
                    ({Math.round(doc.file_size / 1024)}KB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(doc)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default IdeaDocumentsUpload;
