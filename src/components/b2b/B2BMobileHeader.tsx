import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Users, User, Mail, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import astrydLogo from "@/assets/astryd-logo-transparent.png";

interface B2BMobileHeaderProps {
  isMentor: boolean;
  isManager: boolean;
  pageTitle: string;
}

const B2BMobileHeader = ({ isMentor, isManager, pageTitle }: B2BMobileHeaderProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navButton = (label: string, icon: React.ElementType, path: string) => {
    const Icon = icon;
    return (
      <button
        key={path + label}
        onClick={() => handleNav(path)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
          isActive(path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </button>
    );
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={astrydLogo} alt="Astryd" className="h-7 w-7" />
            <span className="font-semibold text-foreground text-sm">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleNav("/account/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-card border-b border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {isManager && (
              <>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Analytics
                </p>
                {navButton("Cohorte", Users, "/pro/dashboard")}
                {navButton("Objectifs", Target, "/pro/objectives")}
              </>
            )}

            {isMentor && isManager && <Separator />}

            {isMentor && (
              <>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mentorat
                </p>
                {navButton("Mes entrepreneurs", Users, "/pro/mentor/dashboard")}
                {navButton("Invitations", Mail, "/pro/mentor/invitations")}
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default B2BMobileHeader;
