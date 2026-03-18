import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface JournalCardProps {
  ideaId: string;
}

const JournalCard = ({ ideaId }: JournalCardProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [ideaId]);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Journal guidé</h3>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle entrée
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Ton journal est vide</p>
          <p className="text-sm mt-2">Commence à écrire pour clarifier tes pensées</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border-l-2 border-primary pl-4 py-2">
              {entry.prompt && (
                <p className="text-sm text-muted-foreground mb-1">{entry.prompt}</p>
              )}
              <p className="text-sm line-clamp-2">{entry.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default JournalCard;
