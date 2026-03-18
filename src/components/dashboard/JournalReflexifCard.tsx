import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface JournalReflexifCardProps {
  ideaId: string;
  onEntryAdded: () => void;
  onInteractionAttempt?: () => void;
}

const JournalReflexifCard = ({ ideaId, onEntryAdded, onInteractionAttempt }: JournalReflexifCardProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [ideaId]);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newEntry.trim()) return;

    // Vérifier l'authentification et appeler callback si nécessaire
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onInteractionAttempt) {
        onInteractionAttempt();
      }
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          idea_id: ideaId,
          content: newEntry,
          prompt: "Actualités / Réflexion libre",
        });

      if (error) throw error;

      toast.success("Entrée ajoutée à votre journal");
      setNewEntry("");
      await loadEntries();
      
      // Trigger analysis update
      setTimeout(() => {
        onEntryAdded();
      }, 500);
    } catch (error: any) {
      console.error("Error adding entry:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextareaClick = () => {
    if (onInteractionAttempt) {
      onInteractionAttempt();
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Ton journal de progression</h3>
      </div>

      <div className="space-y-6">
        {/* New Entry Form */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Quoi de neuf aujourd'hui dans ton cheminement ?
          </p>
          <Textarea
            placeholder="Partagez vos réflexions, avancées, doutes, questions... L'IA analyse vos entrées pour adapter votre accompagnement."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            onClick={handleTextareaClick}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={!newEntry.trim() || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Enregistrement...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Ajouter au journal
              </>
            )}
          </Button>
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">Tes dernières réflexions</p>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="border-l-2 border-primary/40 pl-4 py-2">
                  {entry.mood && (
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {entry.mood}
                    </Badge>
                  )}
                  <p className="text-sm line-clamp-3">{entry.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(entry.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Commence à écrire pour clarifier tes pensées</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default JournalReflexifCard;
