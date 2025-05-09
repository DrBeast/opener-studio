
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Briefcase, Upload, UserRound } from "lucide-react";

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string; // Updated from current_role
  current_company?: string;
  location?: string;
}

interface CompletionStatus {
  hasBackground: boolean;
  hasJobTargets: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    hasBackground: false,
    hasJobTargets: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data);
        
        // Check for background data
        const { data: backgroundData, error: backgroundError } = await supabase
          .from("user_backgrounds")
          .select("background_id")
          .eq("user_id", user.id)
          .limit(1);
          
        if (backgroundError) {
          console.error("Error checking background data:", backgroundError);
        }
        
        // Check for job targets data
        const { data: targetData, error: targetError } = await supabase
          .from("target_criteria")
          .select("criteria_id")
          .eq("user_id", user.id)
          .limit(1);
          
        if (targetError) {
          console.error("Error checking target criteria:", targetError);
        }
        
        setCompletionStatus({
          hasBackground: backgroundData && backgroundData.length > 0,
          hasJobTargets: targetData && targetData.length > 0,
        });
        
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="grid gap-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
            <CardDescription>
              View and manage your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p className="font-medium">{user?.email || "Not provided"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                <p className="font-medium">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : "Not provided"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Role</h3>
                <p className="font-medium">{profile?.job_role || "Not provided"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Company</h3>
                <p className="font-medium">{profile?.current_company || "Not provided"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p className="font-medium">{profile?.location || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Next Steps</CardTitle>
            <CardDescription>
              Complete these steps to get the most out of EngageAI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex items-center p-4 rounded-lg ${completionStatus.hasBackground ? "bg-green-50" : "bg-primary/5"}`}>
                <div className={`mr-4 p-2 rounded-full ${completionStatus.hasBackground ? "bg-green-100" : "bg-primary/10"}`}>
                  <UserRound className={`h-5 w-5 ${completionStatus.hasBackground ? "text-green-600" : "text-primary"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium flex items-center">
                    Complete your professional background
                    {completionStatus.hasBackground && <span className="text-xs ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Completed</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add your professional experience and skills
                  </p>
                </div>
                <Button 
                  variant={completionStatus.hasBackground ? "outline" : "default"} 
                  size="sm"
                  onClick={() => navigate("/profile/enrich")}
                >
                  {completionStatus.hasBackground ? "Update" : "Complete"}
                </Button>
              </div>

              <div className={`flex items-center p-4 rounded-lg ${completionStatus.hasJobTargets ? "bg-green-50" : "bg-primary/5"}`}>
                <div className={`mr-4 p-2 rounded-full ${completionStatus.hasJobTargets ? "bg-green-100" : "bg-primary/10"}`}>
                  <Briefcase className={`h-5 w-5 ${completionStatus.hasJobTargets ? "text-green-600" : "text-primary"}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium flex items-center">
                    Define your target roles
                    {completionStatus.hasJobTargets && <span className="text-xs ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Completed</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tell us what roles you're looking for to get tailored recommendations
                  </p>
                </div>
                <Button 
                  variant={completionStatus.hasJobTargets ? "outline" : "default"} 
                  size="sm" 
                  onClick={() => navigate("/profile/job-targets")}
                >
                  {completionStatus.hasJobTargets ? "Update" : "Complete"}
                </Button>
              </div>

              <div className="flex items-center p-4 rounded-lg bg-primary/5">
                <div className="mr-4 p-2 rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Upload your resume</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your resume to help us understand your experience
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Upload
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate(completionStatus.hasBackground ? "/profile/job-targets" : "/profile/enrich")}>
              {completionStatus.hasBackground && completionStatus.hasJobTargets ? "View Your Dashboard" : "Continue Setup"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
