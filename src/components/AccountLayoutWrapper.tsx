import { useB2BRoles } from "@/hooks/useB2BRoles";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import B2BLayout from "@/components/b2b/B2BLayout";

interface AccountLayoutWrapperProps {
  children: React.ReactNode;
  pageTitle: string;
  onOpenCoaching?: () => void;
}

/**
 * Wrapper for account pages that selects the correct layout based on user role:
 * - Pro users (mentor/manager) → B2BLayout with B2BSidebar
 * - Entrepreneurs → SidebarProvider + AppSidebar
 */
const AccountLayoutWrapper = ({ children, pageTitle, onOpenCoaching }: AccountLayoutWrapperProps) => {
  const { isMentor, isManager, loading } = useB2BRoles();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Pro users (mentor/manager) get B2BLayout. 
  // Super-admin (admin role) without pro role uses standard entrepreneur sidebar.
  const isPro = isMentor || isManager;

  if (isPro) {
    return (
      <B2BLayout pageTitle={pageTitle}>
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </B2BLayout>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onOpenCoaching={onOpenCoaching} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader currentPage={pageTitle} />
          <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AccountLayoutWrapper;
