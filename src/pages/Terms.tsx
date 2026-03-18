import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20 md:py-24 max-w-4xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-8 text-foreground">Conditions Générales d'Utilisation</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Éditeur</h2>
            <p>
              <strong>Alpact SAS</strong>, société par actions simplifiée, 
              SIREN 993 821 370, immatriculée au RCS d'Annecy, 
              6 avenue de Thônes, 74000 Annecy.
            </p>
            <p>
              <strong>Directeur de la publication :</strong> Thomas Bonnefoy
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Objet</h2>
            <p>
              Astryd est un coach IA qui accompagne les entrepreneurs dans l'analyse de leur alignement personnel avec leur idée entrepreneuriale : 
              profil entrepreneurial, recommandations personnalisées, journal de progression, suivi longitudinal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Acceptation</h2>
            <p>
              L'utilisation de la plateforme implique l'acceptation des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Formules</h2>
            <p>
              <strong>Déclic (gratuit) :</strong> profil entrepreneurial de base et fonctionnalités essentielles.
            </p>
            <p>
              <strong>Cap et Élan (premium) :</strong> historique complet, coaching IA approfondi, export PDF, insights avancés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Propriété intellectuelle</h2>
            <p>
              Tous les éléments de la plateforme sont la propriété exclusive d'Alpact SAS et protégés par les droits d'auteur. 
              Toute reproduction sans autorisation est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intelligence Artificielle</h2>
            <p>
              Astryd utilise des modèles d'IA pour générer des analyses personnalisées. 
              Ces analyses constituent des recommandations et non des conseils professionnels.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Responsabilité</h2>
            <p>
              Astryd est fourni "en l'état". Alpact SAS ne garantit pas son fonctionnement ininterrompu ou exempt d'erreurs. 
              Alpact SAS ne saurait être tenue responsable des dommages résultant de l'utilisation de la plateforme, 
              sauf en cas de faute lourde.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p>
              Pour toute question : <strong>tbo@alpact.vc</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link 
            to="/" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
