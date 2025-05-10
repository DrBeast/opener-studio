import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { RefreshCcw, Save, Edit } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import ProgressTracker from "@/components/ProgressTracker";
import ProfessionalBackground from "@/components/ProfessionalBackground";

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string;
  current_company?: string;
  location?: string;
}

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
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate("/auth/login");
        return;
      }
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }
        setProfile(data);

        // Fetch user profile data from the new structure
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile data:", profileError);
        }

        // Get background sources
        if (profileData) {
          // Prepare form data from existing entries
          const existingBackgrounds: {
            linkedin?: string;
            additional?: string;
            cv?: string;
          } = {};

          // Process retrieved data for form
          if (profileData) {
            if (profileData.linkedin_content) {
              existingBackgrounds.linkedin = profileData.linkedin_content;
              setLinkedinContent(profileData.linkedin_content);
            }

            if (profileData.additional_details) {
              existingBackgrounds.additional = profileData.additional_details;
              setAdditionalDetails(profileData.additional_details);
            }

            if (profileData.cv_content) {
              existingBackgrounds.cv = profileData.cv_content;
              setCvContent(profileData.cv_content);
            }
          }
          setExistingData(existingBackgrounds);
        }

        // Fetch summary data from the new user_summaries table
        const { data: summaryData, error: summaryError } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

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
            combined_experience_highlights: summaryData.combined_experience_highlights,
            combined_education_highlights: summaryData.combined_education_highlights,
            key_skills: summaryData.key_skills,
            domain_expertise: summaryData.domain_expertise,
            technical_expertise: summaryData.technical_expertise,
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
        toast.error("Failed to load your profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    // Check if any changes were made compared to existing data
    const hasLinkedinChanges = linkedinContent !== (existingData.linkedin || "");
    const hasAdditionalChanges = additionalDetails !== (existingData.additional || "");
    const hasCvChanges = cvContent !== (existingData.cv || "");
    setHasChanges(hasLinkedinChanges || hasAdditionalChanges || hasCvChanges);
  }, [linkedinContent, additionalDetails, cvContent, existingData]);

  const saveUserProfile = async () => {
    if (!user) return;
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      let upsertError;
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("user_profiles")
          .update({
            linkedin_content: linkedinContent || null,
            additional_details: additionalDetails || null,
            cv_content: cvContent || null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);
          
        upsertError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from("user_profiles")
          .insert({
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
      toast.error(`Failed to save profile data: ${error.message}`);
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
      const { data, error } = await supabase.functions.invoke("generate_profile", {
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

      toast.success("Profile information updated successfully!");
      setEditMode(false);
      setHasChanges(false);

      // Refresh the page data
      window.location.reload();
    } catch (error: any) {
      console.error("Error submitting profile data:", error.message);
      toast.error(`Failed to process profile information: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateAISummary = async () => {
    if (!user) return;
    toast.info("Regenerating your professional summary...");

    try {
      // Call the edge function to regenerate the summary
      const { data, error } = await supabase.functions.invoke("generate_profile", {
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
        toast.success("Your professional summary has been updated!");
      } else {
        toast.error("Failed to generate a new summary");
      }
    } catch (error: any) {
      console.error("Error regenerating summary:", error.message);
      toast.error(`Failed to regenerate summary: ${error.message}`);
    }
  };

  // Development mode - Reset user data
  const handleResetUserData = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to reset all user data? This will delete your background data.")) return;
    setIsResetting(true);
    try {
      // Delete user profile data
      const { error: profileError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("user_id", user.id);
        
      if (profileError) throw profileError;

      // Delete user summary data
      const { error: summaryError } = await supabase
        .from("user_summaries")
        .delete()
        .eq("user_id", user.id);
        
      if (summaryError) throw summaryError;

      // Delete user background data (legacy table)
      const { error: backgroundError } = await supabase
        .from("user_backgrounds")
        .delete()
        .eq("user_id", user.id);
        
      if (backgroundError) throw backgroundError;

      // Delete user target criteria
      const { error: targetError } = await supabase
        .from("target_criteria")
        .delete()
        .eq("user_id", user.id);
        
      if (targetError) throw targetError;
        
      toast.success("User data has been reset successfully");

      // Refresh the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error resetting user data:", error.message);
      toast.error(`Failed to reset user data: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  
  // Helper function to render arrays safely
  const renderArrayItems = (items?: string[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <ul className="list-disc list-inside text-sm space-y-1 pl-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  return <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Professional Profile</CardTitle>
                
              </div>
              {!editMode && <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Professional Summary - Always Visible */}
              {backgroundSummary && <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">AI Summary</h3>
                    <Button variant="outline" size="sm" onClick={handleRegenerateAISummary} className="flex items-center gap-2 text-justify">
                      <RefreshCcw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {/* Show overall blurb if available */}
                    {backgroundSummary.overall_blurb && (
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <h4 className="font-semibold">Overall</h4>
                        <p className="text-sm mt-1">{backgroundSummary.overall_blurb}</p>
                      </div>
                    )}
                    
                    {/* Show value proposition if available */}
                    {backgroundSummary.value_proposition_summary && (
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <h4 className="font-semibold">Value Proposition</h4>
                        <p className="text-sm mt-1">{backgroundSummary.value_proposition_summary}</p>
                      </div>
                    )}
                  
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
                        {backgroundSummary.key_skills && backgroundSummary.key_skills.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Key Skills:</h5>
                            {renderArrayItems(backgroundSummary.key_skills)}
                          </div>
                        )}
                        {backgroundSummary.domain_expertise && backgroundSummary.domain_expertise.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Domain Expertise:</h5>
                            {renderArrayItems(backgroundSummary.domain_expertise)}
                          </div>
                        )}
                        {backgroundSummary.technical_expertise && backgroundSummary.technical_expertise.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium">Technical Expertise:</h5>
                            {renderArrayItems(backgroundSummary.technical_expertise)}
                          </div>
                        )}
                      </div>
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <h4 className="font-semibold">Key Achievements</h4>
                        <p className="text-sm mt-1">{backgroundSummary.achievements}</p>
                      </div>
                    </div>
                  </div>
                </div>}
              
              {/* Edit Form - Only visible when in edit mode */}
              {editMode && <div className="border-t pt-6 mt-6">
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
                          Save Changes
                          <Save className="h-4 w-4" />
                        </>}
                    </Button>
                  </div>
                </div>}
              
              {/* Show empty state if no summary and not in edit mode */}
              {!backgroundSummary && !editMode && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <p>You haven't provided any professional background information yet. Click 'Edit Profile' to get started.</p>
                </div>}
            </CardContent>
          </Card>
          
          {/* Development Tools Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between">
                <span>Development Tools</span>
                <Button variant="ghost" size="sm" onClick={() => setShowDevOptions(!showDevOptions)}>
                  {showDevOptions ? "Hide Options" : "Show Options"}
                </Button>
              </CardTitle>
              <CardDescription>Tools for testing and development purposes</CardDescription>
            </CardHeader>
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
        
        <div className="md:col-span-1 space-y-6">
          <ProgressTracker />
        </div>
      </div>
    </div>;
};

export default Profile;
