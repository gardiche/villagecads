import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import CommonFooter from "@/components/CommonFooter";
import { ExportPDFModal } from "@/components/dashboard/ExportPDFModal";
import { TimelineWithInsights } from "@/components/dashboard/TimelineWithInsights";
import ProgressionAccessModal from "@/components/dashboard/ProgressionAccessModal";
import CoachingComingSoonModal from "@/components/dashboard/CoachingComingSoonModal";
import CTAFooter from "@/components/dashboard/CTAFooter";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { Download, FileText, Calendar, Loader2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

interface PDFExport {
  id: string;
  file_path: string;
  export_type: string;
  insights_summary: any;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const { plan: currentPlan, hasActiveSubscription, hasProgressionAccess } = useUserSubscription();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  
  const [loading, setLoading] = useState(true);
  const [pdfExports, setPdfExports] = useState<PDFExport[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [personaCap, setPersonaCap] = useState("");
  const [personaTitle, setPersonaTitle] = useState("");
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);

  // Use the subscription hook to determine access
  const hasPremiumAccess = currentPlan === "cap" || currentPlan === "elan" || hasActiveSubscription || hasProgressionAccess;

  useEffect(() => {
    if (hasPremiumAccess) {
      setAccessGranted(true);
      loadHistory();
    } else {
      setShowAccessModal(true);
      setLoading(false);
    }
  }, [ideaId, hasPremiumAccess]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Si pas d'ideaId, récupérer la première idée de l'utilisateur
      let currentIdeaId = ideaId;
      if (!currentIdeaId) {
        const { data: userIdeas } = await supabase
          .from('ideas')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        currentIdeaId = userIdeas?.[0]?.id || null;
      }

      // Plan is now managed by useUserSubscription hook

      // Charger le persona cap depuis localStorage
      const personaDataStr = sessionStorage.getItem('astryd_persona_data');
      if (personaDataStr) {
        try {
          const personaData = JSON.parse(personaDataStr);
          setPersonaCap(personaData.cap2_4semaines || "");
          setPersonaTitle(personaData.titre || "");
        } catch (e) {
          console.error('Error parsing persona data:', e);
        }
      }

      // Charger les exports PDF
      const { data: exports, error: exportsError } = await supabase
        .from('pdf_exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (exportsError) {
        console.error('Error loading PDF exports:', exportsError);
      } else {
        setPdfExports(exports || []);
      }

      // Stocker l'ideaId pour le composant TimelineWithInsights
      if (currentIdeaId && !ideaId) {
        // Mettre à jour l'URL avec l'ideaId trouvé
        navigate(`/history?ideaId=${currentIdeaId}`, { replace: true });
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error loading history:", error);
      toast.error("Erreur lors du chargement de l'historique");
      setLoading(false);
    }
  };


  const handleExportPDF = async (selectedSections: string[]) => {
    if (!ideaId) {
      toast.error("Impossible d'exporter : idée manquante");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté pour exporter");
      return;
    }

    setExportingPDF(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-export', {
        body: {
          userId: user.id,
          ideaId,
          selectedSections,
          personaCap,
          personaTitle
        }
      });

      if (error) throw error;

      // Télécharger le PDF directement
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName || 'astryd-export.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`PDF téléchargé : ${data.fileName}`, { duration: 5000 });
      }

      // Recharger pour afficher le nouvel export
      setTimeout(() => loadHistory(), 1000);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setExportingPDF(false);
      setShowExportModal(false);
    }
  };

  const handleAccessGranted = () => {
    setAccessGranted(true);
    loadHistory();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar 
            currentIdeaId={ideaId || undefined}
            onOpenCoaching={() => setShowCoachingModal(true)}
          />
          
          <div className="flex-1 flex flex-col">
            <DashboardHeader currentPage="Historique de mes actions" />
            
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Accès premium requis</p>
                <Button 
                  onClick={() => setShowAccessModal(true)}
                  variant="default"
                >
                  Débloquer l'accès
                </Button>
              </div>
            </main>
          </div>
        </div>
        
        <ProgressionAccessModal
          open={showAccessModal}
          onOpenChange={setShowAccessModal}
          onAccessGranted={handleAccessGranted}
        />
        
        <CoachingComingSoonModal 
          open={showCoachingModal}
          onOpenChange={setShowCoachingModal}
        />
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          currentIdeaId={ideaId || undefined}
          onOpenCoaching={() => setShowCoachingModal(true)}
        />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage="Historique de mes actions" />

          <main className="flex-1 overflow-y-auto">
            <div className="container max-w-5xl mx-auto px-4 py-8">
              <div className="space-y-6">
                {/* Explainer du plan Cap */}
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/20">
                      <HistoryIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display font-bold text-xl mb-2">
                        {currentPlan === "declic" ? "Débloquez votre historique complet" : "Votre historique de progression"}
                      </h2>
                      {currentPlan === "declic" ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            En plan gratuit Déclic, vous avez accès aux 7 derniers jours uniquement. Passez dès maintenant au plan premium Cap (19€/mois) pour :
                          </p>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <Badge variant="secondary" className="mt-0.5">✓</Badge>
                              <span>Visualiser votre historique complet d'actions de coaching sur Astryd</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Badge variant="secondary" className="mt-0.5">✓</Badge>
                              <span>Bénéficier d'analyses IA approfondies sur votre évolution</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Badge variant="secondary" className="mt-0.5">✓</Badge>
                              <span>Partager votre progression entrepreneuriale en document PDF</span>
                            </li>
                          </ul>
                          <div className="pt-2">
                            <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
                              Découvrir le plan Cap
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Visualisez votre cheminement complet et exportez vos résultats pour les partager avec votre réseau, vos proches, des coachs ou mentors.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Timeline unifiée avec Insights IA */}
                {currentPlan !== "declic" && ideaId && (
                  <TimelineWithInsights ideaId={ideaId} userPlan={currentPlan} />
                )}

          {/* Bouton Export PDF */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Exporter vos résultats en PDF</h2>
                <p className="text-sm text-muted-foreground">
                  Créez un export personnalisé de votre profil, historique et micro-actions pour partager avec votre réseau, vos proches, des coachs ou mentors.
                </p>
              </div>
              <Button
                onClick={() => setShowExportModal(true)}
                disabled={exportingPDF}
                className="gap-2 ml-4"
              >
                {exportingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exporter en PDF
                  </>
                )}
              </Button>
            </div>
          </Card>

                {/* Exports PDF */}
                {currentPlan !== "declic" && pdfExports.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Vos exports PDF</h2>
              </div>
              
              <div className="space-y-3">
                {pdfExports.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Export {exp.export_type === 'complete' ? 'complet' : 'profil'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(exp.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      
                      {exp.insights_summary && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p className="line-clamp-2">
                            💬 {exp.insights_summary.message_coach}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => {
                        const { data: { publicUrl } } = supabase.storage
                          .from('pdf-exports')
                          .getPublicUrl(exp.file_path);
                        window.open(publicUrl, '_blank');
                      }}
                      size="sm"
                      className="ml-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
                  </Card>
                )}
                
                <CTAFooter
                  onProgressionClick={() => setShowAccessModal(true)}
                  onCoachingClick={() => setShowCoachingModal(true)}
                  hideProgression={true}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportPDF}
        isExporting={exportingPDF}
      />
      
      <ProgressionAccessModal
        open={showAccessModal}
        onOpenChange={setShowAccessModal}
        onAccessGranted={handleAccessGranted}
      />

      <CoachingComingSoonModal 
        open={showCoachingModal}
        onOpenChange={setShowCoachingModal}
      />

    </SidebarProvider>
  );
};

export default History;
