import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import Organizations from "@/pages/Organizations";
import CompanyDashboard from "@/pages/CompanyDashboard";
import ExplorerDashboard from "@/pages/ExplorerDashboard";
import Marketplace from "@/pages/Marketplace";
import ProjectCreate from "@/pages/ProjectCreate";
import AdminPanel from "@/pages/AdminPanel";
import AcademyDashboard from "@/pages/AcademyDashboard";
import AuthCallback from "@/pages/AuthCallback";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import NotFound from "./pages/NotFound";
import PublicPassport from "./pages/PublicPassport";
import PublicCertificate from "./pages/PublicCertificate";
import AuthConfirm from "./pages/AuthConfirm";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Header />
              <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/company" element={<CompanyDashboard />} />
                <Route path="/explorer" element={<ExplorerDashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/projects/create" element={<ProjectCreate />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/academy" element={<AcademyDashboard />} />
              </Route>

              <Route path="/passport/:explorerId" element={<PublicPassport />} />
              <Route path="/cert/:code" element={<PublicCertificate />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

