import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// 🔒 SÉCU 11: Sensitive fields to mask in payload
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

export default function AdminDebugLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("Access denied: Admin role required");
        navigate("/profil-entrepreneurial");
        return;
      }

      setIsAdmin(true);
      // Check super admin by email
      setIsSuperAdmin(user.email === "tbo@alpact.vc");
      loadLogs();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/profil-entrepreneurial");
    }
  };

  const loadLogs = async () => {
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
      toast.error("Failed to load debug logs");
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
        "⚠️ Vous êtes sur le point d'afficher les données psychologiques brutes (PII). Confirmer ?"
      );
      if (!confirmed) return;
    }
    setShowRawData(!showRawData);
  };

  const getDisplayPayload = (payload: any) => {
    return showRawData ? payload : maskSensitiveData(payload);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/profil-entrepreneurial")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          {isSuperAdmin && (
            <Button 
              variant={showRawData ? "destructive" : "outline"} 
              size="sm"
              onClick={handleShowRawData}
            >
              {showRawData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showRawData ? "Masquer données brutes" : "Afficher données brutes"}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Astryd AI Debug Logs</CardTitle>
            <CardDescription>
              View detailed debug information from AI analysis runs
              {!showRawData && (
                <Badge variant="secondary" className="ml-2">PII masquées</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No debug logs found
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <Card
                    key={log.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {log.error ? (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            )}
                            <span className="font-mono text-sm text-muted-foreground">
                              {log.id.slice(0, 8)}
                            </span>
                            <Badge variant="outline">{log.model_used}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                          {log.error && (
                            <div className="text-sm text-destructive">
                              Error: {log.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedLog && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Log Details: {selectedLog.id.slice(0, 8)}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="response">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="response">AI Response</TabsTrigger>
                  <TabsTrigger value="parsed">Parsed Result</TabsTrigger>
                  <TabsTrigger value="payload">Payload Sent</TabsTrigger>
                </TabsList>
                <TabsContent value="response" className="mt-4">
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <pre className="text-xs whitespace-pre-wrap">
                      {selectedLog.full_ai_response}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="parsed" className="mt-4">
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(getDisplayPayload(selectedLog.parsed_result), null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="payload" className="mt-4">
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(getDisplayPayload(selectedLog.payload_sent), null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
