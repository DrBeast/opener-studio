import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  linkUserProfile: (
    userId: string,
    sessionId: string | null
  ) => Promise<boolean>;
  getGuestSessionId: () => string | null;
  setGuestSessionId: (sessionId: string) => void;
  clearGuestData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified function to link a guest profile
  const linkUserProfile = async (
    userId: string,
    sessionId: string | null
  ): Promise<boolean> => {
    if (!sessionId) {
      console.log("No session ID found, skipping profile linking");
      return false;
    }

    console.log(
      `useAuth: Attempting to link guest profile (session: ${sessionId}) to user: ${userId}`
    );

    // Create a unique key for this specific user and session
    const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
    const alreadyLinkedData = localStorage.getItem(linkStatusKey);

    // Check if already linked
    if (alreadyLinkedData) {
      try {
        const linked = JSON.parse(alreadyLinkedData);
        if (linked.linked && linked.success) {
          console.log(
            "This profile was previously linked to the current user according to localStorage"
          );

          // Double-check in database that the profile was actually linked
          const { data: profileCheck } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (profileCheck) {
            console.log("Confirmed: User profile exists in database");
            return true;
          } else {
            console.log(
              "Profile marked as linked in localStorage but not found in database - will attempt linking again"
            );
          }
        }
      } catch (e) {
        console.error("Error parsing linked status data:", e);
      }
    }

    try {
      console.log(
        `useAuth: Calling link_guest_profile function with userId: ${userId}, sessionId: ${sessionId}`
      );

      // Call the edge function with a single attempt and appropriate timeout
      const { data, error } = await supabase.functions.invoke(
        "link_guest_profile",
        {
          body: { userId, sessionId },
        }
      );

      if (error) {
        console.error(`useAuth: Error linking guest profile:`, error);
        return false;
      }

      if (data?.success) {
        // Mark this session as linked for this specific user
        localStorage.setItem(
          linkStatusKey,
          JSON.stringify({
            linked: true,
            timestamp: new Date().toISOString(),
            success: true,
          })
        );

        console.log("Guest profile successfully linked to user account:", data);
        toast.success("Profile successfully linked to your account", {
          id: "profile-linking-success",
        });

        return true;
      }

      return false;
    } catch (err) {
      console.error("Failed to link guest profile:", err);
      return false;
    }
  };

  // Enhanced session validation
  const validateSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session validation error:", error);
        return null;
      }

      // Check if session is expired
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();

        if (now >= expiresAt) {
          console.log("Session expired, clearing user state");
          return null;
        }
      }

      return session;
    } catch (error) {
      console.error("Session validation failed:", error);
      return null;
    }
  };

  // Enhanced signOut function with better error handling
  const signOut = async () => {
    try {
      console.log("Starting sign out process...");

      // Clear user state immediately to prevent UI issues
      setUser(null);

      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);

        // Even if Supabase signOut fails, we should clear local state
        // This handles cases where the session is already invalid on the server
        if (
          error.message?.includes("session_not_found") ||
          error.message?.includes("Session not found")
        ) {
          console.log(
            "Session already cleared on server, proceeding with local cleanup"
          );
        } else {
          // For other errors, show user-friendly message but still clear local state
          toast.error(
            "Error signing out, but you have been logged out locally"
          );
        }
      }

      // Clear all auth-related localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.startsWith("supabase.") ||
            key.startsWith("linked-profile-") ||
            key === "guest_session_id")
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage key: ${key}`);
      });

      // Broadcast storage event to sync across tabs
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "auth-signout",
          newValue: Date.now().toString(),
          storageArea: localStorage,
        })
      );

      console.log("Sign out completed successfully");
      toast.success("Signed out successfully");

      // Force a redirect to the homepage to ensure a clean state
      window.location.href = "/";
    } catch (error: any) {
      console.error("Unexpected error during sign out:", error);

      // Even on unexpected errors, clear local state
      setUser(null);

      // Clear localStorage as fallback
      try {
        localStorage.removeItem("supabase.auth.token");
        localStorage.removeItem("guest_session_id");
      } catch (storageError) {
        console.error("Failed to clear localStorage:", storageError);
      }

      toast.error("Signed out locally due to error");
    }
  };

  useEffect(() => {
    // Check active session
    const getUser = async () => {
      setIsLoading(true);

      try {
        const session = await validateSession();

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error("Authentication check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Listen for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-signout") {
        console.log("Received signout event from another tab");
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      // Note: Profile linking only happens during signUp, not signIn
    } catch (error: any) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Beginning signup process with email:", email);
      const sessionId = localStorage.getItem("guest_session_id");
      console.log("Current session ID during signup:", sessionId);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      console.log("useAuth: Successfully signed up, user data:", data.user);

      // Sign in automatically after sign up
      try {
        await signIn(email, password);
      } catch (signInError) {
        console.error("Auto sign-in after signup failed:", signInError);
        throw signInError;
      }

      // After automatic sign-in, try to link profile
      console.log(
        `useAuth: Checking linking conditions - data.user: ${!!data.user}, sessionId: ${sessionId}`
      );

      if (data.user && sessionId) {
        console.log(
          `useAuth: After signup and auto-signin, attempting to link guest profile (session: ${sessionId})`
        );

        // Call linking immediately (no setTimeout to avoid race conditions)
        await linkUserProfile(data.user.id, sessionId);
      } else {
        console.log(
          "useAuth: Skipping profile linking - no user or no sessionId"
        );
      }
    } catch (error: any) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${origin}/auth/callback`,
          scopes: "openid profile email",
        },
      });

      if (error) {
        console.error("LinkedIn sign in error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to sign in with LinkedIn:", error);
      throw error;
    }
  };

  // Guest session management functions
  const getGuestSessionId = (): string | null => {
    return localStorage.getItem("guest_session_id");
  };

  const setGuestSessionId = (sessionId: string): void => {
    localStorage.setItem("guest_session_id", sessionId);
  };

  const clearGuestData = (): void => {
    localStorage.removeItem("guest_session_id");
    localStorage.removeItem("guest_selected_message");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithLinkedIn,
        linkUserProfile,
        getGuestSessionId,
        setGuestSessionId,
        clearGuestData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
