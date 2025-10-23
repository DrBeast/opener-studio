import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { InfoBox } from "@/components/ui/design-system/infobox";
import { toast } from "@/hooks/use-toast";
import {
  Edit,
  ArrowRight,
  Save,
  Sparkles,
  RefreshCcw,
  User,
} from "lucide-react";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import { Background } from "@/types/profile";
import { useProfileData } from "@/hooks/useProfileData";
import { Label } from "@/components/ui/airtable-ds/label";
import { profileFormSchema, countWords } from "@/lib/validation";

// Design System Imports
import {
  PrimaryCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  OutlineAction,
  PrimaryAction,
  CardFooter,
} from "@/components/ui/design-system";

// Import new components
import ProfileSummary from "@/components/profile/ProfileSummary";
import EditableSummary from "@/components/profile/EditableSummary";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  }>({});

  // State for editable summary fields
  const [editableSummary, setEditableSummary] = useState<Background | null>(
    null
  );

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
    }

    setExistingData(existingBackgrounds);
  }, [profile, user, navigate]);

  // Check for edit mode from URL parameter
  useEffect(() => {
    const editFromUrl = searchParams.get("edit");
    if (editFromUrl === "true") {
      setEditMode(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Initialize editable summary when backgroundSummary changes or edit mode is activated
    if (backgroundSummary && editMode) {
      setEditableSummary({ ...backgroundSummary });
    }
  }, [backgroundSummary, editMode]);

  useEffect(() => {
    // Check if any changes were made compared to existing data
    const existingBackground = existingData.background || "";
    const currentBackground = backgroundInput.trim();
    const hasBackgroundChanges =
      currentBackground !== existingBackground && currentBackground.length > 0;

    // Check if any summary fields have changed
    let hasSummaryChanges = false;
    if (editableSummary && backgroundSummary) {
      hasSummaryChanges =
        editableSummary.expertise !== backgroundSummary.expertise ||
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

    // Don't validate if there are no changes
    if (!hasChanges) {
      return;
    }

    // Validate input using Zod schema
    const validationResult = profileFormSchema.safeParse({
      backgroundInput: backgroundInput.trim(),
    });

    if (!validationResult.success) {
      const errors = validationResult.error.format();
      toast({
        title: "Validation Error",
        description: errors.backgroundInput?._errors[0] || "Invalid input",
        variant: "destructive",
      });
      return;
    }

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
    <div className="flex flex-1 flex-col bg-gray-100 min-h-screen space-y-2">
      {/* Full-Width Card with Profile Content */}
      <PrimaryCard className="max-w-6xl mx-auto w-full mt-8">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Card Title and Description */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Professional Profile
                </h1>
                <p className="text-gray-600 mt-2">
                  {editMode
                    ? "Update your professional background and let AI generate your summary"
                    : "Your AI-generated professional summary for networking and outreach"}
                </p>
              </div>
              {!editMode && (
                <OutlineAction onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </OutlineAction>
              )}
            </div>

            {/* Edit Form - When in edit mode */}
            {editMode && (
              <div className="space-y-6">
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
                        <Save className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Professional Summary - When not in edit mode and has data */}
            {!editMode && backgroundSummary && (
              <div className="space-y-6">
                {(backgroundSummary.overall_blurb ||
                  backgroundSummary.value_proposition_summary) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Professional Overview */}
                    {backgroundSummary.overall_blurb && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                          Who You Are
                        </Label>
                        <div className="rounded-lg border p-4 bg-blue-50 text-sm text-gray-900 leading-relaxed">
                          {backgroundSummary.overall_blurb}
                        </div>
                      </div>
                    )}

                    {/* Value Proposition Section */}
                    {backgroundSummary.value_proposition_summary && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">
                          What You Bring to the Table
                        </Label>
                        <div className="rounded-lg border p-4 bg-blue-50 text-sm text-gray-900 leading-relaxed">
                          {backgroundSummary.value_proposition_summary}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Achievements Section */}

                {/* Experience Section */}

                {/* Education Section */}

                {/* Skills & Expertise Section */}
                {(backgroundSummary.key_skills?.length > 0 ||
                  backgroundSummary.domain_expertise?.length > 0 ||
                  backgroundSummary.technical_expertise?.length > 0 ||
                  backgroundSummary.expertise) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Skills & Expertise
                    </Label>
                    <div className="rounded-lg border p-4 bg-blue-50 text-sm text-gray-900">
                      {backgroundSummary.expertise && (
                        <p className="leading-relaxed mb-3">
                          {backgroundSummary.expertise}
                        </p>
                      )}
                      {backgroundSummary.key_skills &&
                        backgroundSummary.key_skills.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium mb-2 text-gray-700">
                              Key Skills:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {backgroundSummary.key_skills.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {backgroundSummary.domain_expertise &&
                        backgroundSummary.domain_expertise.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium mb-2 text-gray-700">
                              Domain Expertise:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {backgroundSummary.domain_expertise.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {backgroundSummary.technical_expertise &&
                        backgroundSummary.technical_expertise.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2 text-gray-700">
                              Technical Expertise:
                            </h5>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                              {backgroundSummary.technical_expertise.map(
                                (item, index) => (
                                  <li key={index}>{item}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <OutlineAction onClick={handleRegenerateAISummary}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Regenerate Summary
                  </OutlineAction>
                </div>
              </div>
            )}

            {/* No Profile Data State */}
            {!editMode && !backgroundSummary && (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                      Profile Setup Needed
                    </h3>
                    <p className="text-amber-800 mb-4">
                      You haven't provided any professional background
                      information yet. Get started by adding your professional
                      details.
                    </p>
                    <OutlineAction onClick={() => setEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </OutlineAction>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </PrimaryCard>

      {/* Bottom padding */}
      <div className="h-8"></div>
    </div>
  );
};

export default Profile;
