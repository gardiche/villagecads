import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isProPage = location.pathname === '/pro';

  const bgClass = isProPage
    ? "bg-[#1d1d1b] border-white/10"
    : "bg-[#1d1d1b] border-white/10";
  const textClass = "text-white";
  const mutedTextClass = "text-white/50";
  const borderClass = "border-white/10";

  return (
    <footer className={`py-8 md:py-12 border-t ${bgClass}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          {/* Logo Village */}
          <div className="flex items-center gap-3">
            <img
              src="/village/LOGO-VBCASavoie_blanc.png"
              alt="Le Village by CA des Savoie"
              className="h-16 object-contain"
            />
          </div>

          {/* Links */}
          <div className={`flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 text-xs md:text-sm ${mutedTextClass}`}>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-white transition-colors">Conditions</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            {isProPage ? (
              <Link to="/" className="text-primary font-medium hover:underline transition-colors">
                Espace Entrepreneur →
              </Link>
            ) : (
              <Link to="/pro" className="text-primary font-medium hover:underline transition-colors">
                Espace Mentors & Pro →
              </Link>
            )}
          </div>

          {/* Copyright */}
          <p className={`text-xs md:text-sm ${mutedTextClass}`}>
            © 2026 Le Village by CA des Savoie
          </p>
        </div>

        {/* Baseline */}
        <div className={`mt-6 md:mt-8 pt-4 md:pt-6 border-t ${borderClass} text-center`}>
          <p className={`text-xs md:text-sm ${mutedTextClass}`}>
            Outil d'accompagnement entrepreneurial — Village by CA des Savoie
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
