import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { InfoBox } from "@/components/ui/design-system/infobox";
import { toast } from "@/hooks/use-toast";
import { Edit, ArrowRight, Save, Sparkles } from "lucide-react";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import { Background } from "@/types/profile";
import { useProfileData } from "@/hooks/useProfileData";

// Design System Imports
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  PageTitle,
  PageDescription,
  OutlineAction,
  PrimaryAction,
  SectionTitle,
  CardFooter,
} from "@/components/ui/design-system";

// Import new components
import ProfileSummary from "@/components/profile/ProfileSummary";
import EditableSummary from "@/components/profile/EditableSummary";

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
    setBackgroundSummary,
  } = useProfileData(user?.id);

  // Form state - now using unified background input
  const [backgroundInput, setBackgroundInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingData, setExistingData] = useState<{
    background?: string;
    linkedin?: string;
    additional?: string;
    cv?: string;
  }>({});

  // State for editable summary fields
  const [editableSummary, setEditableSummary] = useState<Background | null>(
    null
  );

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

    // Process retrieved data for form - prioritize background_input, fallback to combined legacy fields
    const existingBackgrounds: {
      background?: string;
      linkedin?: string;
      additional?: string;
      cv?: string;
    } = {};

    if (profile.background_input) {
      // Use the unified background input if available
      existingBackgrounds.background = profile.background_input;
      setBackgroundInput(profile.background_input);
    } else {
      // For backward compatibility, combine the legacy fields
      const legacyData = [
        profile.linkedin_content &&
          `LinkedIn Profile:\n${profile.linkedin_content}`,
        profile.cv_content && `CV Content:\n${profile.cv_content}`,
        profile.additional_details &&
          `Additional Details:\n${profile.additional_details}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (legacyData) {
        existingBackgrounds.background = legacyData;
        setBackgroundInput(legacyData);
      }

      // Also store individual legacy fields for reference
      if (profile.linkedin_content) {
        existingBackgrounds.linkedin = profile.linkedin_content;
      }
      if (profile.additional_details) {
        existingBackgrounds.additional = profile.additional_details;
      }
      if (profile.cv_content) {
        existingBackgrounds.cv = profile.cv_content;
      }
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
    const hasBackgroundChanges =
      backgroundInput !== (existingData.background || "");

    // Check if any summary fields have changed
    let hasSummaryChanges = false;
    if (editableSummary && backgroundSummary) {
      hasSummaryChanges =
        editableSummary.experience !== backgroundSummary.experience ||
        editableSummary.education !== backgroundSummary.education ||
        editableSummary.expertise !== backgroundSummary.expertise ||
        editableSummary.achievements !== backgroundSummary.achievements ||
        editableSummary.overall_blurb !== backgroundSummary.overall_blurb ||
        editableSummary.value_proposition_summary !==
          backgroundSummary.value_proposition_summary ||
        JSON.stringify(editableSummary.key_skills) !==
          JSON.stringify(backgroundSummary.key_skills) ||
        JSON.stringify(editableSummary.domain_expertise) !==
          JSON.stringify(backgroundSummary.domain_expertise) ||
        JSON.stringify(editableSummary.technical_expertise) !==
          JSON.stringify(backgroundSummary.technical_expertise) ||
        JSON.stringify(editableSummary.combined_experience_highlights) !==
          JSON.stringify(backgroundSummary.combined_experience_highlights) ||
        JSON.stringify(editableSummary.combined_education_highlights) !==
          JSON.stringify(backgroundSummary.combined_education_highlights);
    }

    setHasChanges(hasBackgroundChanges || hasSummaryChanges);
  }, [backgroundInput, editableSummary, backgroundSummary, existingData]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Save profile data to user_profiles table using the unified background_input field
      await saveUserProfile(user.id, {
        background_input: backgroundInput,
      });

      // Save the updated summary data if in edit mode
      if (editMode && editableSummary) {
        await saveSummaryData(user.id, editableSummary);

        // Update the backgroundSummary state with the edited values
        setBackgroundSummary(editableSummary);
      } else {
        // If not in edit mode, call the edge function to regenerate the summary
        const summary = await regenerateAISummary(user.id, user.email || "");
        if (summary) {
          setBackgroundSummary(summary);
        }
      }

      toast({
        title: "Success",
        description: "Profile information updated successfully!",
      });

      setEditMode(false);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Error submitting profile data:", error.message);
      toast({
        title: "Error",
        description: `Failed to process profile information: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateAISummary = async () => {
    if (!user) return;

    toast({
      title: "Info",
      description: "Regenerating your professional summary...",
    });

    try {
      const summary = await regenerateAISummary(user.id, user.email || "");
      if (summary) {
        toast({
          title: "Success",
          description: "Your professional summary has been updated!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate a new summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleEnrichProfile = () => {
    // Navigate to profile/enrichment which will be redirected to /profile
    // We keep the logic separate for future improvements
    navigate("/profile/enrichment");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Helper function to handle changes to editable summary fields
  const handleSummaryChange = (
    field: keyof Background,
    value: string | string[]
  ) => {
    if (editableSummary) {
      setEditableSummary({
        ...editableSummary,
        [field]: value,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8 max-w-4xl">
        <ProfileBreadcrumbs />

        <div className="grid gap-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between">
              <div>
                <PageTitle>Professional Profile</PageTitle>
                <PageDescription>
                  Manage your professional information and AI-generated
                  summaries
                </PageDescription>
              </div>
              <div className="flex gap-3">
                {!editMode && (
                  <OutlineAction onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </OutlineAction>
                )}
                <PrimaryAction onClick={handleNavigateToTargets}>
                  Next: Define Targets
                  <ArrowRight className="h-4 w-4" />
                </PrimaryAction>
              </div>
            </div>

            {/* Info Box */}

            <InfoBox
              title="💡 AI-Generated Professional Summary"
              description="We will use the AI-generated summary of your profile for company matching and message generation. You can edit the summaries directly or regenerate them based on updated details. Feel free to experiment here."
              icon={<Sparkles className="h-6 w-6 text-blue-600" />}
              // badges={["Profile Setup", "AI-Powered"]} // Example: If you want badges
            />

            <Card>
              <CardContent className="space-y-8">
                {/* Edit Form - Moved to the top when in edit mode */}
                {editMode && (
                  <div className="border-t border-gray-100 pt-8">
                    <SectionTitle>Edit Profile Information</SectionTitle>

                    <ProfessionalBackground
                      backgroundInput={backgroundInput}
                      setBackgroundInput={setBackgroundInput}
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

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                      <OutlineAction
                        onClick={() => setEditMode(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </OutlineAction>
                      <Button
                        variant="success"
                        onClick={handleSaveProfile}
                        disabled={!hasChanges || isSubmitting}
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
                  <div className="border-t border-gray-100 pt-8">
                    <CardTitle>AI-Generated Profile Summary</CardTitle>
                    <CardDescription>
                      Intelligent analysis of your professional background
                    </CardDescription>
                    <ProfileSummary
                      backgroundSummary={backgroundSummary}
                      onRegenerateAISummary={handleRegenerateAISummary}
                    />
                  </div>
                )}
              </CardContent>

              {/* Bottom navigation button */}
              <CardFooter className="flex justify-end gap-4">
                <OutlineAction onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </OutlineAction>
                <PrimaryAction onClick={handleNavigateToTargets}>
                  Next: Define Targets
                  <ArrowRight className="h-4 w-4" />
                </PrimaryAction>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
