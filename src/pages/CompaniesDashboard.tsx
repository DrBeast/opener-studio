
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Briefcase, Building, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const CompaniesDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    const checkProfileCompletion = async () => {
      try {
        // Optimize by combining the queries into a single call
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .limit(1);
          
        const { data: targetData, error: targetError } = await supabase
          .from("target_criteria")
          .select("criteria_id")
          .eq("user_id", user.id)
          .limit(1);
        
        if (profileError || targetError) {
          throw new Error(profileError?.message || targetError?.message);
        }
        
        const hasBackground = profileData && profileData.length > 0;
        const hasTargets = targetData && targetData.length > 0;
        
        setProfileComplete(hasBackground && hasTargets);
        
        if (!(hasBackground && hasTargets)) {
          toast.info("Complete your profile to get personalized company recommendations.");
        }
      } catch (error) {
        // Simplified error handling without excessive logging
        toast.error("Failed to check profile completion.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProfileCompletion();
  }, [user]);
  
  const handleGenerateCompanies = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_companies', {
        body: { user_id: user.id }
      });
      
      if (error) throw error;
      
      toast.success("Company generation started successfully.");
    } catch (error) {
      toast.error("Failed to generate companies.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!profileComplete) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <ProfileBreadcrumbs />
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              You need to complete your profile before we can recommend target companies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800">
                To provide you with personalized company recommendations, we need more information about your background and job targets.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <Card className="bg-primary/5 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Professional Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <p className="text-sm">
                    Share your professional experience, skills, and achievements so we can match you with relevant companies.
                  </p>
                </CardContent>
                <CardFooter className="p-0">
                  <Button onClick={() => navigate("/profile/enrich")}>
                    Complete Background
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="bg-primary/5 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Search className="mr-2 h-5 w-5" />
                    Job Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4">
                  <p className="text-sm">
                    Define your job preferences, target industries, and desired company characteristics.
                  </p>
                </CardContent>
                <CardFooter className="p-0">
                  <Button onClick={() => navigate("/profile/job-targets")}>
                    Set Job Targets
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Target Companies</h1>
        <Button 
          className="flex items-center" 
          onClick={handleGenerateCompanies}
          disabled={isGenerating}
        >
          <Building className="mr-2 h-5 w-5" />
          {isGenerating ? "Generating..." : "Generate Companies"}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Companies Dashboard</CardTitle>
          <CardDescription>
            Based on your profile and preferences, we'll help you identify ideal companies to target
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
            <Building className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-medium text-blue-800">Ready to Generate Company Recommendations</h3>
            <p className="text-blue-600 mt-2 mb-6">
              Click the button below to generate a list of target companies based on your background and preferences.
            </p>
            <Button 
              size="lg"
              onClick={handleGenerateCompanies}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Target Companies"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesDashboard;
