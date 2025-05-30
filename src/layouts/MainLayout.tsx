
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        // Check if user has any target criteria (indicates they've completed onboarding)
        const { data: criteria } = await supabase
          .from('target_criteria')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Show onboarding if they don't have criteria (simplified logic)
        if (!criteria || criteria.length === 0) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Optional: redirect to dashboard
    window.location.href = '/dashboard';
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  // Expose function to trigger onboarding from child components
  const triggerOnboarding = () => {
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      <OnboardingFlow 
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default MainLayout;
