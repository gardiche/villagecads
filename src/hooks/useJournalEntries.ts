import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

type JournalEntryType = "checkin" | "micro_action" | "note" | "ai_response";

interface JournalEntry {
  id: string;
  user_id: string;
  idea_id: string | null;
  content: string;
  entry_type: JournalEntryType;
  shared_with_mentor: boolean;
  
  metadata: Json;
  mood: string | null;
  sender: string;
  created_at: string;
}

interface CreateEntryParams {
  content: string;
  entry_type: JournalEntryType;
  idea_id?: string;
  shared_with_mentor?: boolean;
  metadata?: Record<string, unknown>;
  mood?: string;
  sender?: "user" | "ai";
}

export const useJournalEntries = (ideaId?: string) => {
  const queryClient = useQueryClient();

  // Fetch last 5 entries for AI context
  const { data: recentEntries, isLoading } = useQuery({
    queryKey: ["journal-entries", ideaId, "recent"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (ideaId) {
        query = query.eq("idea_id", ideaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  // Create new journal entry
  const createEntry = useMutation({
    mutationFn: async (params: CreateEntryParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("journal_entries")
        .insert([{
          user_id: user.id,
          content: params.content,
          entry_type: params.entry_type,
          idea_id: params.idea_id || null,
          shared_with_mentor: params.shared_with_mentor || false,
          metadata: (params.metadata || {}) as Json,
          mood: params.mood || null,
          sender: params.sender || "user",
        }])
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  // Create checkin entry with metadata
  const createCheckin = async (params: {
    energy: number;
    clarity: number;
    mood: number;
    journalText?: string;
    shareWithMentor: boolean;
    ideaId?: string;
  }) => {
    return createEntry.mutateAsync({
      content: params.journalText || "",
      entry_type: "checkin",
      idea_id: params.ideaId,
      shared_with_mentor: params.shareWithMentor,
      metadata: {
        energy_level: params.energy,
        clarity_level: params.clarity,
        mood_level: params.mood,
      },
    });
  };

  // Create micro-action completion entry
  const createMicroActionCompletion = async (params: {
    actionTitle: string;
    feelingAfter: string;
    ideaId?: string;
  }) => {
    return createEntry.mutateAsync({
      content: params.actionTitle,
      entry_type: "micro_action",
      idea_id: params.ideaId,
      metadata: {
        status: "done",
        feeling_after: params.feelingAfter,
      },
    });
  };

  return {
    recentEntries,
    isLoading,
    createEntry: createEntry.mutate,
    createCheckin,
    createMicroActionCompletion,
    isCreating: createEntry.isPending,
  };
};
