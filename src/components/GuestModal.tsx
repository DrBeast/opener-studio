import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/design-system/modals";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { PrimaryAction } from "@/components/ui/design-system";
import { Button } from "@/components/ui/design-system/buttons";
import { Loader2, User, Users, MessageCircle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { GuestContactPreview } from "./guest/GuestContactPreview";
import { GuestProfileSummary } from "./guest/GuestProfileSummary";
import { MessageGeneration } from "./MessageGeneration";
import { useGuestSession } from "@/contexts/GuestSessionContext";

// Interfaces for guest data
interface GeneratedMessage {
  version1: string;
  version2: string;
  version3: string;
}

interface GuestUserProfile {
  profile_id: string;
  first_name?: string;
  last_name?: string;
  current_company?: string;
  location?: string;
  job_role?: string;
  background_input?: string;
}

interface GuestUserSummary {
  overall_blurb?: string;
  experience?: string;
  education?: string;
  expertise?: string;
  achievements?: string;
  combined_experience_highlights?: string[];
  combined_education_highlights?: string[];
  key_skills?: string[];
  domain_expertise?: string[];
  technical_expertise?: string[];
  value_proposition_summary?: string;
}

interface GuestContact {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
  current_company?: string;
  location?: string;
  bio_summary?: string;
  how_i_can_help?: string;
}

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestModal: React.FC<GuestModalProps> = ({ isOpen, onClose }) => {
  // Use guest session context
  const {
    sessionData,
    updateUserProfile,
    updateGuestContact,
    updateGeneratedMessages,
    isProfileComplete,
    isContactComplete,
    isMessageGenerationUnlocked,
  } = useGuestSession();

  // Local state for form inputs and loading states
  const [userBio, setUserBio] = useState<string>("");
  const [isGeneratingUserProfile, setIsGeneratingUserProfile] = useState(false);
  const [contactBio, setContactBio] = useState<string>("");
  const [isGeneratingContact, setIsGeneratingContact] = useState(false);

  // Generate user profile
  const handleGenerateUserProfile = async () => {
    if (!userBio.trim()) {
      toast.error("Please enter your bio information");
      return;
    }

    setIsGeneratingUserProfile(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_profile",
        {
          body: {
            sessionId: sessionData.sessionId,
            backgroundInput: userBio,
          },
        }
      );

      if (error) throw error;

      if (data.success === true) {
        updateUserProfile(
          { ...data.extractedProfile, profile_id: data.profile_id },
          data.summary
        );
        toast.success("Your profile has been generated successfully!");
      } else {
        throw new Error(data.message || "Failed to generate profile");
      }
    } catch (error) {
      console.error("Error generating user profile:", error);
      toast.error("Failed to generate your profile. Please try again.");
    } finally {
      setIsGeneratingUserProfile(false);
    }
  };

  // Generate contact profile
  const handleGenerateContactProfile = async () => {
    if (!contactBio.trim()) {
      toast.error("Please enter the contact's bio information");
      return;
    }

    setIsGeneratingContact(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            linkedin_bio: contactBio,
            sessionId: sessionData.sessionId,
          },
        }
      );

      if (error) throw error;

      if (data.success === true) {
        updateGuestContact({
          id: data.guest_contact_id,
          first_name: data.contact.first_name,
          last_name: data.contact.last_name,
          role: data.contact.role,
          current_company: data.contact.current_company,
          location: data.contact.location,
          bio_summary: data.contact.bio_summary,
          how_i_can_help: data.contact.how_i_can_help,
        });
        toast.success("Contact profile generated successfully!");
      } else {
        throw new Error(data.message || "Failed to generate contact profile");
      }
    } catch (error) {
      console.error("Error generating contact profile:", error);
      toast.error("Failed to generate contact profile. Please try again.");
    } finally {
      setIsGeneratingContact(false);
    }
  };

  // Handle message generation
  const handleGenerateMessages = (messages: GeneratedMessage) => {
    updateGeneratedMessages(messages);
  };

  // Handle message selection
  const handleMessageSelection = (message: string, version: string) => {
    selectMessage(message, version);
  };

  // Handle signup flow
  const handleSignup = () => {
    // Close modal and redirect to signup
    onClose();
    // You can add navigation to signup page here
    window.location.href = "/auth/signup";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Craft Your Perfect Message"
      description="Generate personalized outreach messages for your networking goals"
      className="sm:max-w-6xl max-h-[90vh]"
      icon={<MessageCircle className="h-10 w-10" />}
    >
      <div className="space-y-6">
        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - User Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Your Profile</h3>
            </div>

            {!sessionData.userProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Now, briefly tell us about you (so the AI can write from
                    your perspective)
                  </label>
                  <Textarea
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    placeholder="Copy your professional bio from your LinkedIn profile. Simply select everything (CMD/CTRL + A) and copy it (CMD/CTRL + C) here (CMD/CTRL + V). Don't worry about formatting - AI will figure it out. Feel free to type in or add anything about yourself that feels relevant."
                    className="min-h-[200px] text-base p-4 border-2 border-slate-200 focus:border-violet-500 transition-all duration-300 bg-slate-50/50 rounded-xl shadow-inner resize-none"
                  />
                </div>
                <PrimaryAction
                  onClick={handleGenerateUserProfile}
                  disabled={!userBio.trim() || isGeneratingUserProfile}
                  className="w-full"
                  size="default"
                >
                  {isGeneratingUserProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Your Profile...
                    </>
                  ) : (
                    "Generate Your Profile"
                  )}
                </PrimaryAction>
              </div>
            ) : (
              <GuestProfileSummary
                userProfile={sessionData.userProfile}
                userSummary={sessionData.userSummary}
              />
            )}
          </div>

          {/* Right Panel - Contact Bio */}
          <div
            className={`space-y-4 transition-all duration-500 ${
              !isProfileComplete
                ? "opacity-50 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contact Profile</h3>
              {!isProfileComplete && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {!sessionData.guestContact ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Paste your contact's bio
                  </label>
                  <Textarea
                    value={contactBio}
                    onChange={(e) => setContactBio(e.target.value)}
                    placeholder="Copy all content on their LinkedIn profile page (CTRL/CMD + A, CTRL/CMD + C) and paste it here (CTRL/CMD + V)."
                    className="min-h-[200px] text-sm resize-none bg-secondary border-border"
                  />
                </div>
                <PrimaryAction
                  onClick={handleGenerateContactProfile}
                  disabled={!contactBio.trim() || isGeneratingContact}
                  className="w-full"
                  size="default"
                >
                  {isGeneratingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Bio...
                    </>
                  ) : (
                    "Generate Contact Profile"
                  )}
                </PrimaryAction>
              </div>
            ) : (
              <GuestContactPreview contact={sessionData.guestContact} />
            )}
          </div>
        </div>

        {/* Message Generation Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isMessageGenerationUnlocked ? (
                <MessageCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
              <h3 className="text-lg font-semibold">
                {isMessageGenerationUnlocked
                  ? "Message Generation"
                  : "Message Generation (Locked)"}
              </h3>
            </div>
          </div>

          {isMessageGenerationUnlocked ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Both profiles are ready! You can now generate personalized
                messages.
              </p>
              {sessionData.userProfile && sessionData.guestContact && (
                <MessageGeneration
                  contact={{
                    contact_id: sessionData.guestContact.id,
                    first_name: sessionData.guestContact.first_name,
                    last_name: sessionData.guestContact.last_name,
                    role: sessionData.guestContact.role,
                  }}
                  companyName={sessionData.guestContact.current_company || ""}
                  isOpen={true}
                  onClose={() => {}}
                  embedded={true}
                  isGuest={true}
                  sessionId={sessionData.sessionId}
                  guestContactId={sessionData.guestContact.id}
                  userProfileId={sessionData.userProfile.profile_id}
                  onMessagesGenerated={handleGenerateMessages}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Complete both profile sections above to unlock message
                generation.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" />
                <span>
                  Message generation is locked until both profiles are created
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Messages are now displayed within MessageGeneration component above */}
      </div>
    </Modal>
  );
};
