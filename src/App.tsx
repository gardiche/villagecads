import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthGate from "./pages/AuthGate";
import OnboardingNew from "./pages/OnboardingNew";
import OnboardingNewIdea from "./pages/OnboardingNewIdea";
import OnboardingIdea from "./pages/OnboardingIdea";
import ProfilEntrepreneurial from "./pages/ProfilEntrepreneurial";
import CapEtParcours from "./pages/CapEtParcours";
import AttentionZones from "./pages/AttentionZones";
import MicroActions from "./pages/MicroActions";
import Journal from "./pages/Journal";
import IdeaProject from "./pages/IdeaProject";
import HandoffMonaLysa from "./pages/HandoffMonaLysa";
import History from "./pages/History";
import EditIdea from "./pages/EditIdea";
import Profile from "./pages/Profile";
import AccountProfile from "./pages/AccountProfile";
import AccountSettings from "./pages/AccountSettings";
import AccountSubscription from "./pages/AccountSubscription";
import Hub from "./pages/Hub";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDebugLogs from "./pages/AdminDebugLogs";
import AdminNavigationDebugger from "./pages/AdminNavigationDebugger";
import TestMicroActions from "./pages/TestMicroActions";
import TestPersonaDetection from "./pages/TestPersonaDetection";
import TestPersonalization from "./pages/TestPersonalization";
import AdminTestDashboard from "./pages/AdminTestDashboard";
import ShareProfile from "./pages/ShareProfile";
import RetrieveResults from "./pages/RetrieveResults";
import FAQPage from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Pro from "./pages/Pro";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import MentorRoute from "./components/MentorRoute";
import ManagerRoute from "./components/ManagerRoute";
import MentorDashboard from "./pages/MentorDashboard";
import MentorEntrepreneurDetail from "./pages/MentorEntrepreneurDetail";
import MentorBrief from "./pages/MentorBrief";
import CohortAdminDashboard from "./pages/CohortAdminDashboard";
import AdminObjectives from "./pages/AdminObjectives";
import MentorInvitations from "./pages/MentorInvitations";
import InviteAccept from "./pages/InviteAccept";
import { ScrollToTop } from "./components/ScrollToTop";
import NavigationDebugger from "./components/NavigationDebugger";
import { SupportChatWidget } from "./components/SupportChatWidget";
import AdminSupport from "./pages/AdminSupport";
import AdminDebugPersonaAudit from "./pages/AdminDebugPersonaAudit";
import AdminAnalytics from "./pages/AdminAnalytics";
import { usePageTracking } from "./hooks/usePageTracking";


const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  usePageTracking(); // Track page views automatically
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Hub />} />
        <Route path="/landing" element={<Index />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/auth" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Auth />
          </motion.div>
        } />
        <Route path="/auth-gate" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AuthGate />
          </motion.div>
        } />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/pro" element={<Pro />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/conditions" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/onboarding" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingNew />
          </motion.div>
        } />
        <Route path="/onboarding/new-idea" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><OnboardingNewIdea /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/onboarding/idea" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><OnboardingIdea /></ProtectedRoute>
          </motion.div>
        } />
        {/* Redirection pour compatibilité */}
        <Route path="/onboarding-idea" element={<Navigate to="/onboarding/idea" replace />} />
        <Route path="/profil-entrepreneurial" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfilEntrepreneurial />
          </motion.div>
        } />
        <Route path="/cap-parcours" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CapEtParcours />
          </motion.div>
        } />
        <Route path="/attention-zones" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AttentionZones />
          </motion.div>
        } />
        <Route path="/micro-actions" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MicroActions />
          </motion.div>
        } />
        <Route path="/journal" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Journal />
          </motion.div>
        } />
        <Route path="/pricing" element={<Navigate to="/account/subscription" replace />} />
        <Route path="/idea" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <IdeaProject />
          </motion.div>
        } />
        <Route path="/history" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <History />
          </motion.div>
        } />
        <Route path="/edit-idea" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><EditIdea /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><Profile /></ProtectedRoute>
          </motion.div>
        } />
        {/* Mentor routes (B2B Pro) */}
        <Route path="/pro/mentor/dashboard" element={
          <MentorRoute><MentorDashboard /></MentorRoute>
        } />
        <Route path="/pro/mentor/entrepreneur/:id" element={
          <MentorRoute><MentorEntrepreneurDetail /></MentorRoute>
        } />
        <Route path="/pro/mentor/entrepreneur/:id/brief" element={
          <MentorRoute><MentorBrief /></MentorRoute>
        } />
        <Route path="/pro/mentor/invitations" element={
          <MentorRoute><MentorInvitations /></MentorRoute>
        } />
        {/* Legacy redirects */}
        <Route path="/mentor/dashboard" element={<Navigate to="/pro/mentor/dashboard" replace />} />
        <Route path="/mentor/invitations" element={<Navigate to="/pro/mentor/invitations" replace />} />
        <Route path="/mentor/entrepreneur/:id" element={<Navigate to="/pro/mentor/entrepreneur/:id" replace />} />
        
        {/* Cohort Admin routes (B2B Pro) */}
        <Route path="/pro/dashboard" element={
          <ManagerRoute><CohortAdminDashboard /></ManagerRoute>
        } />
        <Route path="/pro/objectives" element={
          <ManagerRoute><AdminObjectives /></ManagerRoute>
        } />
        {/* Legacy redirects */}
        <Route path="/admin/dashboard" element={<Navigate to="/pro/dashboard" replace />} />
        <Route path="/admin/objectives" element={<Navigate to="/pro/objectives" replace />} />

        {/* Public invite route */}
        <Route path="/invite/:code" element={<InviteAccept />} />
        
        <Route path="/account/admin" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminRoute><AdminDashboard /></AdminRoute>
          </motion.div>
        } />
        <Route path="/account/admin/debug-logs" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminRoute><AdminDebugLogs /></AdminRoute>
          </motion.div>
        } />
        <Route path="/account/admin/navigation-debugger" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminRoute><AdminNavigationDebugger /></AdminRoute>
          </motion.div>
        } />
        <Route path="/account/admin/debug-persona-audit" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminRoute><AdminDebugPersonaAudit /></AdminRoute>
          </motion.div>
        } />
        <Route path="/handoff/monalysa" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><HandoffMonaLysa /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/test-micro-actions" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TestMicroActions />
          </motion.div>
        } />
        <Route path="/test-persona-detection" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><TestPersonaDetection /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/test-personalization" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><TestPersonalization /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/account/admin/test-dashboard" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><AdminTestDashboard /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/account/admin/analytics" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminRoute><AdminAnalytics /></AdminRoute>
          </motion.div>
        } />
        <Route path="/share/:shareCode" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ShareProfile />
          </motion.div>
        } />
        <Route path="/retrieve-results" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RetrieveResults />
          </motion.div>
        } />
        {/* Account pages */}
        <Route path="/account/profile" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><AccountProfile /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/account/settings" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><AccountSettings /></ProtectedRoute>
          </motion.div>
        } />
        <Route path="/account/subscription" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProtectedRoute><AccountSubscription /></ProtectedRoute>
          </motion.div>
        } />
        {/* Redirect old /app route to new /profil-entrepreneurial */}
        <Route path="/app" element={<Navigate to="/profil-entrepreneurial" replace />} />
        {/* Legacy route redirects */}
        <Route path="/historique" element={<Navigate to="/history" replace />} />
        <Route path="/dashboard" element={<Navigate to="/profil-entrepreneurial" replace />} />
        <Route path="/mon-projet" element={<Navigate to="/idea" replace />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AnimatedRoutes />
        <SupportChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
