import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RefreshCcw, Save, Edit, ArrowRight } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import ProgressTracker from "@/components/ProgressTracker";
import ProfessionalBackground from "@/components/ProfessionalBackground";
interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string;
  current_company?: string;
  location?: string;
  linkedin_content?: string;
  additional_details?: string;
  cv_content?: string;
}

// Helper function to ensure we have a string array from Json type
const ensureStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
};
interface Background {
  experience: string;
  education: string;
  expertise: string;
  achievements: string;
  overall_blurb?: string;
  combined_experience_highlights?: string[];
  combined_education_highlights?: string[];
  key_skills?: string[];
  domain_expertise?: string[];
  technical_expertise?: string[];
  value_proposition_summary?: string;
}
const Profile = () => {
  const {
    user
  } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);
  const navigate = useNavigate();

  // Form state
  const [linkedinContent, setLinkedinContent] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingData, setExistingData] = useState<{
    linkedin?: string;
    additional?: string;
    cv?: string;
  }>({});

  // Dev mode - user data reset
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Navigate to job targets page
  const handleNavigateToTargets = () => {
    navigate("/job-targets");
  };

  // ... keep existing code (fetchUserProfile useEffect)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }
      try {
        setIsLoading(true);

        // Fetch profile from user_profiles
        const {
          data,
          error
        } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
        if (error && error.code !== "PGRST116") {
          throw error;
        }
        if (data) {
          setProfile(data);

          // Prepare form data from existing entries
          const existingBackgrounds: {
            linkedin?: string;
            additional?: string;
            cv?: string;
          } = {};

          // Process retrieved data for form
          if (data.linkedin_content) {
            existingBackgrounds.linkedin = data.linkedin_content;
            setLinkedinContent(data.linkedin_content);
          }
          if (data.additional_details) {
            existingBackgrounds.additional = data.additional_details;
            setAdditionalDetails(data.additional_details);
          }
          if (data.cv_content) {
            existingBackgrounds.cv = data.cv_content;
            setCvContent(data.cv_content);
          }
          setExistingData(existingBackgrounds);
        }

        // Fetch summary data from the user_summaries table
        const {
          data: summaryData,
          error: summaryError
        } = await supabase.from("user_summaries").select("*").eq("user_id", user.id).maybeSingle();
        if (summaryError && summaryError.code !== "PGRST116") {
          console.error("Error fetching summary data:", summaryError);
        }
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
        } else {
          // Set dummy data if no summary was found
          setBackgroundSummary({
            experience: "Product leader with expertise in SaaS and technology companies.",
            education: "MBA from a top business school with undergraduate degree in Computer Science.",
            expertise: "Product strategy, cross-functional leadership, and go-to-market execution.",
            achievements: "Successfully launched multiple products driving significant revenue growth."
          });
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, navigate]);

  // ... keep existing code (check for changes useEffect)
  useEffect(() => {
    // Check if any changes were made compared to existing data
    const hasLinkedinChanges = linkedinContent !== (existingData.linkedin || "");
    const hasAdditionalChanges = additionalDetails !== (existingData.additional || "");
    const hasCvChanges = cvContent !== (existingData.cv || "");
    setHasChanges(hasLinkedinChanges || hasAdditionalChanges || hasCvChanges);
  }, [linkedinContent, additionalDetails, cvContent, existingData]);

  // ... keep existing code (saveUserProfile function and handlers)
  const saveUserProfile = async () => {
    if (!user) return;
    try {
      // Check if profile already exists
      const {
        data: existingProfile,
        error: checkError
      } = await supabase.from("user_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      let upsertError;
      if (existingProfile) {
        // Update existing profile
        const {
          error
        } = await supabase.from("user_profiles").update({
          linkedin_content: linkedinContent || null,
          additional_details: additionalDetails || null,
          cv_content: cvContent || null,
          updated_at: new Date().toISOString()
        }).eq("user_id", user.id);
        upsertError = error;
      } else {
        // Insert new profile
        const {
          error
        } = await supabase.from("user_profiles").insert({
          user_id: user.id,
          linkedin_content: linkedinContent || null,
          additional_details: additionalDetails || null,
          cv_content: cvContent || null
        });
        upsertError = error;
      }
      if (upsertError) throw upsertError;
    } catch (error: any) {
      console.error(`Error saving profile data:`, error.message);
      toast({
        title: "Error",
        description: `Failed to save profile data: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Save profile data to user_profiles table
      await saveUserProfile();

      // Call the edge function to regenerate the summary
      const {
        data,
        error
      } = await supabase.functions.invoke("generate_profile", {
        body: {
          userId: user.id,
          userEmail: user.email
        }
      });
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      if (data && data.summary) {
        setBackgroundSummary(data.summary);
      }
      toast({
        title: "Success",
        description: "Profile information updated and summary regenerated!"
      });
      setEditMode(false);
      setHasChanges(false);

      // Refresh the page data
      window.location.reload();
    } catch (error: any) {
      console.error("Error submitting profile data:", error.message);
      toast({
        title: "Error",
        description: `Failed to process profile information: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRegenerateAISummary = async () => {
    if (!user) return;
    toast({
      title: "Info",
      description: "Regenerating your professional summary..."
    });
    try {
      // Call the edge function to regenerate the summary
      const {
        data,
        error
      } = await supabase.functions.invoke("generate_profile", {
        body: {
          userId: user.id,
          userEmail: user.email
        }
      });
      if (error) {
        throw error;
      }
      if (data && data.summary) {
        setBackgroundSummary(data.summary);
        toast({
          title: "Success",
          description: "Your professional summary has been updated!"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a new summary",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error regenerating summary:", error.message);
      toast({
        title: "Error",
        description: `Failed to regenerate summary: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Development mode - Reset user data
  const handleResetUserData = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to reset all user data? This will delete your background data.")) return;
    setIsResetting(true);
    try {
      // Delete user profile data
      const {
        error: profileError
      } = await supabase.from("user_profiles").delete().eq("user_id", user.id);
      if (profileError) throw profileError;

      // Delete user summary data
      const {
        error: summaryError
      } = await supabase.from("user_summaries").delete().eq("user_id", user.id);
      if (summaryError) throw summaryError;

      // Delete user target criteria
      const {
        error: targetError
      } = await supabase.from("target_criteria").delete().eq("user_id", user.id);
      if (targetError) throw targetError;
      toast({
        title: "Success",
        description: "User data has been reset successfully"
      });

      // Refresh the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error resetting user data:", error.message);
      toast({
        title: "Error",
        description: `Failed to reset user data: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };
  const handleEnrichProfile = () => {
    // Navigate to profile/enrichment which will be redirected to /profile
    // We keep the logic separate for future improvements
    navigate("/profile/enrichment");
  };
  if (isLoading) {
    return <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  // Helper function to render arrays safely
  const renderArrayItems = (items?: string[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return <ul className="list-disc list-inside text-sm space-y-1 pl-2">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>;
  };
  return <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Professional Profile</CardTitle>
              </div>
              <div className="flex gap-2">
                {!editMode && <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>}
                <Button size="sm" onClick={handleNavigateToTargets} className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90">
                  Next: Define Targets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Edit Form - Moved to the top when in edit mode */}
              {editMode && <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Edit Profile Information</h3>
                  
                  <ProfessionalBackground linkedinContent={linkedinContent} setLinkedinContent={setLinkedinContent} additionalDetails={additionalDetails} setAdditionalDetails={setAdditionalDetails} cvContent={cvContent} setCvContent={setCvContent} isSubmitting={isSubmitting} isEditing={Object.keys(existingData).length > 0} existingData={existingData} />
                  
                  <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline" onClick={() => setEditMode(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={!hasChanges || isSubmitting} className="flex items-center gap-2">
                      {isSubmitting ? <>
                          Processing... 
                          <span className="ml-2 animate-spin">⟳</span>
                        </> : <>
                          Save and Regenerate
                          <Save className="h-4 w-4" />
                        </>}
                    </Button>
                  </div>
                </div>}
              
              {/* Professional Summary - Only visible when not in edit mode or below edit form when in edit mode */}
              {backgroundSummary && <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">AI Summary</h3>
                    {!editMode}
                  </div>
                  
                  {/* Show overall blurb if available */}
                  {backgroundSummary.overall_blurb && <div className="bg-primary/10 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold">Overall</h4>
                      <p className="text-sm mt-1">{backgroundSummary.overall_blurb}</p>
                    </div>}
                    
                  {/* Show value proposition if available */}
                  {backgroundSummary.value_proposition_summary && <div className="bg-primary/10 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold">Value Proposition</h4>
                      <p className="text-sm mt-1">{backgroundSummary.value_proposition_summary}</p>
                    </div>}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold">Experience</h4>
                      <p className="text-sm mt-1">{backgroundSummary.experience}</p>
                      {renderArrayItems(backgroundSummary.combined_experience_highlights)}
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold">Education</h4>
                      <p className="text-sm mt-1">{backgroundSummary.education}</p>
                      {renderArrayItems(backgroundSummary.combined_education_highlights)}
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold">Expertise</h4>
                      <p className="text-sm mt-1">{backgroundSummary.expertise}</p>
                      {backgroundSummary.key_skills && backgroundSummary.key_skills.length > 0 && <div className="mt-2">
                          <h5 className="text-sm font-medium">Key Skills:</h5>
                          {renderArrayItems(backgroundSummary.key_skills)}
                        </div>}
                      {backgroundSummary.domain_expertise && backgroundSummary.domain_expertise.length > 0 && <div className="mt-2">
                          <h5 className="text-sm font-medium">Domain Expertise:</h5>
                          {renderArrayItems(backgroundSummary.domain_expertise)}
                        </div>}
                      {backgroundSummary.technical_expertise && backgroundSummary.technical_expertise.length > 0 && <div className="mt-2">
                          <h5 className="text-sm font-medium">Technical Expertise:</h5>
                          {renderArrayItems(backgroundSummary.technical_expertise)}
                        </div>}
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold">Key Achievements</h4>
                      <p className="text-sm mt-1">{backgroundSummary.achievements}</p>
                    </div>
                  </div>
                </div>}
              
              {/* Show empty state if no summary and not in edit mode */}
              {!backgroundSummary && !editMode && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <p>You haven't provided any professional background information yet. Click 'Edit Profile' to get started.</p>
                </div>}
            </CardContent>
            
            {/* Bottom navigation button */}
            <CardFooter className="flex justify-end pt-4 border-t">
              <Button onClick={handleNavigateToTargets} className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90">
                Next: Define Targets
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Development Tools Card */}
          <Card>
            
            {showDevOptions && <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Reset User Data</h3>
                    <p className="text-xs text-red-700 mb-4">
                      Warning: This will delete all your profile data, background information, and job target criteria.
                      Use this option to test the new user onboarding flow.
                    </p>
                    <Button variant="destructive" size="sm" onClick={handleResetUserData} disabled={isResetting}>
                      {isResetting ? "Resetting..." : "Reset All User Data"}
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Email Verification</h3>
                    <p className="text-xs text-blue-700 mb-2">
                      Email verification is required by default. For testing purposes, you can disable it in the Supabase dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>}
          </Card>
        </div>
      </div>
    </div>;
};
export default Profile;