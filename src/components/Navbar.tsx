import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const scrollPosition = useScrollPosition();
  const isScrolled = scrollPosition > 50;

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled
        ? "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
        : "bg-transparent border-b border-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo Village */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={isScrolled ? "/village/LOGO-VBCASavoie_coul.png" : "/village/LOGO-VBCASavoie_blanc.png"}
              alt="Le Village by CA des Savoie"
              className="h-20 object-contain"
            />
          </Link>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className={cn(
                "rounded-full transition-colors duration-300 font-medium",
                !isScrolled && "text-white hover:bg-white/10"
              )}>
                Connexion
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button className={cn(
                "rounded-full font-semibold transition-colors duration-300",
                !isScrolled && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}>
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
