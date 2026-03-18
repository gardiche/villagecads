import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Linkedin, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const CVImportSection = ({ value, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10MB");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Call the analyze-cv edge function
      const { data, error } = await supabase.functions.invoke('analyze-cv', {
        body: formData,
      });

      if (error) throw error;

      if (data?.rawText) {
        console.log('✅ CV rawText length:', data.rawText.length);
        console.log('✅ CV rawText preview:', data.rawText.substring(0, 200));
        // Just use the raw extracted text without parsing
        onChange(data.rawText);
        setUploadedFile(file.name);
        toast.success("CV extrait avec succès !");
      } else {
        console.error('❌ No rawText in response:', data);
        toast.error("Le CV a été analysé mais aucun texte n'a été extrait");
      }
    } catch (error: any) {
      console.error('Error analyzing CV:', error);
      toast.error("Erreur lors de l'analyse du CV");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Votre parcours professionnel</h2>
        <p className="text-muted-foreground text-lg">
          Copiez-collez votre profil LinkedIn ou le contenu de votre CV
        </p>
      </div>

      <Card className="p-6 space-y-4">
        {uploadedFile && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-600 dark:text-green-400">
              <strong>{uploadedFile}</strong> analysé avec succès !
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5" />
              <span className="text-sm">LinkedIn</span>
            </div>
            <span className="text-sm">ou</span>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">PDF / Word</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('cv-file-upload')?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer CV
              </>
            )}
          </Button>
          <input
            id="cv-file-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cv-content">Parcours et compétences *</Label>
          <Textarea
            id="cv-content"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Collez ici le contenu de votre profil LinkedIn ou les informations de votre CV (formations, expériences, compétences clés...)

Exemple :
- Formation : Master Marketing Digital, École XYZ
- Expérience : 5 ans en tant que Chef de projet digital chez ABC
- Compétences : Gestion de projet, SEO/SEA, Analytics, Leadership d'équipe
- Secteurs : E-commerce, SaaS, Startup"
            className="min-h-[300px] font-mono text-sm"
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Plus tu donnes de détails, plus l'analyse de ton alignement sera précise
          </p>
        </div>
      </Card>
    </div>
  );
};
