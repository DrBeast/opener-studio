import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./useAuth";

interface GuestSessionData {
  sessionId: string;
  userProfile: any | null;
  userSummary: any | null;
  guestContact: any | null;
  generatedMessages: any | null;
  selectedMessage: string | null;
  selectedVersion: string | null;
}

export const useGuestSession = () => {
  const { getGuestSessionId, setGuestSessionId, clearGuestData } = useAuth();
  const [sessionData, setSessionData] = useState<GuestSessionData>({
    sessionId: "",
    userProfile: null,
    userSummary: null,
    guestContact: null,
    generatedMessages: null,
    selectedMessage: null,
    selectedVersion: null,
  });

  // Initialize session on mount
  useEffect(() => {
    const existingSessionId = getGuestSessionId();
    if (existingSessionId) {
      setSessionData((prev) => ({ ...prev, sessionId: existingSessionId }));
    } else {
      const newSessionId = uuidv4();
      setGuestSessionId(newSessionId);
      setSessionData((prev) => ({ ...prev, sessionId: newSessionId }));
    }
  }, [getGuestSessionId, setGuestSessionId]);

  // Load saved message selection from localStorage
  useEffect(() => {
    const savedMessage = localStorage.getItem("guest_selected_message");
    if (savedMessage) {
      try {
        const parsed = JSON.parse(savedMessage);
        if (parsed.sessionId === sessionData.sessionId) {
          setSessionData((prev) => ({
            ...prev,
            selectedMessage: parsed.message,
            selectedVersion: parsed.version,
          }));
        }
      } catch (error) {
        console.error("Error parsing saved message:", error);
      }
    }
  }, [sessionData.sessionId]);

  const updateUserProfile = useCallback((profile: any, summary: any) => {
    setSessionData((prev) => ({
      ...prev,
      userProfile: profile,
      userSummary: summary,
    }));
  }, []);

  const updateGuestContact = useCallback((contact: any) => {
    setSessionData((prev) => ({
      ...prev,
      guestContact: contact,
    }));
  }, []);

  const updateGeneratedMessages = useCallback((messages: any) => {
    setSessionData((prev) => ({
      ...prev,
      generatedMessages: messages,
    }));
  }, []);

  const selectMessage = useCallback(
    (message: string, version: string) => {
      setSessionData((prev) => ({
        ...prev,
        selectedMessage: message,
        selectedVersion: version,
      }));

      // Save to localStorage for signup flow
      localStorage.setItem(
        "guest_selected_message",
        JSON.stringify({
          message,
          version,
          sessionId: sessionData.sessionId,
        })
      );
    },
    [sessionData.sessionId]
  );

  const clearSession = useCallback(() => {
    clearGuestData();
    setSessionData({
      sessionId: "",
      userProfile: null,
      userSummary: null,
      guestContact: null,
      generatedMessages: null,
      selectedMessage: null,
      selectedVersion: null,
    });
  }, [clearGuestData]);

  const isProfileComplete = sessionData.userProfile && sessionData.userSummary;
  const isContactComplete = sessionData.guestContact;
  const isMessageGenerationUnlocked = isProfileComplete && isContactComplete;

  return {
    sessionData,
    updateUserProfile,
    updateGuestContact,
    updateGeneratedMessages,
    selectMessage,
    clearSession,
    isProfileComplete,
    isContactComplete,
    isMessageGenerationUnlocked,
  };
};
