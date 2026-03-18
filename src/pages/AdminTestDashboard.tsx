import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Search, Database } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/CommonHeader";

export default function AdminTestDashboard() {
  const [userId, setUserId] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Auto-load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    loadCurrentUser();
  }, []);

  const loadData = async () => {
    if (!userId) {
      toast.error("User ID requis");
      return;
    }

    setLoading(true);
    try {
      // Charger toutes les données pour ce user/idea
      const queries: any = {
        user: await supabase.auth.getUser(),
        ideas: await supabase
          .from('ideas')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      };

      if (ideaId) {
        queries.idea = await supabase
          .from('ideas')
          .select('*')
          .eq('id', ideaId)
          .maybeSingle();

        queries.session = await supabase
          .from('astryd_sessions')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', userId)
          .maybeSingle();

        queries.attentionZones = await supabase
          .from('attention_zones')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', userId);

        queries.microCommitments = await supabase
          .from('micro_commitments')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', userId);

        queries.alignmentScores = await supabase
          .from('alignment_scores')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', userId)
          .maybeSingle();

        queries.decision = await supabase
          .from('decisions')
          .select('*')
          .eq('idea_id', ideaId)
          .eq('user_id', userId)
          .maybeSingle();
      }

      queries.assessment = await supabase
        .from('user_assessments')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (queries.assessment.data) {
        const assessmentId = queries.assessment.data.id;
        queries.schwartz = await supabase
          .from('schwartz_values')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();

        queries.bigFive = await supabase
          .from('big_five_traits')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();

        queries.riasec = await supabase
          .from('riasec_scores')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();

        queries.lifeSpheres = await supabase
          .from('life_spheres')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();

        queries.userContext = await supabase
          .from('user_context')
          .select('*')
          .eq('assessment_id', assessmentId)
          .maybeSingle();
      }

      // Résoudre toutes les promesses
      const resolved: any = {};
      for (const [key, promise] of Object.entries(queries)) {
        resolved[key] = (promise as any).data;
      }

      setData(resolved);
      toast.success("Données chargées");
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestIdea = () => {
    if (data?.ideas && data.ideas.length > 0) {
      setIdeaId(data.ideas[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader pageTitle="Admin - Debug Dashboard" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de debug</h1>
          <p className="text-muted-foreground">
            Inspectez les données en base pour diagnostiquer les problèmes de personnalisation
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">User ID</label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="UUID de l'utilisateur"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Idea ID (optionnel)</label>
                <div className="flex gap-2">
                  <Input
                    value={ideaId}
                    onChange={(e) => setIdeaId(e.target.value)}
                    placeholder="UUID de l'idée"
                  />
                  {data?.ideas && data.ideas.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadLatestIdea}
                    >
                      Dernière idée
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadData}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Charger les données
                  </>
                )}
              </Button>
              {data && (
                <Button
                  onClick={loadData}
                  variant="outline"
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rafraîchir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {data && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="idea">Idée</TabsTrigger>
              <TabsTrigger value="coaching">Coaching</TabsTrigger>
              <TabsTrigger value="raw">Données brutes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statut général</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">User authenticated</div>
                      <Badge variant={data.user ? "default" : "destructive"}>
                        {data.user ? "✓ Oui" : "✗ Non"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Assessment complet</div>
                      <Badge variant={data.assessment?.completed ? "default" : "secondary"}>
                        {data.assessment?.completed ? "✓ Oui" : "Partiel"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nombre d'idées</div>
                      <div className="font-bold text-lg">{data.ideas?.length || 0}</div>
                    </div>
                    {ideaId && (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">Session Astryd</div>
                          <Badge variant={data.session ? "default" : "destructive"}>
                            {data.session ? "✓ Existe" : "✗ Manquante"}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Zones d'attention</div>
                          <div className="font-bold text-lg">
                            {data.attentionZones?.length || 0}
                            {(data.attentionZones?.length || 0) >= 3 && (
                              <Badge variant="outline" className="ml-2 text-xs bg-green-500/10">✓</Badge>
                            )}
                            {(data.attentionZones?.length || 0) < 3 && (
                              <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10">⚠</Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Micro-actions</div>
                          <div className="font-bold text-lg">
                            {data.microCommitments?.length || 0}
                            {(data.microCommitments?.length || 0) >= 3 && (
                              <Badge variant="outline" className="ml-2 text-xs bg-green-500/10">✓</Badge>
                            )}
                            {(data.microCommitments?.length || 0) < 3 && (
                              <Badge variant="outline" className="ml-2 text-xs bg-orange-500/10">⚠</Badge>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {ideaId && data.session && (
                <Card>
                  <CardHeader>
                    <CardTitle>Persona détecté</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.session.micro_actions?.persona_profil ? (
                      <div className="space-y-2">
                        <div className="text-lg font-bold">
                          {data.session.micro_actions.persona_profil.titre}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {data.session.micro_actions.persona_profil.synthese}
                        </p>
                        {data.session.micro_actions.persona_profil.visualUrl && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700">
                            ✓ Nano Banana présent
                          </Badge>
                        )}
                        {!data.session.micro_actions.persona_profil.visualUrl && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-700">
                            ✗ Nano Banana manquant
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun persona détecté</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              {data.schwartz && (
                <Card>
                  <CardHeader>
                    <CardTitle>Valeurs Schwartz</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(data.schwartz)
                        .filter(([key]) => !['id', 'assessment_id'].includes(key))
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}</span>
                            <div className="font-medium">{String(value)}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.riasec && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scores RIASEC</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(data.riasec)
                        .filter(([key]) => !['id', 'assessment_id'].includes(key))
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}</span>
                            <div className="font-medium">{String(value)}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.lifeSpheres && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sphères de vie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(data.lifeSpheres)
                        .filter(([key]) => !['id', 'assessment_id'].includes(key))
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}</span>
                            <div className="font-medium">{String(value)}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="idea" className="space-y-4">
              {data.ideas && data.ideas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Idées créées ({data.ideas.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.ideas.map((idea: any) => (
                      <div
                        key={idea.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          idea.id === ideaId ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setIdeaId(idea.id)}
                      >
                        <div className="font-medium">{idea.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{idea.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Créé le {new Date(idea.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {data.idea && (
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de l'idée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Titre</span>
                        <div className="font-medium">{data.idea.title}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Description</span>
                        <div className="font-medium">{data.idea.description || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{data.idea.id}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="coaching" className="space-y-4">
              {ideaId && data.alignmentScores && (
                <Card>
                  <CardHeader>
                    <CardTitle>Scores d'alignement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Score global</span>
                        <div className="text-2xl font-bold">{data.alignmentScores.score_global}/100</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {Object.entries(data.alignmentScores.details || {}).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}</span>
                            <div className="font-medium">{String(value)}/100</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {ideaId && data.attentionZones && data.attentionZones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Zones d'attention ({data.attentionZones.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.attentionZones.map((zone: any) => (
                      <div key={zone.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium">{zone.label}</div>
                          <Badge variant={zone.severity === 3 ? "destructive" : "secondary"}>
                            Sévérité {zone.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{zone.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {ideaId && data.microCommitments && data.microCommitments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Micro-actions ({data.microCommitments.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.microCommitments.map((action: any) => (
                      <div key={action.id} className="p-3 rounded-lg border">
                        <div className="font-medium mb-1">{action.text}</div>
                        <div className="flex gap-2 flex-wrap text-xs">
                          <Badge variant="outline">{action.duree || 'N/A'}</Badge>
                          <Badge variant="outline">{action.jauge_ciblee || 'N/A'}</Badge>
                          <Badge variant="outline">{action.status}</Badge>
                        </div>
                        {action.impact_attendu && (
                          <p className="text-xs text-muted-foreground mt-2">{action.impact_attendu}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {ideaId && data.decision && (
                <Card>
                  <CardHeader>
                    <CardTitle>Décision actuelle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className="text-base px-3 py-1">
                        {data.decision.state}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{data.decision.rationale}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {ideaId && (!data.attentionZones || data.attentionZones.length === 0) && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Aucune zone d'attention trouvée pour cette idée. La fonction astryd-analyse n'a peut-être pas été appelée ou a échoué.
                    </p>
                  </CardContent>
                </Card>
              )}

              {ideaId && (!data.microCommitments || data.microCommitments.length === 0) && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Aucune micro-action trouvée pour cette idée. La fonction astryd-analyse n'a peut-être pas été appelée ou a échoué.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Données brutes JSON
                  </CardTitle>
                  <CardDescription>
                    Vue complète des données chargées depuis Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!data && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Entrez un User ID et cliquez sur "Charger les données" pour commencer
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
