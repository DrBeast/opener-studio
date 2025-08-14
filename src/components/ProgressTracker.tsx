import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/airtable-ds/progress";
import { Button } from "@/components/ui/airtable-ds/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/airtable-ds/card";
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
        const hasBackgroundData =
          profileData &&
          (profileData.linkedin_content ||
            profileData.additional_details ||
            profileData.cv_content);
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
    ? {
        path: "/profile",
        label: "Complete Profile",
      }
    : !completionStatus.hasJobTargets
    ? {
        path: "/job-targets",
        label: "Define Job Targets",
      }
    : {
        path: "/companies",
        label: "Find Companies",
      };
  if (isLoading) return null;
  return <Card className={`bg-primary/5 ${className}`}></Card>;
};
export default ProgressTracker;
