
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import JobTargets from "@/pages/JobTargets";
import NotFound from "@/pages/NotFound";
import PipelineDashboard from "@/pages/PipelineDashboard";
import FeedbackReview from "@/pages/FeedbackReview";
import DesignSystemDemo from "@/pages/admin/DesignSystemDemo";
import AirtableDesignSystem from "@/pages/admin/AirtableDesignSystem";

// Components
import ProtectedRoute from "@/components/ProtectedRoute";
import FloatingActionButton from "@/components/FloatingActionButton";

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/job-targets" element={<JobTargets />} />
                <Route path="/pipeline" element={<PipelineDashboard />} />
              </Route>
              
              {/* Admin Routes (not linked anywhere) */}
              <Route path="/admin/feedback-review" element={<FeedbackReview />} />
              <Route path="/admin/design-system" element={<DesignSystemDemo />} />
              <Route path="/admin/airtable-design-system" element={<AirtableDesignSystem />} />
              
              {/* Redirect old routes */}
              <Route path="/profile/edit" element={<Navigate to="/profile" replace />} />
              <Route path="/companies" element={<Navigate to="/pipeline" replace />} />
              <Route path="/profile/enrichment" element={<Navigate to="/profile" replace />} />
              <Route path="/job-search" element={<Navigate to="/job-targets" replace />} />
              <Route path="/navigate-to-profile" element={<Navigate to="/profile" replace />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingActionButton />
          </MainLayout>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
