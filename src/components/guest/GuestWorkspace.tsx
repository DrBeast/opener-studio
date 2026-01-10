import React, { useState, useRef } from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GuestContactPreview } from "./GuestContactPreview";
import { GuestProfileSummary } from "./GuestProfileSummary";
import { MessageGeneration } from "../MessageGeneration";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { VALIDATION_LIMITS } from "@/lib/validation-constants";
import { DsTextarea, PrimaryAction } from "@/components/ui/design-system";
import { cn } from "@/lib/utils";

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
  </div>
);

export const GuestWorkspace = () => {
  const {
    sessionData,
    updateUserProfile,
    updateGuestContact,
    updateGeneratedMessages,
  } = useGuestSession();

  const [userBio, setUserBio] = useState<string>("");
  const [contactBio, setContactBio] = useState<string>("");
  const [isCrafting, setIsCrafting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const messageGenRef = useRef<MessageGenerationHandle>(null);

  const biosAreReady =
    userBio.trim().split(/\s+/).length >= VALIDATION_LIMITS.MIN_WORDS_BG &&
    contactBio.trim().split(/\s+/).length >= VALIDATION_LIMITS.MIN_WORDS_BG;

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
    if (isCrafting) return;
    setIsCrafting(true);
    try {
      // Step 1: Generate User Profile
      if (!sessionData.userProfile) {
        await handleGenerateUserProfile();
      }

      // Step 2: Generate Contact Profile
      if (!sessionData.guestContact) {
        await handleGenerateContactProfile();
      }

      // Step 3: Generate Messages
      // Use setTimeout to allow state updates to propagate before triggering generation
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
      setIsCrafting(false);
    }
  };

  const handleMessagesGenerated = (messages: any) => {
    updateGeneratedMessages(messages);
    setShowResults(true);
    setIsCrafting(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Top Section: Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: User Bio */}
          <div className="space-y-2 h-full flex flex-col">
            {isCrafting && !sessionData.userProfile ? (
              <ProfileSkeleton />
            ) : !sessionData.userProfile ? (
              <div className="space-y-2 h-full flex flex-col">
                <div className="flex-1">
                  <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                    Your context
                  </label>
                  <DsTextarea
                    tone="white"
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    placeholder={`Paste your LinkedIn profile or resume summary. (Tip: "Select All" on your profile page works best).`}
                    className="h-32 text-sm resize-none"
                  />
                </div>
              </div>
            ) : (
              <GuestProfileSummary
                userProfile={sessionData.userProfile}
                userSummary={sessionData.userSummary}
                className="flex-1"
              />
            )}
          </div>

          {/* Right: Contact Bio */}
          <div className="space-y-2 h-full flex flex-col">
            {isCrafting && !sessionData.guestContact ? (
              <ProfileSkeleton />
            ) : !sessionData.guestContact ? (
              <div className="space-y-2 h-full flex flex-col">
                <div className="flex-1">
                  <label className="block text-xs uppercase font-bold text-gray-500 mb-2">
                    Their profile
                  </label>
                  <DsTextarea
                    tone="white"
                    value={contactBio}
                    onChange={(e) => setContactBio(e.target.value)}
                    placeholder={`Paste their LinkedIn profile or bio. (Tip: "Select All" on their profile ensures the best personalization).`}
                    className="h-32 text-sm resize-none"
                  />
                </div>
              </div>
            ) : (
              <GuestContactPreview
                contact={sessionData.guestContact}
                className="flex-1"
              />
            )}
          </div>
        </div>

        {/* Middle Section: Action Button */}
        {(!showResults || isCrafting) && (
          <div className="flex justify-center mt-4">
            <PrimaryAction
              onClick={handleCraftOpener}
              disabled={!biosAreReady || isCrafting}
              size="lg"
              className={cn(
                "text-lg font-semibold px-12 py-4 shadow-lg transform transition-all duration-200",
                biosAreReady && !isCrafting
                  ? "hover:scale-105 hover:shadow-xl"
                  : "opacity-70"
              )}
            >
              {isCrafting ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Crafting Magic...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Craft First Draft
                </>
              )}
            </PrimaryAction>
          </div>
        )}

        {/* Bottom Section: Message Generation Results */}
        <div
          className={cn(
            "transition-all duration-700 ease-in-out overflow-hidden",
            showResults
              ? "opacity-100 max-h-[2000px] border-t border-gray-100 pt-8"
              : "opacity-0 max-h-0"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                What Are You Trying to Achieve?
              </h3>
            </div>
          </div>

          {/* Always render MessageGeneration to maintain ref, but hide it visually until needed */}
          <div className={cn(!showResults && "invisible h-0")}>
            <MessageGeneration
              ref={messageGenRef}
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
              onMessagesGenerated={handleMessagesGenerated}
              biosAreReady={biosAreReady}
              onGenerateClick={handleCraftOpener}
              isCrafting={isCrafting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
