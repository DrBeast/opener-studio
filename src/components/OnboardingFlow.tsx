
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileReviewStep } from "@/components/onboarding/ProfileReviewStep";
import { CompanyGenerationStep } from "@/components/onboarding/CompanyGenerationStep";
import { CompletionStep } from "@/components/onboarding/CompletionStep";
import { Background } from "@/types/profile";

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Helper function to ensure we have a string array from Json type
const ensureStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
};

const OnboardingFlow = ({ isOpen, onClose, onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageGenerated, setMessageGenerated] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        // Fetch summary data from the user_summaries table
        const { data: summaryData } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (summaryData) {
          setBackgroundSummary({
            experience: summaryData.experience,
            education: summaryData.education,
            expertise: summaryData.expertise,
            achievements: summaryData.achievements,
            overall_blurb: summaryData.overall_blurb,
            combined_experience_highlights: ensureStringArray(summaryData.combined_experience_highlights),
            combined_education_highlights: ensureStringArray(summaryData.combined_education_highlights),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(summaryData.technical_expertise),
            value_proposition_summary: summaryData.value_proposition_summary
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    if (isOpen && currentStep === 1) {
      loadUserProfile();
    }
  }, [user, isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      toast.success("Welcome to ConnectorAI! You're all set to start networking.");
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("There was an error completing setup. You can still use the app!");
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Mark as completed and close
    onClose();
  };

  const handleMessageGenerated = () => {
    setMessageGenerated(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProfileReviewStep backgroundSummary={backgroundSummary} />;
      case 2:
        return <CompanyGenerationStep onMessageGenerated={handleMessageGenerated} />;
      case 3:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Profile Review";
      case 2:
        return "Generate Companies & Contacts";
      case 3:
        return "You're All Set!";
      default:
        return "";
    }
  };

  const getNextButtonText = () => {
    if (currentStep === 1) return "Discover Companies & Contacts";
    if (currentStep === 2) return messageGenerated ? "Complete Setup" : "Complete Setup";
    if (currentStep === 3) return "Get Started!";
    return "Next";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to ConnectorAI!</DialogTitle>
          <DialogDescription>
            {getStepTitle()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </div>
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                "Setting up..."
              ) : (
                <>
                  {getNextButtonText()}
                  {currentStep < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
