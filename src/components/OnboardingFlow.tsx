import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/airtable-ds/dialog";
import { Button } from "@/components/ui/airtable-ds/button";
import { Progress } from "@/components/ui/airtable-ds/progress";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ContactCreationStep from "@/components/onboarding/ContactCreationStep";
import MessageCreationStep from "@/components/onboarding/MessageCreationStep";
import { Background } from "@/types/profile";
import { useNavigate } from "react-router-dom";
import { OutlineAction } from "./ui/design-system";

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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [contactCreated, setContactCreated] = useState(false);
  const [messageCreated, setMessageCreated] = useState(false);

  const totalSteps = 2;
  const progress = (currentStep / totalSteps) * 100;

  // No need for profile loading in simplified onboarding

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

  const handleEditProfile = () => {
    onClose();
    navigate("/profile?edit=true");
  };

  const handleContactCreated = () => {
    setContactCreated(true);
  };

  const handleMessageCreated = () => {
    setMessageCreated(true);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ContactCreationStep onContactCreated={handleContactCreated} />;
      case 2:
        return <MessageCreationStep onMessageCreated={handleMessageCreated} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Create Your First Contact";
      case 2:
        return "Generate Your First Message";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Add someone from your network to start building connections";
      case 2:
        return "Create a personalized message to reach out to your contact";
      default:
        return "";
    }
  };

  const getNextButtonText = () => {
    if (currentStep === 1)
      return contactCreated ? "Create Message" : "Create Message";
    if (currentStep === 2)
      return messageCreated ? "Complete Setup!" : "Complete Setup!";
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
            <div className="flex gap-3">
              <Button
                onClick={handleNext}
                disabled={
                  isLoading ||
                  (currentStep === 1 && !contactCreated) ||
                  (currentStep === 2 && !messageCreated)
                }
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
                    {currentStep === totalSteps && (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
