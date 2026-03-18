import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-woman-vision.jpg";

const Hero = () => {

  return (
    <section 
      className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 md:py-24 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${heroImage})`
      }}
    >
      {/* Subtle overlays */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 sm:space-y-7 md:space-y-8 px-4">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-sm border border-white/40 text-foreground text-xs sm:text-sm font-semibold shadow-sm">
            <span>IA + Coaching humain</span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-5 sm:space-y-6 md:space-y-7"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white leading-[1.15] tracking-tight px-2 sm:px-4">
            Révélez votre profil entrepreneurial et avancez avec clarté.
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed px-4 sm:px-6">
            Un coach IA qui analyse votre posture, détecte vos freins et vous propose des actions concrètes pour avancer.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-6"
        >
          <Link to="/onboarding" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 sm:h-13 md:h-14 px-6 sm:px-7 md:px-8 text-base sm:text-lg md:text-xl font-bold rounded-full bg-white text-primary hover:bg-white/95 shadow-sm hover:shadow-md transition-all group"
            >
              Commencer mon diagnostic
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <a 
            href="#how-it-works"
            className="w-full sm:w-auto group"
          >
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 sm:h-13 md:h-14 px-5 sm:px-6 md:px-7 text-sm sm:text-base md:text-lg font-semibold rounded-full bg-white/95 backdrop-blur-sm text-foreground border-2 border-white/60 hover:bg-white hover:border-white/80 shadow-sm transition-all"
            >
              Découvrir comment ça marche
            </Button>
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-white/95 text-sm sm:text-base md:text-lg px-4 sm:px-6"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="font-medium">10 min</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="font-medium">100 % personnalisé</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="font-medium">Gratuit pour commencer</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
