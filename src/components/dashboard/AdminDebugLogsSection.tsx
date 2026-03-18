import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// 🔒 SÉCU 11: Sensitive fields to mask
const SENSITIVE_FIELDS = [
  'cvContent', 'champsLibre', 'motivations', 'equilibreValues',
  'scenarioAnswers', 'bigFiveValues', 'riasecValues', 'environnement',
  'personaData', 'schwartz', 'bigFive', 'riasec', 'lifeSpheres',
  'context', 'learningProfile'
];

function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);
  
  const masked: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      masked[key] = '[MASQUÉ — Données sensibles]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

interface DebugLog {
  id: string;
  user_id: string;
  idea_id: string | null;
  full_ai_response: string;
  parsed_result: any;
  payload_sent: any;
  model_used: string;
  error: string | null;
  created_at: string;
}

export default function AdminDebugLogsSection() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    loadLogs();
  }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsSuperAdmin(user?.email === "tbo@alpact.vc");
  };

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("astryd_debug_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast.error("Échec du chargement des logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRawData = () => {
    if (!isSuperAdmin) {
      toast.error("Accès réservé au super admin");
      return;
    }
    if (!showRawData) {
      const confirmed = window.confirm(
        "⚠️ Afficher les données psychologiques brutes (PII) ? Confirmer ?"
      );
      if (!confirmed) return;
    }
    setShowRawData(!showRawData);
  };

  const getDisplayPayload = (payload: any) => {
    return showRawData ? payload : maskSensitiveData(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Logs de debug IA (50 derniers)</h3>
          {!showRawData && <Badge variant="secondary" className="text-xs">PII masquées</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button 
              variant={showRawData ? "destructive" : "outline"} 
              size="sm" 
              onClick={handleShowRawData}
            >
              {showRawData ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showRawData ? "Masquer" : "Brut"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12 text-muted-foreground">
            Aucun log de debug trouvé
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <Card
                key={log.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {log.error ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.id.slice(0, 8)}
                        </span>
                        <Badge variant="outline" className="text-xs">{log.model_used}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </div>
                      {log.error && (
                        <div className="text-xs text-destructive">
                          Erreur: {log.error}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedLog && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Détails: {selectedLog.id.slice(0, 8)}</h4>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                    Fermer
                  </Button>
                </div>
                <Tabs defaultValue="response">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="response">Réponse IA</TabsTrigger>
                    <TabsTrigger value="parsed">Résultat parsé</TabsTrigger>
                    <TabsTrigger value="payload">Payload envoyé</TabsTrigger>
                  </TabsList>
                  <TabsContent value="response" className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="text-xs whitespace-pre-wrap">
                        {selectedLog.full_ai_response}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="parsed" className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(getDisplayPayload(selectedLog.parsed_result), null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="payload" className="mt-4">
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(getDisplayPayload(selectedLog.payload_sent), null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
