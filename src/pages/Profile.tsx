
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { LogOut, Briefcase, Upload, UserRound, Edit, File, RefreshCcw } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string;
  current_company?: string;
  location?: string;
}

interface CompletionStatus {
  hasBackground: boolean;
  hasJobTargets: boolean;
}

interface Background {
  experience: string;
  education: string;
  expertise: string;
  achievements: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    hasBackground: false,
    hasJobTargets: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);
  const [backgroundSources, setBackgroundSources] = useState<{ type: string, name: string }[]>([]);
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
          .select("*")
          .eq("user_id", user.id);
          
        if (backgroundError) {
          console.error("Error checking background data:", backgroundError);
        }
        
        // Get background sources
        if (backgroundData && backgroundData.length > 0) {
          const sources = backgroundData.map(item => ({
            type: item.content_type,
            name: item.content_type === 'cv_upload' 
              ? item.content.split('CV: ')[1] || 'Uploaded CV' 
              : item.content_type === 'linkedin_profile' 
                ? 'LinkedIn Profile' 
                : 'Additional Details'
          }));
          setBackgroundSources(sources);

          // Look for processed summary
          const summary = backgroundData.find(item => item.content_type === 'generated_summary');
          if (summary && summary.processed_data) {
            try {
              setBackgroundSummary(JSON.parse(summary.content));
            } catch (e) {
              console.error("Error parsing background summary", e);
              
              // Set dummy data if parsing fails
              setBackgroundSummary({
                experience: "Product leader with expertise in SaaS and technology companies.",
                education: "MBA from a top business school with undergraduate degree in Computer Science.",
                expertise: "Product strategy, cross-functional leadership, and go-to-market execution.",
                achievements: "Successfully launched multiple products driving significant revenue growth."
              });
            }
          } else {
            // Set dummy data if no summary was found
            setBackgroundSummary({
              experience: "Product leader with expertise in SaaS and technology companies.",
              education: "MBA from a top business school with undergraduate degree in Computer Science.",
              expertise: "Product strategy, cross-functional leadership, and go-to-market execution.",
              achievements: "Successfully launched multiple products driving significant revenue growth."
            });
          }
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
        
        setCompletionStatus({
          hasBackground: backgroundData && backgroundData.length > 0,
          hasJobTargets: targetData && targetData.length > 0,
        });
        
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        toast.error("Failed to load your profile. Please try again.");
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

  const getNextStep = () => {
    if (!completionStatus.hasBackground) {
      return { path: "/profile/enrich", label: "Complete Your Professional Background" };
    }
    if (!completionStatus.hasJobTargets) {
      return { path: "/profile/job-targets", label: "Define Your Job Targets" };
    }
    return { path: "/companies", label: "View Target Companies" };
  };

  const nextStep = getNextStep();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid gap-8">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => navigate("/profile/edit")}>
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
            <CardDescription>
              View and manage your profile information
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
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
            
            {backgroundSummary && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Professional Summary</h3>
                <Separator className="mb-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold">Experience</h4>
                    <p className="text-sm mt-1">{backgroundSummary.experience}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold">Education</h4>
                    <p className="text-sm mt-1">{backgroundSummary.education}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold">Expertise</h4>
                    <p className="text-sm mt-1">{backgroundSummary.expertise}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold">Key Achievements</h4>
                    <p className="text-sm mt-1">{backgroundSummary.achievements}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate("/profile/enrich")}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Update Background
                  </Button>
                </div>
              </div>
            )}
            
            {backgroundSources.length > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-medium text-muted-foreground">Background Sources</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {backgroundSources.map((source, index) => (
                    <div key={index} className="bg-secondary/20 px-2 py-1 rounded-md text-xs flex items-center">
                      <File className="h-3 w-3 mr-1" />
                      {source.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button onClick={() => navigate(nextStep.path)}>
              {nextStep.label}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Profile Completion</CardTitle>
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
                    Professional background
                    {completionStatus.hasBackground && <span className="text-xs ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Completed</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {completionStatus.hasBackground 
                      ? "Your professional background has been recorded. You can update it anytime."
                      : "Add your professional experience, skills, and achievements"}
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
                    Job targets
                    {completionStatus.hasJobTargets && <span className="text-xs ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Completed</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {completionStatus.hasJobTargets
                      ? "Your job target preferences have been saved. You can refine them anytime."
                      : "Tell us what roles you're looking for to get tailored recommendations"}
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
                  <h3 className="font-medium">Resume</h3>
                  <p className="text-sm text-muted-foreground">
                    {backgroundSources.some(s => s.type === 'cv_upload')
                      ? "Your resume has been uploaded. You can update it anytime."
                      : "Upload your resume to help us understand your experience"}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/profile/enrich")}
                >
                  {backgroundSources.some(s => s.type === 'cv_upload') ? "Update" : "Upload"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate(completionStatus.hasBackground && completionStatus.hasJobTargets ? "/companies" : nextStep.path)}
            >
              {completionStatus.hasBackground && completionStatus.hasJobTargets ? "View Your Dashboard" : "Continue Setup"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
