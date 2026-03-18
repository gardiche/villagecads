import { useB2BRoles } from "@/hooks/useB2BRoles";
import { SidebarProvider } from "@/components/ui/sidebar";
import B2BSidebar from "./B2BSidebar";
import B2BMobileHeader from "./B2BMobileHeader";
import B2BBreadcrumb from "./B2BBreadcrumb";
import AccountDropdown from "@/components/dashboard/AccountDropdown";

interface B2BLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const B2BLayout = ({ children, pageTitle }: B2BLayoutProps) => {
  const { isMentor, isManager, loading } = useB2BRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <B2BSidebar isMentor={isMentor} isManager={isManager} />

        <div className="flex-1 flex flex-col min-h-screen">
          <B2BMobileHeader
            isMentor={isMentor}
            isManager={isManager}
            pageTitle={pageTitle}
          />

          <header className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border bg-card">
            <div className="flex items-center">
              <B2BBreadcrumb pageTitle={pageTitle} />
              <h1 className="ml-4 text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
            <AccountDropdown />
          </header>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default B2BLayout;
