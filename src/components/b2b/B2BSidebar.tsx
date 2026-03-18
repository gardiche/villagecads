import { useLocation, useNavigate } from "react-router-dom";
import { Users, Mail, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo-gradient.svg";

interface B2BSidebarProps {
  isMentor: boolean;
  isManager: boolean;
}

const mentorNav = [
  { label: "Mes entrepreneurs", icon: Users, path: "/pro/mentor/dashboard" },
  { label: "Invitations", icon: Mail, path: "/pro/mentor/invitations" },
];

const managerNav = [
  { label: "Cohorte", icon: Users, path: "/pro/dashboard" },
  { label: "Objectifs", icon: Target, path: "/pro/objectives" },
];

const B2BSidebar = ({ isMentor, isManager }: B2BSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { open, toggleSidebar, isMobile } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarHeader className="border-b border-border px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logo} alt="Astryd" className="h-8 w-8 shrink-0" />
            {open && (
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-foreground">Astryd</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold tracking-wide">
                  PRO
                </Badge>
              </div>
            )}
          </div>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              aria-label={open ? "Réduire la sidebar" : "Ouvrir la sidebar"}
            >
              {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isManager && (
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Analytics
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {managerNav.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors pointer-events-auto ${
                        isActive(item.path) ? "bg-muted font-medium text-primary" : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isMentor && (
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Mentorat
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {mentorNav.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors pointer-events-auto ${
                        isActive(item.path) ? "bg-muted font-medium text-primary" : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default B2BSidebar;
