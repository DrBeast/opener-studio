
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw, Save, Edit, FileText } from "lucide-react";
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
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);
  const [backgroundSources, setBackgroundSources] = useState<{ type: string, name: string }[]>([]);
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
    cv_content?: string;
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
            name: item.content_type === 'cv_content_raw' 
              ? 'Resume Content' 
              : item.content_type === 'linkedin_profile' 
                ? 'LinkedIn Profile' 
                : 'Additional Details'
          }));
          setBackgroundSources(sources);

          // Prepare form data from existing entries
          const existingBackgrounds: {
            linkedin?: string;
            additional?: string;
            cv_content?: string;
          } = {};
          
          // Process retrieved data for form
          if (backgroundData && backgroundData.length > 0) {
            // Look for LinkedIn data
            const linkedinData = backgroundData.find(item => item.content_type === 'linkedin_profile');
            if (linkedinData) {
              existingBackgrounds.linkedin = linkedinData.content;
              setLinkedinContent(linkedinData.content);
            }
            
            // Look for additional details
            const additionalData = backgroundData.find(item => item.content_type === 'additional_details');
            if (additionalData) {
              existingBackgrounds.additional = additionalData.content;
              setAdditionalDetails(additionalData.content);
            }
            
            // Look for CV content raw
            const cvData = backgroundData.find(item => item.content_type === 'cv_content_raw');
            if (cvData) {
              existingBackgrounds.cv_content = cvData.content;
              setCvContent(cvData.content);
            }
          }
          
          setExistingData(existingBackgrounds);

          // Look for processed summary
          const summary = backgroundData.find(item => item.content_type === 'generated_summary');
          if (summary && summary.content) {
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
    const hasCvChanges = cvContent !== (existingData.cv_content || "");
    
    setHasChanges(hasLinkedinChanges || hasAdditionalChanges || hasCvChanges);
  }, [linkedinContent, additionalDetails, cvContent, existingData]);

  const saveUserBackground = async (contentType: string, content: string) => {
    if (!user) return;
    
    try {
      // First check if this content type already exists for this user
      const { data: existingData, error: existingError } = await supabase
        .from("user_backgrounds")
        .select("background_id")
        .eq("user_id", user.id)
        .eq("content_type", contentType)
        .maybeSingle();
        
      if (existingError) throw existingError;
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from("user_backgrounds")
          .update({
            content: content,
            processed_data: {
              raw_content: true,
              status: "pending_processing"
            }
          })
          .eq("background_id", existingData.background_id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_backgrounds")
          .insert({
            user_id: user.id,
            content_type: contentType,
            content: content,
            processed_data: {
              raw_content: true,
              status: "pending_processing"
            }
          });
            
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(`Error saving ${contentType}:`, error.message);
      toast.error(`Failed to save ${contentType}: ${error.message}`);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Save LinkedIn content if provided
      if (linkedinContent.trim()) {
        await saveUserBackground("linkedin_profile", linkedinContent);
      }
      
      // Save additional details if provided
      if (additionalDetails.trim()) {
        await saveUserBackground("additional_details", additionalDetails);
      }
      
      // Save CV content if provided
      if (cvContent.trim()) {
        await saveUserBackground("cv_content_raw", cvContent);
      }
      
      // For demo purposes, create a simulated AI-processed summary
      // In a real implementation, this would come from an AI service like Gemini
      const simulatedSummary = {
        experience: "Your most recent roles appear to be in product management and leadership positions.",
        education: "You have a background in business and technology from reputable institutions.",
        expertise: "Your key skills include product strategy, team leadership, and business development.",
        achievements: "You've successfully led teams and delivered impactful products in your career."
      };
      
      // Save the generated summary to the database
      await saveUserBackground("generated_summary", JSON.stringify(simulatedSummary));
      
      // Update UI to show the summary
      setBackgroundSummary(simulatedSummary);
      
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
    // In a real implementation, this would call an AI service
    toast.info("Regenerating your professional summary...");
    
    // Simulate API call
    setTimeout(() => {
      const newSummary = {
        experience: "Updated summary based on your recent experience in product leadership and SaaS.",
        education: "Education background in business and computer science with specialized training.",
        expertise: "Core skills include product strategy, team leadership, and go-to-market execution.",
        achievements: "Notable achievements in launching successful products and driving revenue growth."
      };
      
      setBackgroundSummary(newSummary);
      
      // Save the new summary
      saveUserBackground("generated_summary", JSON.stringify(newSummary))
        .then(() => toast.success("Your professional summary has been updated!"))
        .catch(() => toast.error("Failed to save your updated summary"));
    }, 2000);
  };
  
  // Development mode - Reset user data
  const handleResetUserData = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to reset all user data? This will delete your background data.")) return;
    
    setIsResetting(true);
    
    try {
      // Delete user background data
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
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Professional Profile</CardTitle>
                <CardDescription>
                  Your professional background and experience
                </CardDescription>
              </div>
              {!editMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Professional Summary - Always Visible */}
              {backgroundSummary && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Professional Summary</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRegenerateAISummary}
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
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
                </div>
              )}
              
              {backgroundSources.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Background Sources</h3>
                    {!editMode && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {backgroundSources.map((source, index) => (
                      <div key={index} className="bg-secondary/20 px-2 py-1 rounded-md text-xs flex items-center">
                        {source.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Edit Form - Only visible when in edit mode */}
              {editMode && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">Edit Profile Information</h3>
                  
                  <ProfessionalBackground 
                    linkedinContent={linkedinContent}
                    setLinkedinContent={setLinkedinContent}
                    additionalDetails={additionalDetails}
                    setAdditionalDetails={setAdditionalDetails}
                    isSubmitting={isSubmitting}
                    isEditing={Object.keys(existingData).length > 0}
                    existingData={existingData}
                  />
                  
                  {/* CV Content */}
                  <Card className="bg-primary/5 p-6 rounded-lg mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          Resume Content
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {existingData.cv_content
                            ? "Update your resume content below."
                            : "Copy and paste the content of your resume into the text box below. This helps us understand your professional background better."
                          }
                        </p>
                        
                        {existingData.cv_content && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                            <p>Your resume content is shown below. You can keep it as is or update it.</p>
                          </div>
                        )}
                        
                        <Textarea
                          placeholder="Paste your resume content here..."
                          className="min-h-[200px] w-full"
                          value={cvContent}
                          onChange={(e) => setCvContent(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </Card>
                  
                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={!hasChanges || isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          Processing... 
                          <span className="ml-2 animate-spin">⟳</span>
                        </>
                      ) : (
                        <>
                          Save Changes
                          <Save className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Show empty state if no summary and not in edit mode */}
              {!backgroundSummary && !editMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <p>You haven't provided any professional background information yet. Click 'Edit Profile' to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Development Tools Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between">
                <span>Development Tools</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDevOptions(!showDevOptions)}
                >
                  {showDevOptions ? "Hide Options" : "Show Options"}
                </Button>
              </CardTitle>
              <CardDescription>Tools for testing and development purposes</CardDescription>
            </CardHeader>
            {showDevOptions && (
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Reset User Data</h3>
                    <p className="text-xs text-red-700 mb-4">
                      Warning: This will delete all your profile data, background information, and job target criteria.
                      Use this option to test the new user onboarding flow.
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleResetUserData}
                      disabled={isResetting}
                    >
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
              </CardContent>
            )}
          </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <ProgressTracker />
        </div>
      </div>
    </div>
  );
};

export default Profile;
