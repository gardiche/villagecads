import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Lightbulb, Target, AlertTriangle, User, BookOpen, Clock, Users, Trophy, Zap, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNewRecommendations } from "@/hooks/useNewRecommendations";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { supabase } from "@/integrations/supabase/client";
import { LoginGateModal } from "./LoginGateModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const VILLAGE_LOGO = "/village/LOGO-VBCASavoie_blanc.png";

// Section quotidienne (coeur d'usage pour inscrits)
const dailySections = [
  { id: "micro-actions", title: "Mes actions", icon: Zap, route: "/micro-actions" },
  { id: "attention", title: "Zones d'attention", icon: AlertTriangle, route: "/attention-zones" },
  { id: "journal", title: "Journal", icon: BookOpen, route: "/journal" },
];

// Section profil (analyse/personnalisation - entrée pour guests)
const profileSections = [
  { id: "profil", title: "Profil entrepreneurial", icon: User, route: "/profil-entrepreneurial" },
  { id: "idea", title: "Mon projet", icon: Lightbulb, route: "/idea" },
  { id: "cap", title: "Objectif et parcours", icon: Trophy, route: "/cap-parcours" },
];

interface AppSidebarProps {
  currentIdeaId?: string;
  onOpenCoaching?: () => void;
}

export function AppSidebar({ currentIdeaId, onOpenCoaching }: AppSidebarProps) {
  const { open, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [userPlan, setUserPlan] = useState<"declic" | "cap" | "elan">("declic");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [loginGateAction, setLoginGateAction] = useState<"historique" | "coaching">("historique");
  const [profileSectionOpen, setProfileSectionOpen] = useState(true);
  const { hasNewActions, hasNewZones, markAsSeenActions, markAsSeenZones } = useNewRecommendations();
  const { plan: dbPlan } = useUserSubscription();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isOnProfileSection = profileSections.some(s => location.pathname === s.route);
    if (isOnProfileSection) {
      setProfileSectionOpen(true);
    }
  }, [location.pathname]);

  const handleNavigation = (route: string, sectionId: string) => {
    if (sectionId === 'attention' && hasNewZones) {
      markAsSeenZones();
    } else if (sectionId === 'micro-actions' && hasNewActions) {
      markAsSeenActions();
    }
    
    const fullRoute = currentIdeaId ? `${route}?ideaId=${currentIdeaId}` : route;
    navigate(fullRoute);
    
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handlePremiumClick = (type: "historique" | "coaching") => {
    if (!isAuthenticated) {
      setLoginGateAction(type);
      setShowLoginGate(true);
    } else {
      if (type === "historique") {
        handleNavigation("/history", "history");
      } else if (type === "coaching" && onOpenCoaching) {
        const event = {
          type: "mentorat_sidebar_clicked",
          timestamp: new Date().toISOString(),
        };
        const analytics = JSON.parse(localStorage.getItem("astryd_mentorat_analytics") || "[]");
        analytics.push(event);
        localStorage.setItem("astryd_mentorat_analytics", JSON.stringify(analytics));
        
        onOpenCoaching();
      }
    }
  };

  const isActive = (route: string) => {
    return location.pathname === route;
  };

  useEffect(() => {
    setUserPlan(dbPlan);
  }, [dbPlan]);

  const renderMenuItem = (section: typeof dailySections[0], showBadge?: boolean, badgeType?: 'actions' | 'zones') => (
    <SidebarMenuItem key={section.id}>
      <SidebarMenuButton
        onClick={() => handleNavigation(section.route, section.id)}
        className={`cursor-pointer transition-colors pointer-events-auto ${
          isActive(section.route)
            ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
      >
        <section.icon className="h-5 w-5" />
        {open && (
          <span className="flex items-center gap-2">
            {section.title}
            {showBadge && badgeType === 'actions' && hasNewActions && (
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-semibold">
                Nouveau
              </Badge>
            )}
            {showBadge && badgeType === 'zones' && hasNewZones && (
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-semibold">
                Nouveau
              </Badge>
            )}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar 
        className={open ? "w-64" : "w-16"} 
        collapsible="icon"
      >
        {/* Logo header with collapse toggle */}
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 w-full min-w-0 px-1">
              {open ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135.3 262.8" className="h-8 w-auto shrink-0" fill="#f9b104">
                    <path d="M46.76,262.49c4.76-36.53,9.52-73.06,14.34-110.09H0C6.19,101.35,12.31,50.85,18.48,0h78.79c-8.86,33.09-17.68,66.04-26.65,99.55h64.68c-29.45,54.94-58.47,109.09-87.5,163.25-.35-.1-.69-.2-1.04-.3Z"/>
                  </svg>
                  <img src={VILLAGE_LOGO} alt="Le Village by CA" className="h-14 shrink-0 object-contain" />
                </>
              ) : (
                <div className="h-8 w-8 shrink-0 bg-primary rounded-md flex items-center justify-center">
                  <span className="font-display font-black text-sm text-primary-foreground leading-none">V</span>
                </div>
              )}
            </div>
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
                aria-label={open ? "Réduire la sidebar" : "Ouvrir la sidebar"}
              >
                {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* SECTION 1 : USAGE QUOTIDIEN */}
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 py-1">
                Quotidien
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {dailySections.map((section) => 
                  renderMenuItem(section, section.id === 'micro-actions' ? true : section.id === 'attention' ? true : false, section.id === 'attention' ? 'zones' : 'actions')
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* SECTION 2 : MON PROFIL */}
          <SidebarGroup>
            <Collapsible open={profileSectionOpen} onOpenChange={setProfileSectionOpen}>
              {open && (
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest hover:text-sidebar-foreground transition-colors">
                  <span>Mon profil</span>
                  {profileSectionOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </CollapsibleTrigger>
              )}
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {profileSections.map((section) => 
                      renderMenuItem(section, section.id === 'attention', 'zones')
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>

          {/* SECTION 3 : PREMIUM */}
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 py-1">
                Premium
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handlePremiumClick("historique")}
                    className={`cursor-pointer transition-colors pointer-events-auto ${
                      !isAuthenticated
                        ? "opacity-50 hover:bg-sidebar-accent/30"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                  >
                    <Clock className={`h-5 w-5 ${!isAuthenticated ? "text-sidebar-foreground/30" : "text-sidebar-foreground/80"}`} />
                    {open && (
                      <span className="flex items-center gap-2">
                        <span className={!isAuthenticated ? "text-muted-foreground" : ""}>
                          Historique de mes actions
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Cap
                        </Badge>
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {onOpenCoaching && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handlePremiumClick("coaching")}
                      className={`cursor-pointer transition-colors pointer-events-auto ${
                        !isAuthenticated 
                          ? "opacity-60 hover:bg-muted/30" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                    <Users className={`h-5 w-5 ${!isAuthenticated ? "text-sidebar-foreground/30" : "text-sidebar-foreground/80"}`} />
                      {open && (
                        <span className="flex items-center gap-2">
                          <span className={!isAuthenticated ? "text-sidebar-foreground/30" : ""}>
                            Mentorat
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Pro+
                          </Badge>
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
          {open && (
            <div className="relative flex items-center rounded-lg bg-sidebar-foreground/10 px-3 py-5 overflow-hidden">
              {/* Étoile Village jaune en décoration droite */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" className="absolute right-3 top-1/2 -translate-y-1/2 h-16 w-16 opacity-80" fill="#f9b104">
                <path d="m91.03,89.41c3.97-3.37,7.41-6.3,11.09-9.42-3.66-3.15-7.18-6.19-11.12-9.58,5.2-.36,9.85-.69,14.74-1.03-1.3-4.73-2.52-9.16-3.9-14.2,4.41,2.73,8.35,5.16,12.5,7.73,1.88-4.46,3.66-8.69,5.73-13.59,1.82,4.79,3.4,8.97,5.14,13.55,4.13-2.56,8.09-5.01,12.56-7.78-1.2,4.92-2.29,9.34-3.47,14.19,4.9.32,9.54.62,14.7.95-3.87,3.35-7.36,6.36-11.16,9.64,3.74,2.98,7.37,5.87,10.99,8.76-.06.2-.12.39-.18.59-4.66.22-9.32.44-14.31.68,1.17,4.74,2.3,9.34,3.56,14.47-4.4-2.79-8.36-5.3-12.57-7.96-1.74,4.6-3.42,9.04-5.38,14.24-1.94-5.12-3.62-9.53-5.4-14.21-4.12,2.65-8.07,5.18-12.52,8.05,1.22-5.1,2.33-9.7,3.48-14.5-4.73-.19-9.25-.38-14.5-.59Z"/>
              </svg>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <LoginGateModal
        open={showLoginGate}
        onOpenChange={setShowLoginGate}
        action={loginGateAction}
      />
    </>
  );
}
