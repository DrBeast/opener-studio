
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";

// Layouts
import MainLayout from "@/layouts/MainLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import VerificationPending from "@/pages/auth/VerificationPending";
import AuthCallback from "@/pages/auth/AuthCallback";
import Profile from "@/pages/Profile";
import ProfileEdit from "@/pages/ProfileEdit";
import ProfileEnrichment from "@/pages/ProfileEnrichment";
import JobTargets from "@/pages/JobTargets";
import NotFound from "@/pages/NotFound";
import CompaniesDashboard from "@/pages/CompaniesDashboard";
import PipelineDashboard from "@/pages/PipelineDashboard";
import ConsolidatedJobSearch from "@/pages/ConsolidatedJobSearch";

// Components
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/verification-pending" element={<VerificationPending />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/profile/enrichment" element={<ProfileEnrichment />} />
                <Route path="/job-targets" element={<JobTargets />} />
                <Route path="/companies" element={<CompaniesDashboard />} />
                <Route path="/pipeline" element={<PipelineDashboard />} />
                <Route path="/job-search" element={<ConsolidatedJobSearch />} />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
