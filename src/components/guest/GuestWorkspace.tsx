import React, { useState, useRef } from "react";
import { User, Users, Sparkles, MessageSquare } from "lucide-react";
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
      <div className="p-6 md:p-8 space-y-8">
        {/* Top Section: Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: User Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                About You
              </h3>
            </div>

            {isCrafting && !sessionData.userProfile ? (
              <ProfileSkeleton />
            ) : !sessionData.userProfile ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Paste your LinkedIn "About" section or a short professional bio.
                </p>
                <DsTextarea
                  tone="white"
                  value={userBio}
                  onChange={(e) => setUserBio(e.target.value)}
                  placeholder={`Example: "I'm a Product Manager with 5 years of experience in Fintech..." (${VALIDATION_LIMITS.MIN_WORDS_BG} words min)`}
                  className="min-h-[160px] text-base resize-none bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            ) : (
              <GuestProfileSummary
                userProfile={sessionData.userProfile}
                userSummary={sessionData.userSummary}
              />
            )}
          </div>

          {/* Right: Contact Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                About Them
              </h3>
            </div>

            {isCrafting && !sessionData.guestContact ? (
              <ProfileSkeleton />
            ) : !sessionData.guestContact ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Paste their LinkedIn "About" section or bio.
                </p>
                <DsTextarea
                  tone="white"
                  value={contactBio}
                  onChange={(e) => setContactBio(e.target.value)}
                  placeholder={`Example: "CTO at TechCorp. Passionate about AI and scaling engineering teams..." (${VALIDATION_LIMITS.MIN_WORDS_BG} words min)`}
                  className="min-h-[160px] text-base resize-none bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            ) : (
              <GuestContactPreview contact={sessionData.guestContact} />
            )}
          </div>
        </div>

        {/* Middle Section: Action Button */}
        {(!showResults || isCrafting) && (
          <div className="flex justify-center pt-4">
            <PrimaryAction
              onClick={handleCraftOpener}
              disabled={!biosAreReady || isCrafting}
              size="lg"
              className={cn(
                "text-lg font-semibold px-12 py-6 shadow-lg transform transition-all duration-200",
                biosAreReady && !isCrafting ? "hover:scale-105 hover:shadow-xl" : "opacity-70"
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
                  Craft My Opener
                </>
              )}
            </PrimaryAction>
          </div>
        )}

        {/* Bottom Section: Message Generation Results */}
        <div
          className={cn(
            "transition-all duration-700 ease-in-out overflow-hidden",
            showResults ? "opacity-100 max-h-[2000px] border-t border-gray-100 pt-8" : "opacity-0 max-h-0"
          )}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Your Drafts
            </h3>
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
