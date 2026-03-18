import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import CommonHeader from "@/components/CommonHeader";
import CommonFooter from "@/components/CommonFooter";

const ShareProfile = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedProfile = async () => {
      if (!shareCode) {
        setError("Code de partage invalide");
        setLoading(false);
        return;
      }

      try {
        // Charger le profil partagé
        const { data, error: fetchError } = await supabase
          .from('profile_shares')
          .select('*')
          .eq('share_code', shareCode.toUpperCase())
          .single();

        if (fetchError || !data) {
          setError("Profil non trouvé ou lien expiré");
          setLoading(false);
          return;
        }

        // Incrémenter le compteur de vues
        await supabase
          .from('profile_shares')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);

        setProfileData(data);
      } catch (err: any) {
        console.error('Error loading shared profile:', err);
        setError("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    loadSharedProfile();
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profil non trouvé</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const forces = Array.isArray(profileData.forces) ? profileData.forces : [];
  const verrous = Array.isArray(profileData.verrous) ? profileData.verrous : [];

  return (
    <div className="min-h-screen">
      <CommonHeader pageTitle="Profil partagé" />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-6 px-6 py-3 text-lg bg-primary text-primary-foreground border-0">
            Profil entrepreneurial partagé
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            {profileData.persona_titre}
          </h1>
          
          {profileData.persona_synthese && (
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 font-light">
              {profileData.persona_synthese}
            </p>
          )}
          
          {profileData.persona_visual_url && (
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img 
                src={profileData.persona_visual_url} 
                alt={profileData.persona_titre}
                className="w-full max-w-3xl rounded-2xl shadow-sm object-contain border border-border"
                style={{ maxHeight: '500px' }}
                onError={(e) => {
                  console.error('Error loading visual');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </motion.div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-2 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Forces</h3>
              </div>
              <ul className="space-y-3">
                {forces.map((force: string, index: number) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{force}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-2 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Freins à lever</h3>
              </div>
              <ul className="space-y-3">
                {verrous.map((verrou: string, index: number) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{verrou}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Card className="p-10 bg-secondary border">
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              Et vous, quel est votre profil ?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez vos forces, identifiez vos freins et recevez un coaching personnalisé pour aligner votre projet avec qui vous êtes vraiment.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/onboarding')}
              className="px-8 py-6 text-lg"
            >
              Créer mon profil gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              ✨ Analyse en 3 minutes • 100% personnalisé • Gratuit
            </p>
          </Card>
        </motion.div>
      </main>

      <CommonFooter pageTitle="Profil partagé" />
    </div>
  );
};

export default ShareProfile;