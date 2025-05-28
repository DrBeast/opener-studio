
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X } from "lucide-react";
import ProfileSummary from "@/components/profile/ProfileSummary";
import EditableSummary from "@/components/profile/EditableSummary";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import DevOptions from "@/components/profile/DevOptions";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { FeedbackBox } from "@/components/FeedbackBox";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData } from "@/hooks/useProfileData";
import { Background } from "@/types/profile";
import { toast } from "@/components/ui/use-toast";

const Profile = () => {
  const { user } = useAuth();
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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDevOptions, setShowDevOptions] = useState(false);

  // Form state for editing
  const [linkedinContent, setLinkedinContent] = useState(profile?.linkedin_content || "");
  const [additionalDetails, setAdditionalDetails] = useState(profile?.additional_details || "");
  const [cvContent, setCvContent] = useState(profile?.cv_content || "");
  const [editableSummary, setEditableSummary] = useState<Background>(backgroundSummary || {
    experience: "",
    education: "",
    expertise: "",
    achievements: ""
  });

  // Update form state when profile data changes
  React.useEffect(() => {
    if (profile) {
      setLinkedinContent(profile.linkedin_content || "");
      setAdditionalDetails(profile.additional_details || "");
      setCvContent(profile.cv_content || "");
    }
  }, [profile]);

  React.useEffect(() => {
    if (backgroundSummary) {
      setEditableSummary(backgroundSummary);
    }
  }, [backgroundSummary]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form state
    if (profile) {
      setLinkedinContent(profile.linkedin_content || "");
      setAdditionalDetails(profile.additional_details || "");
      setCvContent(profile.cv_content || "");
    }
    if (backgroundSummary) {
      setEditableSummary(backgroundSummary);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save profile data
      await saveUserProfile(user.id, {
        linkedin_content: linkedinContent,
        additional_details: additionalDetails,
        cv_content: cvContent
      });

      // Save summary data
      await saveSummaryData(user.id, editableSummary);

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateAISummary = async () => {
    if (!user) return;

    setIsRegenerating(true);
    try {
      const newSummary = await regenerateAISummary(user.id, user.email || "");
      if (newSummary) {
        setEditableSummary(newSummary);
        toast({
          title: "AI Summary regenerated",
          description: "Your AI summary has been updated based on your profile data."
        });
      }
    } catch (error) {
      console.error("Error regenerating summary:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSummaryChange = (field: keyof Background, value: string | string[]) => {
    setEditableSummary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetUserData = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      await resetUserData(user.id);
      toast({
        title: "Data reset",
        description: "All user data has been reset successfully."
      });
    } catch (error) {
      console.error("Error resetting data:", error);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileBreadcrumbs />
      <FeedbackBox viewName="Profile Page" className="relative" variant="header" />
      
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">
              Build your professional profile to get better company and contact recommendations.
            </p>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Summary Section */}
        <ProfileSummary 
          backgroundSummary={isEditing ? editableSummary : backgroundSummary}
          onRegenerateAISummary={handleRegenerateAISummary}
        />

        {/* Professional Background Section */}
        {isEditing && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Professional Background</h2>
            <ProfessionalBackground
              linkedinContent={linkedinContent}
              setLinkedinContent={setLinkedinContent}
              additionalDetails={additionalDetails}
              setAdditionalDetails={setAdditionalDetails}
              cvContent={cvContent}
              setCvContent={setCvContent}
              isSubmitting={isSaving}
              isEditing={true}
              existingData={{
                linkedin: profile?.linkedin_content,
                additional: profile?.additional_details,
                cv: profile?.cv_content
              }}
            />
          </div>
        )}

        {/* Editable Summary Section (only shown when editing) */}
        {isEditing && (
          <EditableSummary
            editableSummary={editableSummary}
            onSummaryChange={handleSummaryChange}
          />
        )}

        {/* Developer Options */}
        <div className="pt-8 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDevOptions(!showDevOptions)}
            className="text-xs text-muted-foreground mb-4"
          >
            {showDevOptions ? "Hide" : "Show"} Developer Options
          </Button>
          
          <DevOptions
            showDevOptions={showDevOptions}
            isResetting={isResetting}
            onResetUserData={handleResetUserData}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
