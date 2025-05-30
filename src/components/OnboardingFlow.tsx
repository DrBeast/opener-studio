
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ArrowRight, Target, Users, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingFlow = ({ isOpen, onClose, onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [jobTarget, setJobTarget] = useState({
    title: "",
    level: "",
    industry: "",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    // Auto-populate job target based on user profile
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('user_summaries')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Extract likely job target from their current experience
          setJobTarget({
            title: profile.experience?.split(',')[0]?.trim() || "",
            level: "Senior", // Default assumption
            industry: profile.expertise?.split(',')[0]?.trim() || "",
            location: "Remote"
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save job target as criteria
      if (user && jobTarget.title) {
        const { error } = await supabase
          .from('target_criteria')
          .insert({
            user_id: user.id,
            desired_role: jobTarget.title,
            desired_level: jobTarget.level,
            desired_industry: jobTarget.industry,
            desired_location: jobTarget.location,
            company_size: "Any",
            employment_type: "Full-time"
          });

        if (error) {
          console.error('Error saving job target:', error);
        }
      }

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">What's your job target?</h3>
              <p className="text-muted-foreground">
                We'll use this to find the perfect contacts and companies for you.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={jobTarget.title}
                  onChange={(e) => setJobTarget({...jobTarget, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    placeholder="e.g., Senior, Mid-level"
                    value={jobTarget.level}
                    onChange={(e) => setJobTarget({...jobTarget, level: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, Remote"
                    value={jobTarget.location}
                    onChange={(e) => setJobTarget({...jobTarget, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={jobTarget.industry}
                  onChange={(e) => setJobTarget({...jobTarget, industry: e.target.value})}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Smart suggestion:</strong> We pre-filled this based on your profile. 
                Feel free to adjust for your next career move!
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Find the right people</h3>
              <p className="text-muted-foreground">
                Our AI will identify key contacts at your target companies.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Hiring managers and team leads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Recruiters and talent teams</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Current employees in your field</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Industry influencers and decision makers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                AI-powered contact discovery
              </Badge>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Craft perfect messages</h3>
              <p className="text-muted-foreground">
                Generate personalized outreach that gets responses.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Personalized to each contact</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Professional but authentic tone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Optimized for your goals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Multiple versions to choose from</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                High response rates
              </Badge>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to ConnectorAI!</DialogTitle>
          <DialogDescription>
            Let's get you set up to start building meaningful professional connections.
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
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Skip for now
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || (currentStep === 1 && !jobTarget.title)}
            >
              {isLoading ? (
                "Setting up..."
              ) : currentStep === totalSteps ? (
                "Get Started!"
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
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
