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
      return false;
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        "link_guest_profile",
        {
          body: { userId, sessionId },
        }
      );

      if (error) {
        console.error("Error linking guest profile:", error);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error("Unexpected error in linkUserProfile:", error);
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
        setUser(session?.user ?? null);
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
      // Safeguard: Clean up all guest-related storage EXCEPT the session ID
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("guest_") && key !== "guest_session_id") {
          localStorage.removeItem(key);
        }
      });
      const sessionId = localStorage.getItem("guest_session_id");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // After signup, user is automatically signed in.
        // Now, link the guest profile
        if (sessionId) {
          await linkUserProfile(data.user.id, sessionId);
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
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
