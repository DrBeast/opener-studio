
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound, Briefcase } from "lucide-react";

interface ProgressTrackerProps {
  className?: string;
}

const ProgressTracker = ({ className = "" }: ProgressTrackerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completionStatus, setCompletionStatus] = useState({
    hasBackground: false,
    hasJobTargets: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Check for background data in user_profiles
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("linkedin_content, additional_details, cv_content")
          .eq("user_id", user.id)
          .single();
          
        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error checking profile data:", profileError);
        }
        
        // Check for job targets data
        const { data: targetData, error: targetError } = await supabase
          .from("target_criteria")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);
          
        if (targetError) {
          console.error("Error checking target criteria:", targetError);
        }
        
        // Consider profile complete if user has at least one background data entry
        const hasBackgroundData = profileData && 
          (profileData.linkedin_content || profileData.additional_details || profileData.cv_content);
        
        setCompletionStatus({
          hasBackground: !!hasBackgroundData,
          hasJobTargets: targetData && targetData.length > 0,
        });
      } catch (error: any) {
        console.error("Error checking completion status:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user]);
  
  const stepsCompleted = [
    completionStatus.hasBackground,
    completionStatus.hasJobTargets,
  ].filter(Boolean).length;
  
  const totalSteps = 2;
  const progressPercentage = (stepsCompleted / totalSteps) * 100;
  
  const nextStep = !completionStatus.hasBackground 
    ? { path: "/profile", label: "Complete Profile" }
    : !completionStatus.hasJobTargets
    ? { path: "/job-targets", label: "Define Job Targets" }
    : { path: "/companies", label: "Find Companies" };

  if (isLoading) return null;

  return (
    <Card className={`bg-primary/5 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Progress</span>
          <span className="text-muted-foreground">{stepsCompleted}/{totalSteps}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${completionStatus.hasBackground ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
              <UserRound className="h-3 w-3" />
            </div>
            <span className={`${completionStatus.hasBackground ? "text-green-600" : "text-primary"}`}>
              Professional Profile
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${completionStatus.hasJobTargets ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
              <Briefcase className="h-3 w-3" />
            </div>
            <span className={`${completionStatus.hasJobTargets ? "text-green-600" : "text-primary"}`}>
              Job Targets
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          className="w-full mt-2" 
          onClick={() => navigate(nextStep.path)}
        >
          {nextStep.label}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
