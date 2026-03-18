import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20 md:py-24 max-w-4xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-8 text-foreground">Politique de Confidentialité</h1>
        
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
            <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
            <p>
              Nous collectons : adresse email, réponses aux questionnaires (profil entrepreneurial), données de projet (titre, description), 
              journal de progression, micro-actions, interactions plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Utilisation</h2>
            <p>
              Vos données servent à créer votre compte, générer votre profil entrepreneurial, calculer votre alignement, 
              personnaliser vos recommandations et améliorer nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Destinataires</h2>
            <p>
              Vos données sont accessibles par les équipes d'Alpact SAS et nos sous-traitants techniques (hébergement, services IA) 
              soumis à des obligations de confidentialité strictes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Vos droits</h2>
            <p>
              Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition 
              sur vos données personnelles (RGPD).
            </p>
            <p>
              Pour exercer vos droits : <strong>tbo@alpact.vc</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Sécurité et cookies</h2>
            <p>
              Nous mettons en œuvre toutes les mesures nécessaires pour protéger vos données. 
              Astryd utilise uniquement des cookies essentiels (authentification, session).
            </p>
          </section>

          <section>
            <p className="text-sm text-muted-foreground">
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

export default Privacy;
