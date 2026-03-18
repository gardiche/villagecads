import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

interface CommonHeaderProps {
  pageTitle: string;
  children?: React.ReactNode;
  showSidebarTrigger?: boolean;
}

const CommonHeader = ({ pageTitle, children, showSidebarTrigger = false }: CommonHeaderProps) => {
  return (
    <header className="sticky top-0 z-[40] bg-background/95 backdrop-blur-md border-b border-border/60 shadow-[var(--shadow-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Sidebar trigger (mobile) + Page Title */}
          <div className="flex items-center gap-3">
            {showSidebarTrigger && (
              <SidebarTrigger className="md:hidden h-10 w-10 flex items-center justify-center -ml-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            )}
            <div className="flex items-center gap-2.5">
              {/* Accent jaune Village */}
              <span className="hidden sm:block w-1 h-5 rounded-full bg-primary shrink-0" />
              <span className="text-lg font-display font-bold text-foreground tracking-tight">
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Right side content */}
          {children && (
            <div className="flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CommonHeader;
