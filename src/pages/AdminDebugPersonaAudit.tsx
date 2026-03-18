import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminDebugPersonaAudit() {
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const runAudit = async () => {
    setLoading(true);
    setAuditResult(null);

    try {
      // Récupérer les données depuis localStorage (onboarding data)
      const equilibreValuesStr = localStorage.getItem('equilibreValues');
      const motivationsStr = localStorage.getItem('motivations');
      const scenarioAnswersStr = localStorage.getItem('scenarioAnswers');
      const environnementStr = localStorage.getItem('environnement');
      const champsLibreStr = localStorage.getItem('champsLibre');

      if (!equilibreValuesStr || !motivationsStr || !scenarioAnswersStr || !environnementStr) {
        toast.error("Données d'onboarding manquantes dans localStorage. Veuillez refaire l'onboarding.");
        setLoading(false);
        return;
      }

      const equilibreValues = JSON.parse(equilibreValuesStr);
      const motivations = JSON.parse(motivationsStr);
      const scenarioAnswers = JSON.parse(scenarioAnswersStr);
      const environnement = JSON.parse(environnementStr);
      const champsLibre = champsLibreStr || "";

      console.log("🚀 Lancement de l'audit avec les données:", {
        equilibreValues,
        motivations,
        scenarioAnswers,
        environnement,
        champsLibre
      });

      // Appeler l'edge function audit-persona-flow
      const { data, error } = await supabase.functions.invoke('audit-persona-flow', {
        body: {
          equilibreValues,
          motivations,
          scenarioAnswers,
          environnement,
          champsLibre
        }
      });

      if (error) throw error;

      console.log("✅ Audit terminé:", data);
      setAuditResult(data.audit);
      toast.success("Audit terminé ! Consultez les logs Supabase pour le diagnostic complet.");

    } catch (error: any) {
      console.error("❌ Erreur lors de l'audit:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Audit Persona Flow - Diagnostic Complet</CardTitle>
          <CardDescription>
            Cette page lance un audit complet du flux de génération de persona pour détecter les incohérences entre les données d'onboarding et le profil généré.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runAudit} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Audit en cours...
              </>
            ) : (
              "🚀 Lancer l'audit"
            )}
          </Button>

          {auditResult && (
            <div className="mt-6 space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🎯 Persona détecté</h3>
                <p className="text-sm"><strong>ID:</strong> {auditResult.personaDetecte.id}</p>
                <p className="text-sm"><strong>Raison:</strong> {auditResult.personaDetecte.reason}</p>
              </div>

              {auditResult.incoherences.length > 0 && (
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive">
                  <h3 className="font-semibold mb-2 text-destructive">⚠️ Incohérences détectées</h3>
                  <ul className="text-sm space-y-1">
                    {auditResult.incoherences.map((inc: string, i: number) => (
                      <li key={i}>{inc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {auditResult.recommandations.length > 0 && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary">
                  <h3 className="font-semibold mb-2">💡 Recommandations</h3>
                  <ul className="text-sm space-y-1">
                    {auditResult.recommandations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                ℹ️ Le diagnostic complet est disponible dans les logs Supabase (Edge Functions → audit-persona-flow).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
