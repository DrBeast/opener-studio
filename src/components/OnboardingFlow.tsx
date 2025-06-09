import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
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
    return value.map((item) => String(item));
  }
  return [];
};

const OnboardingFlow = ({
  isOpen,
  onClose,
  onComplete,
}: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(
    null
  );
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
            combined_experience_highlights: ensureStringArray(
              summaryData.combined_experience_highlights
            ),
            combined_education_highlights: ensureStringArray(
              summaryData.combined_education_highlights
            ),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(
              summaryData.technical_expertise
            ),
            value_proposition_summary: summaryData.value_proposition_summary,
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
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
      toast.success(
        "Welcome to ConnectorAI! You're all set to start networking."
      );
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error(
        "There was an error completing setup. You can still use the app!"
      );
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
        return (
          <CompanyGenerationStep onMessageGenerated={handleMessageGenerated} />
        );
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

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Review your professional story";
      case 2:
        return "Discover target companies and key contacts in your industry";
      case 3:
        return "Your workspace is ready. Next, refine targets, add contacts, and craft messages!";
      default:
        return "";
    }
  };

  const getNextButtonText = () => {
    if (currentStep === 1) return "Discover Companies & Contacts";
    if (currentStep === 2)
      return messageGenerated ? "Complete Setup" : "Complete Setup";
    if (currentStep === 3) return "Get Started!";
    return "Next";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Welcome to ConnectorAI!
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 mt-2">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Progress Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {currentStep === 3 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {currentStep}
                      </span>
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">
                    {getStepTitle()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">
                  Step {currentStep} of {totalSteps}
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-white/50" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">{renderStep()}</div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800"
              >
                Skip for now
              </Button>
            </div>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getNextButtonText()}
                  {currentStep < totalSteps && (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {currentStep === 3 && <Sparkles className="h-4 w-4" />}
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
