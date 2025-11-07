import { TooltipProvider } from "@/components/ui/airtable-ds/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GuestSessionProvider } from "@/contexts/GuestSessionContext";
import { Toaster } from "@/components/ui/airtable-ds/toaster";

// Layouts
import MainLayout from "@/layouts/MainLayout";

// Pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import VerificationPending from "@/pages/auth/VerificationPending";
import AuthCallback from "@/pages/auth/AuthCallback";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import UpdatePassword from "@/pages/auth/UpdatePassword";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import PipelineDashboard from "@/pages/Pipeline";
import Studio from "@/pages/Studio";
import MessageHistory from "@/pages/MessageHistory";
import FeedbackReview from "@/pages/admin/FeedbackReview";
import { ComingSoon } from "@/pages/ComingSoon";

// Components
import LandingPage from "@/components/LandingPage";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const showComingSoon = import.meta.env.VITE_SHOW_COMING_SOON_PAGE === "true";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <GuestSessionProvider>
            <BrowserRouter>
              {showComingSoon ? (
                <Routes>
                  <Route path="/*" element={<ComingSoon />} />
                </Routes>
              ) : (
                <MainLayout>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Auth Routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />
                    <Route
                      path="/auth/verification-pending"
                      element={<VerificationPending />}
                    />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                      path="/auth/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/auth/update-password"
                      element={<UpdatePassword />}
                    />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/pipeline" element={<PipelineDashboard />} />
                      <Route path="/studio" element={<Studio />} />
                      <Route
                        path="/message-history"
                        element={<MessageHistory />}
                      />
                      <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                      path="/admin/feedback-review"
                      element={<FeedbackReview />}
                    />

                    {/* Redirect old routes */}
                    <Route
                      path="/profile/edit"
                      element={<Navigate to="/profile" replace />}
                    />
                    <Route
                      path="/companies"
                      element={<Navigate to="/pipeline" replace />}
                    />
                    <Route
                      path="/profile/enrichment"
                      element={<Navigate to="/profile" replace />}
                    />
                    <Route
                      path="/navigate-to-profile"
                      element={<Navigate to="/profile" replace />}
                    />

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MainLayout>
              )}
            </BrowserRouter>
          </GuestSessionProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
