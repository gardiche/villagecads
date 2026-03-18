import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import LeVraiFrein from "@/components/LeVraiFrein";
import LaBoucleAstryd from "@/components/LaBoucleAstryd";
import PlanElanTeaser from "@/components/PlanElanTeaser";
import ADNAstryd from "@/components/ADNAstryd";
import CTA from "@/components/CTA";
import PricingNew from "@/components/PricingNew";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-woman-vision.jpg";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const scrollPosition = useScrollPosition();
  
  // Effet de parallaxe sur le visuel du hero
  const parallaxOffset = scrollPosition * 0.5;
  
  // Rediriger vers le dashboard si déjà connecté et session encore valide
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Vérifier que l'utilisateur existe encore côté backend
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await supabase.auth.signOut();
        return;
      }

      // Récupérer la première idée de l'utilisateur
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const ideaId = ideas && ideas.length > 0 ? ideas[0].id : null;
      
      if (ideaId) {
        navigate(`/profil-entrepreneurial?ideaId=${ideaId}`);
      } else {
        // Utilisateur connecté sans idée → onboarding idée
        navigate('/onboarding/idea');
      }
    };
    checkAuth();
  }, [navigate]);

  const scrollToMethode = () => {
    const element = document.getElementById('la-boucle-astryd');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-100 ease-out"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            transform: `translateY(${parallaxOffset}px)`
          }}
        />
        
        {/* Overlay - plus sombre pour meilleure lisibilité */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 container px-4 mx-auto text-center space-y-6 sm:space-y-8"
        >
          {/* Badge discret */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-widest text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 uppercase">
              Outil d'accompagnement entrepreneurial
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-white leading-tight drop-shadow-lg max-w-4xl mx-auto">
            Entreprendre avec clarté.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md leading-relaxed px-4">
            Votre outil de coaching personnel pour aligner votre projet entrepreneurial avec qui vous êtes vraiment.
          </p>
          
          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4 sm:pt-6"
          >
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6" 
              onClick={() => navigate('/onboarding')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Démarrer mon parcours
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={scrollToMethode}
            >
              La méthode
            </Button>
          </motion.div>
          <p className="text-sm text-center mt-3" style={{ color: '#6B7280' }}>
            2 minutes pour personnaliser ton accompagnement
          </p>
        </motion.div>
      </section>

      {/* Section Le Vrai Frein */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <LeVraiFrein />
      </motion.div>

      {/* Section La Boucle Astryd — fusionnée avec ValueProp + ADN */}
      <motion.div
        id="la-boucle-astryd"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <LaBoucleAstryd />
      </motion.div>
      
      {/* Pricing */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <PricingNew />
      </motion.div>

      {/* Section Plan Élan Teaser */}
      <motion.div
        id="elan-teaser"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <PlanElanTeaser />
      </motion.div>

      {/* Section ADN Astryd - Calibrée par le terrain */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <ADNAstryd />
      </motion.div>

      {/* CTA final */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <CTA />
      </motion.div>

      <Footer />
    </div>
  );
};

export default Index;
