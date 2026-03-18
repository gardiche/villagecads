import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

const RetrieveResults = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 8) {
      toast({
        title: "Code invalide",
        description: "Le code doit contenir 8 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('retrieve-guest-results', {
        body: { code: code.toUpperCase() }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Code invalide ou expiré");
      }

      // Sauvegarder les résultats dans localStorage
      sessionStorage.setItem('astryd_guest_results', JSON.stringify(data.personaData));

      // Vérifier que les données ont bien été écrites
      const saved = sessionStorage.getItem('astryd_guest_results');
      if (!saved) {
        toast({
          title: "Erreur",
          description: "Vos résultats n'ont pas pu être restaurés. Essayez à nouveau avec votre code.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Résultats récupérés ! 🎉",
        description: "Vous allez être redirigé vers vos résultats",
      });

      // Rediriger vers le dashboard en mode guest
      setTimeout(() => {
        navigate('/profil-entrepreneurial?from=onboarding-guest');
      }, 1000);
    } catch (err: any) {
      console.error('Error retrieving results:', err);
      toast({
        title: "Erreur",
        description: err.message || "Code invalide ou expiré (24h maximum)",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <CommonHeader pageTitle="Récupérer mes résultats" />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Récupérer mes résultats</h1>
            <p className="text-muted-foreground">
              Entrez le code que vous avez reçu pour retrouver vos résultats
            </p>
          </div>

          <form onSubmit={handleRetrieve} className="space-y-4">
            <div>
              <Label htmlFor="code">Code de récupération (8 caractères)</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABCD1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg tracking-wider font-mono"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Le code est valable 24h après sa génération
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || code.length !== 8}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Récupération...
                </>
              ) : (
                'Récupérer mes résultats'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Vous n'avez pas de code ?
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/onboarding')}
              className="w-full"
            >
              Faire le questionnaire
            </Button>
          </div>
        </Card>
      </main>

      <CommonFooter pageTitle="Récupérer mes résultats" />
    </div>
  );
};

export default RetrieveResults;