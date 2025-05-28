
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, X } from "lucide-react";
import ProfileSummary from "@/components/profile/ProfileSummary";
import EditableSummary from "@/components/profile/EditableSummary";
import ProfessionalBackground from "@/components/ProfessionalBackground";
import CVUpload from "@/components/CVUpload";
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

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl relative">
      <FeedbackBox viewName="Profile" variant="modal" />
      <ProfileBreadcrumbs />
      
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
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* AI Summary Section */}
        <ProfileSummary 
          backgroundSummary={backgroundSummary}
          onRegenerateAISummary={handleRegenerateAISummary}
        />

        {/* Professional Background Section */}
        {isEditing && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Professional Background</h2>
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

            {/* Editable Summary Section */}
            <EditableSummary 
              editableSummary={editableSummary}
              onSummaryChange={handleSummaryChange}
            />
          </div>
        )}

        {/* CV Upload Section - always visible for now */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Upload Documents</h2>
          <CVUpload />
        </div>

        {/* Dev Options */}
        <DevOptions 
          onResetData={() => resetUserData(user?.id || "")}
        />
      </div>
    </div>
  );
};

export default Profile;
