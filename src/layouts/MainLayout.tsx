
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
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || hasCheckedOnboarding) return;

      try {
        // Check if user has any target criteria (indicates they've completed onboarding)
        const { data: criteria } = await supabase
          .from('target_criteria')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Check if user has a profile summary
        const { data: profile } = await supabase
          .from('user_summaries')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Show onboarding if they have a profile but no criteria (new users who signed up)
        if (profile && profile.length > 0 && (!criteria || criteria.length === 0)) {
          setShowOnboarding(true);
        }

        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCheckedOnboarding(true);
      }
    };

    checkOnboardingStatus();
  }, [user, hasCheckedOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Optional: redirect to dashboard
    window.location.href = '/dashboard';
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
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default MainLayout;
