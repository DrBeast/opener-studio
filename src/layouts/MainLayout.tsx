
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
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        // Check if user has completed onboarding by looking at their profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // If profile exists and has onboarding_completed flag set to true, don't show onboarding
        if (profile && (profile as any).onboarding_completed) {
          setIsCheckingOnboarding(false);
          return;
        }

        // Check if user has any companies (fallback check)
        const { data: companies } = await supabase
          .from('companies')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1);

        // Show onboarding if they don't have any companies and haven't completed onboarding
        if (!companies || companies.length === 0) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleOnboardingComplete = async () => {
    if (user) {
      try {
        // Mark onboarding as completed
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          await supabase
            .from('user_profiles')
            .update({ 
              ...(existingProfile as any),
              onboarding_completed: true 
            } as any)
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error marking onboarding as completed:', error);
      }
    }
    setShowOnboarding(false);
  };

  const handleOnboardingClose = async () => {
    if (user) {
      try {
        // Mark onboarding as completed even if skipped
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          await supabase
            .from('user_profiles')
            .update({ 
              ...(existingProfile as any),
              onboarding_completed: true 
            } as any)
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error marking onboarding as skipped:', error);
      }
    }
    setShowOnboarding(false);
  };

  // If we're still checking onboarding status, show a loading state
  if (isCheckingOnboarding && user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

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
