import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Ban, CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BetaCode {
  id: string;
  code: string;
  plan: string;
  max_uses: number;
  used_count: number;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
}

interface CodeUsage {
  id: string;
  user_email: string;
  used_at: string;
}

const AdminBetaCodesSection = () => {
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCodePrefix, setNewCodePrefix] = useState("Alpact2025");
  const [maxUses, setMaxUses] = useState(1);
  const [selectedCode, setSelectedCode] = useState<BetaCode | null>(null);
  const [usages, setUsages] = useState<CodeUsage[]>([]);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("beta_access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error loading codes:", error);
      toast.error("Erreur lors du chargement des codes");
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Générer un code unique
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const fullCode = `${newCodePrefix}${randomSuffix}`;

      const { error } = await supabase
        .from("beta_access_codes")
        .insert({
          code: fullCode,
          plan: "cap",
          max_uses: maxUses,
          created_by: user.id,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 an
        });

      if (error) throw error;

      toast.success("Code généré avec succès");
      await loadCodes();
      setNewCodePrefix("Alpact2025");
      setMaxUses(1);
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Erreur lors de la génération du code");
    } finally {
      setGenerating(false);
    }
  };

  const revokeCode = async (codeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("beta_access_codes")
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
        })
        .eq("id", codeId);

      if (error) throw error;

      toast.success("Code révoqué");
      await loadCodes();
    } catch (error) {
      console.error("Error revoking code:", error);
      toast.error("Erreur lors de la révocation");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié dans le presse-papiers");
  };

  const viewUsages = async (code: BetaCode) => {
    setSelectedCode(code);
    try {
      const { data, error } = await supabase
        .from("beta_code_usage")
        .select("*")
        .eq("code_id", code.id)
        .order("used_at", { ascending: false });

      if (error) throw error;
      setUsages(data || []);
    } catch (error) {
      console.error("Error loading usages:", error);
      toast.error("Erreur lors du chargement des utilisations");
    }
  };

  return (
    <div className="space-y-6">
      {/* Générateur de codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Générer un nouveau code
          </CardTitle>
          <CardDescription>
            Créez un code d'accès bêta pour débloquer le plan Cap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Préfixe du code</Label>
              <Input
                id="prefix"
                value={newCodePrefix}
                onChange={(e) => setNewCodePrefix(e.target.value)}
                placeholder="Alpact2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Utilisations max</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateCode}
                disabled={generating || !newCodePrefix}
                className="w-full"
              >
                {generating ? "Génération..." : "Générer"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Codes d'accès bêta</CardTitle>
              <CardDescription>
                {codes.length} code(s) créé(s)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCodes}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun code généré
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {code.revoked ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Révoqué
                        </Badge>
                      ) : code.used_count >= code.max_uses ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Épuisé
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => viewUsages(code)}
                        className="p-0 h-auto"
                      >
                        {code.used_count} / {code.max_uses}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(code.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {!code.revoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeCode(code.id)}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Révoquer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Détail des utilisations */}
      {selectedCode && (
        <Card>
          <CardHeader>
            <CardTitle>
              Utilisations du code: {selectedCode.code}
            </CardTitle>
            <CardDescription>
              {usages.length} utilisation(s) enregistrée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune utilisation pour ce code
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email utilisateur</TableHead>
                    <TableHead>Date d'utilisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{usage.user_email || "N/A"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(usage.used_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBetaCodesSection;
