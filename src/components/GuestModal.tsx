import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/design-system/modals";
import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { User, Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/sonner";
import { GuestContactPreview } from "./guest/GuestContactPreview";
import { GuestProfileSummary } from "./guest/GuestProfileSummary";
import { MessageGeneration } from "./MessageGeneration";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { VALIDATION_LIMITS } from "@/lib/validation-constants";

interface MessageGenerationHandle {
  generateMessages: () => void;
}

const ProfileSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 w-3/4 bg-gray-200 rounded-md" />
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-200 rounded-md" />
      <div className="h-4 w-5/6 bg-gray-200 rounded-md" />
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-4 w-1/3 bg-gray-200 rounded-md" />
      <div className="h-4 w-full bg-gray-200 rounded-md" />
    </div>
  </div>
);

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
  } = useGuestSession();

  // Local state for form inputs and loading states
  const [userBio, setUserBio] = useState<string>("");
  const [contactBio, setContactBio] = useState<string>("");
  const [isCrafting, setIsCrafting] = useState(false);
  const messageGenRef = useRef<MessageGenerationHandle>(null);

  const biosAreReady =
    userBio.trim().split(/\s+/).length >= VALIDATION_LIMITS.MIN_WORDS_BG &&
    contactBio.trim().split(/\s+/).length >= VALIDATION_LIMITS.MIN_WORDS_BG;

  // Generate user profile
  const handleGenerateUserProfile = async () => {
    if (!userBio.trim()) {
      toast.error("Please enter your bio information");
      return;
    }
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
    } else {
      throw new Error(data.message || "Failed to generate profile");
    }
  };

  // Generate contact profile
  const handleGenerateContactProfile = async () => {
    if (!contactBio.trim()) {
      toast.error("Please enter the contact's bio information");
      return;
    }
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
    } else {
      throw new Error(data.message || "Failed to generate contact profile");
    }
  };

  const handleCraftOpener = async () => {
    if (isCrafting) return; // Prevent double-clicks
    setIsCrafting(true);
    try {
      // Step 1: Generate User Profile
      await handleGenerateUserProfile();

      // Step 2: Generate Contact Profile
      await handleGenerateContactProfile();

      // Step 3: Generate Messages
      setTimeout(() => {
        if (messageGenRef.current) {
          messageGenRef.current.generateMessages();
        }
      }, 100);
    } catch (error) {
      console.error("Error in the crafting sequence:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`An error occurred: ${errorMessage}`);
    } finally {
      setIsCrafting(false); // Re-enable the button
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Craft Your Perfect Opener"
      description=""
      className="sm:max-w-6xl max-h-[90vh]"
      icon={
        <img
          src="/opener-studio-logo.png"
          alt="Opener Studio"
          className="h-14 w-auto"
        />
      }
      headerClassName="p-8"
      titleClassName="text-3xl font-bold"
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

            {isCrafting && !sessionData.userProfile ? (
              <ProfileSkeleton />
            ) : !sessionData.userProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tell us about your professional background.
                  </label>
                  <Textarea
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    placeholder={`Copy / paste your LinkedIn profile (recommended), resume content, or professional bio here (${VALIDATION_LIMITS.MIN_WORDS_BG} words min)`}
                    className="min-h-[200px] text-sm resize-none bg-secondary border-border"
                  />
                </div>
              </div>
            ) : (
              <GuestProfileSummary
                userProfile={sessionData.userProfile}
                userSummary={sessionData.userSummary}
              />
            )}
          </div>

          {/* Right Panel - Contact Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contact Profile</h3>
            </div>

            {isCrafting && !sessionData.guestContact ? (
              <ProfileSkeleton /> // Reusing the same skeleton for simplicity
            ) : !sessionData.guestContact ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tell us about them.
                  </label>
                  <Textarea
                    value={contactBio}
                    onChange={(e) => setContactBio(e.target.value)}
                    placeholder={`Copy / paste their LinkedIn profile (${VALIDATION_LIMITS.MIN_WORDS_BG} words min)`}
                    className="min-h-[200px] text-sm resize-none bg-secondary border-border"
                  />
                </div>
              </div>
            ) : (
              <GuestContactPreview contact={sessionData.guestContact} />
            )}
          </div>
        </div>

        {/* Message Generation Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                What Are You Trying to Achieve?
              </h3>
            </div>
          </div>

          <MessageGeneration
            contact={
              sessionData.guestContact
                ? {
                    contact_id: sessionData.guestContact.id,
                    first_name: sessionData.guestContact.first_name,
                    last_name: sessionData.guestContact.last_name,
                    role: sessionData.guestContact.role,
                  }
                : null
            }
            companyName={sessionData.guestContact?.current_company || ""}
            isOpen={true}
            onClose={() => {}}
            embedded={true}
            isGuest={true}
            sessionId={sessionData.sessionId}
            guestContactId={sessionData.guestContact?.id}
            userProfileId={sessionData.userProfile?.profile_id}
            onMessagesGenerated={updateGeneratedMessages}
            biosAreReady={biosAreReady}
            onGenerateClick={handleCraftOpener}
            isCrafting={isCrafting}
            ref={messageGenRef}
          />
        </div>

        {/* Messages are now displayed within MessageGeneration component above */}
      </div>
    </Modal>
  );
};
