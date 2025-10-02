import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { guestSessionManager, GuestSessionData } from "@/utils/guestSession";

interface GuestSessionContextType {
  sessionData: GuestSessionData;
  updateUserProfile: (profile: any, summary: any) => void;
  updateGuestContact: (contact: any) => void;
  updateGeneratedMessages: (messages: any) => void;
  selectMessage: (message: string, version: string) => void;
  clearSession: () => void;
  isProfileComplete: boolean;
  isContactComplete: boolean;
  isMessageGenerationUnlocked: boolean;
}

const GuestSessionContext = createContext<GuestSessionContextType | undefined>(
  undefined
);

interface GuestSessionProviderProps {
  children: ReactNode;
}

export const GuestSessionProvider: React.FC<GuestSessionProviderProps> = ({
  children,
}) => {
  const [sessionData, setSessionData] = useState<GuestSessionData>(() => {
    return guestSessionManager.getSessionData();
  });

  // Update session data when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "guest_session_id" || e.key === "guest_selected_message") {
        setSessionData(guestSessionManager.getSessionData());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateUserProfile = (profile: any, summary: any) => {
    setSessionData((prev) => ({
      ...prev,
      userProfile: profile,
      userSummary: summary,
    }));
  };

  const updateGuestContact = (contact: any) => {
    setSessionData((prev) => ({
      ...prev,
      guestContact: contact,
    }));
  };

  const updateGeneratedMessages = (messages: any) => {
    setSessionData((prev) => ({
      ...prev,
      generatedMessages: messages,
    }));
  };

  const selectMessage = (message: string, version: string) => {
    guestSessionManager.setSelectedMessage(message, version);
    setSessionData((prev) => ({
      ...prev,
      selectedMessage: message,
      selectedVersion: version,
    }));
  };

  const clearSession = () => {
    guestSessionManager.clearSession();
    setSessionData({
      sessionId: "",
    });
  };

  const isProfileComplete = !!(
    sessionData.userProfile && sessionData.userSummary
  );
  const isContactComplete = !!sessionData.guestContact;
  const isMessageGenerationUnlocked = isProfileComplete && isContactComplete;

  const value: GuestSessionContextType = {
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

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
};

export const useGuestSession = (): GuestSessionContextType => {
  const context = useContext(GuestSessionContext);
  if (context === undefined) {
    throw new Error(
      "useGuestSession must be used within a GuestSessionProvider"
    );
  }
  return context;
};
