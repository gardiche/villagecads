import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Plus, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface ProjectSwitcherProps {
  currentIdeaId: string;
  onIdeaChange: (ideaId: string) => void;
}

const ProjectSwitcher = ({ currentIdeaId, onIdeaChange }: ProjectSwitcherProps) => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIdeas(data);
    }
    setLoading(false);
  };

  const handleNewProject = () => {
    // Navigate to simplified onboarding (just idea creation, profile already exists)
    navigate("/onboarding/new-idea");
  };

  const currentIdea = ideas.find((idea) => idea.id === currentIdeaId);

  if (loading) {
    return <div className="h-10 w-48 bg-muted/50 rounded animate-pulse" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[200px]">
          <div className="flex items-center gap-2 truncate">
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentIdea?.title || "Sélectionner un projet"}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuLabel>Mes projets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ideas.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Aucun projet
          </div>
        ) : (
          ideas.map((idea) => (
            <DropdownMenuItem
              key={idea.id}
              onClick={() => onIdeaChange(idea.id)}
              className={currentIdeaId === idea.id ? "bg-muted" : ""}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{idea.title}</p>
                {idea.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {idea.description.substring(0, 60)}...
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProjectSwitcher;
