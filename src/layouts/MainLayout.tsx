
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FeedbackBox } from "@/components/FeedbackBox";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Don't show feedback on auth pages or landing page
  const isAuthPage = location.pathname.startsWith('/auth');
  const isLandingPage = location.pathname === '/';
  const showFeedback = user && !isAuthPage && !isLandingPage;
  
  // Get view name for feedback
  const getViewName = () => {
    const path = location.pathname;
    switch (path) {
      case '/pipeline':
        return 'Pipeline Dashboard';
      case '/profile':
        return 'Profile Page';
      case '/job-targets':
        return 'Job Targets Page';
      case '/feedback-review':
        return 'Feedback Review Page';
      default:
        return path.replace('/', '') || 'Main';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="relative">
        <Header />
        {showFeedback && (
          <div className="absolute top-4 right-20 z-50">
            <FeedbackBox viewName={getViewName()} variant="header" />
          </div>
        )}
      </div>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
