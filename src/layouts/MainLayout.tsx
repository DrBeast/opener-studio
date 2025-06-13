
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
  const [isFirstLogin, setIsFirstLogin] = useState(false);

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

        // Check if onboarding_completed flag exists and is true
        const onboardingCompleted = profile && (profile as any).onboarding_completed;
        
        if (onboardingCompleted) {
          // User has completed onboarding, don't show it
          setIsCheckingOnboarding(false);
          return;
        }

        // Check if this is the user's first time logging in
        // We can check if they have any companies or if their profile was just created
        const { data: companies } = await supabase
          .from('companies')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1);

        const { data: summaryData } = await supabase
          .from('user_summaries')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        // If they don't have companies or summaries, this is likely their first login
        const isFirstTime = (!companies || companies.length === 0) && (!summaryData || summaryData.length === 0);
        
        if (isFirstTime) {
          setIsFirstLogin(true);
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
        } else {
          // Create new profile with onboarding completed
          await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              onboarding_completed: true
            } as any);
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
        } else {
          // Create new profile with onboarding completed
          await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              onboarding_completed: true
            } as any);
        }
      } catch (error) {
        console.error('Error marking onboarding as skipped:', error);
      }
    }
    setShowOnboarding(false);
  };

  // Function to manually open onboarding (for the header button)
  const openOnboarding = () => {
    setShowOnboarding(true);
  };

  // If we're still checking onboarding status, show a loading state
  if (isCheckingOnboarding && user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-ping mx-auto"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Setting up your workspace</h3>
              <p className="text-sm text-gray-600">This will just take a moment...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenOnboarding={openOnboarding} />
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
