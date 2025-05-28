import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Edit, ArrowRight, Save } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import { Background } from "@/types/profile";
import { useProfileData } from "@/hooks/useProfileData";

// Import new components
import ProfileSummary from "@/components/profile/ProfileSummary";
import EditableSummary from "@/components/profile/EditableSummary";
import DevOptions from "@/components/profile/DevOptions";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    profile,
    backgroundSummary,
    isLoading,
    saveUserProfile,
    saveSummaryData,
    regenerateAISummary,
    resetUserData,
    setBackgroundSummary
  } = useProfileData(user?.id);

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

  // State for editable summary fields
  const [editableSummary, setEditableSummary] = useState<Background | null>(null);

  // Dev mode - user data reset
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Navigate to job targets page
  const handleNavigateToTargets = () => {
    navigate("/job-targets");
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    
    // If no profile is loaded yet, return
    if (!profile) return;
    
    // Process retrieved data for form
    const existingBackgrounds: {
      linkedin?: string;
      additional?: string;
      cv?: string;
    } = {};
    
    if (profile.linkedin_content) {
      existingBackgrounds.linkedin = profile.linkedin_content;
      setLinkedinContent(profile.linkedin_content);
    }
    if (profile.additional_details) {
      existingBackgrounds.additional = profile.additional_details;
      setAdditionalDetails(profile.additional_details);
    }
    if (profile.cv_content) {
      existingBackgrounds.cv = profile.cv_content;
      setCvContent(profile.cv_content);
    }
    setExistingData(existingBackgrounds);
  }, [profile, user, navigate]);

  // Initialize editable summary when backgroundSummary changes or edit mode is activated
  useEffect(() => {
    if (backgroundSummary && editMode) {
      setEditableSummary({ ...backgroundSummary });
    }
  }, [backgroundSummary, editMode]);

  useEffect(() => {
    // Check if any changes were made compared to existing data
    const hasLinkedinChanges = linkedinContent !== (existingData.linkedin || "");
    const hasAdditionalChanges = additionalDetails !== (existingData.additional || "");
    const hasCvChanges = cvContent !== (existingData.cv || "");
    
    // Check if any summary fields have changed
    let hasSummaryChanges = false;
    if (editableSummary && backgroundSummary) {
      hasSummaryChanges = 
        editableSummary.experience !== backgroundSummary.experience ||
        editableSummary.education !== backgroundSummary.education ||
        editableSummary.expertise !== backgroundSummary.expertise ||
        editableSummary.achievements !== backgroundSummary.achievements ||
        editableSummary.overall_blurb !== backgroundSummary.overall_blurb ||
        editableSummary.value_proposition_summary !== backgroundSummary.value_proposition_summary ||
        JSON.stringify(editableSummary.key_skills) !== JSON.stringify(backgroundSummary.key_skills) ||
        JSON.stringify(editableSummary.domain_expertise) !== JSON.stringify(backgroundSummary.domain_expertise) ||
        JSON.stringify(editableSummary.technical_expertise) !== JSON.stringify(backgroundSummary.technical_expertise) ||
        JSON.stringify(editableSummary.combined_experience_highlights) !== JSON.stringify(backgroundSummary.combined_experience_highlights) ||
        JSON.stringify(editableSummary.combined_education_highlights) !== JSON.stringify(backgroundSummary.combined_education_highlights);
    }
    
    setHasChanges(hasLinkedinChanges || hasAdditionalChanges || hasCvChanges || hasSummaryChanges);
  }, [linkedinContent, additionalDetails, cvContent, editableSummary, backgroundSummary, existingData]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Save profile data to user_profiles table
      await saveUserProfile(user.id, {
        linkedin_content: linkedinContent,
        additional_details: additionalDetails,
        cv_content: cvContent
      });

      // Save the updated summary data if in edit mode
      if (editMode && editableSummary) {
        await saveSummaryData(user.id, editableSummary);
        
        // Update the backgroundSummary state with the edited values
        setBackgroundSummary(editableSummary);
      } else {
        // If not in edit mode, call the edge function to regenerate the summary
        const summary = await regenerateAISummary(user.id, user.email || '');
        if (summary) {
          setBackgroundSummary(summary);
        }
      }

      toast({
        title: "Success",
        description: "Profile information updated successfully!"
      });
      
      setEditMode(false);
      setHasChanges(false);
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
      const summary = await regenerateAISummary(user.id, user.email || '');
      if (summary) {
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
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Development mode - Reset user data
  const handleResetUserData = async () => {
    if (!user) return;
    
    if (!window.confirm("Are you sure you want to reset all user data? This will delete your background data.")) {
      return;
    }
    
    setIsResetting(true);
    try {
      await resetUserData(user.id);
      
      toast({
        title: "Success",
        description: "User data has been reset successfully"
      });

      // Refresh the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Error is already handled in the hook
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
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper function to handle changes to editable summary fields
  const handleSummaryChange = (field: keyof Background, value: string | string[]) => {
    if (editableSummary) {
      setEditableSummary({
        ...editableSummary,
        [field]: value
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      
      <div className="grid gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Professional Profile</CardTitle>
              </div>
              <div className="flex gap-2">
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
                <Button 
                  size="sm" 
                  onClick={handleNavigateToTargets} 
                  className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
                >
                  Next: Define Targets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            {/* New Info Box */}
            <div className="mx-6 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                We will use the AI-generated summary of your profile for company matching and message generation. You can edit the summaries directly or regenerate them based on updated details. Feel free to experiment here.
              </p>
            </div>
            
            <CardContent className="space-y-6">
              {/* Edit Form - Moved to the top when in edit mode */}
              {editMode && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Edit Profile Information</h3>
                  
                  <ProfessionalBackground 
                    linkedinContent={linkedinContent} 
                    setLinkedinContent={setLinkedinContent} 
                    additionalDetails={additionalDetails} 
                    setAdditionalDetails={setAdditionalDetails} 
                    cvContent={cvContent} 
                    setCvContent={setCvContent} 
                    isSubmitting={isSubmitting} 
                    isEditing={Object.keys(existingData).length > 0} 
                    existingData={existingData} 
                  />
                  
                  {/* Editable AI Summary Section */}
                  {editableSummary && (
                    <EditableSummary 
                      editableSummary={editableSummary} 
                      onSummaryChange={handleSummaryChange} 
                    />
                  )}
                  
                  <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline" onClick={() => setEditMode(false)} disabled={isSubmitting}>
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
              
              {/* Professional Summary - Only visible when not in edit mode */}
              {!editMode && (
                <ProfileSummary 
                  backgroundSummary={backgroundSummary} 
                  onRegenerateAISummary={handleRegenerateAISummary} 
                />
              )}
            </CardContent>
            
            {/* Bottom navigation button */}
            <CardFooter className="flex justify-end pt-4 border-t">
              <Button 
                onClick={handleNavigateToTargets} 
                className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
              >
                Next: Define Targets
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          {/* Development Tools Card */}
          <Card>
            <DevOptions 
              showDevOptions={showDevOptions}
              isResetting={isResetting}
              onResetUserData={handleResetUserData}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
