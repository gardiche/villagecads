import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const DevCacheCleaner = () => {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleClearCache = () => {
    try {
      localStorage.clear();
      toast.success("Cache nettoyé avec succès");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Erreur lors du nettoyage du cache:", error);
      toast.error("Erreur lors du nettoyage du cache");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleClearCache}
        variant="destructive"
        size="sm"
        className="shadow-sm"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Nettoyer le cache
      </Button>
    </div>
  );
};
