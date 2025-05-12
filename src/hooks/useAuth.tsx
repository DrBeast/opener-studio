
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  // Function to link a guest profile
  const linkGuestProfile = async (userId: string) => {
    const sessionId = localStorage.getItem('profile-session-id');
    if (!sessionId) {
      console.log("No session ID found, skipping profile linking");
      return;
    }
    
    // Create a unique key for this specific user and session
    const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
    const alreadyLinked = localStorage.getItem(linkStatusKey);
    
    if (alreadyLinked) {
      console.log("This profile has already been linked to the current user");
      return;
    }

    console.log("Attempting to link guest profile to authenticated user");
    setLinkingInProgress(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("link_guest_profile", {
        body: { userId, sessionId }
      });

      if (error) {
        console.error("Error linking guest profile:", error);
        toast.error("Failed to link your profile data");
        return;
      }

      if (data?.success) {
        // Mark this session as linked for this specific user
        localStorage.setItem(linkStatusKey, JSON.stringify({
          linked: true,
          timestamp: new Date().toISOString(),
          success: true
        }));
        console.log("Guest profile successfully linked to user account");
        toast.success("Profile Linked: Your temporary profile has been linked to your account");
      }
    } catch (err) {
      console.error("Failed to link guest profile:", err);
      toast.error("Failed to link your profile data");
    } finally {
      setLinkingInProgress(false);
    }
  };

  useEffect(() => {
    // Check active session
    const getUser = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Check if there's a guest profile to link
          await linkGuestProfile(session.user.id);
        }
      } catch (error: any) {
        console.error("Authentication check failed:", error);
        toast.error("Authentication check failed");
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle auth state changes
        if (session?.user) {
          setUser(session.user);
          
          // Check if there's a guest profile to link on auth change
          if (event === 'SIGNED_IN') {
            // Add a small delay to ensure database is ready
            setTimeout(async () => {
              await linkGuestProfile(session.user.id);
            }, 500);
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Try to link guest profile immediately after successful sign-in
      if (data.user) {
        setTimeout(async () => {
          await linkGuestProfile(data.user.id);
        }, 500);
      }

      toast.success("Successfully logged in");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      // Sign in automatically after sign up since email verification is disabled
      await signIn(email, password);
      
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully logged out");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const origin = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc", 
        options: {
          redirectTo: `${origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });

      if (error) {
        toast.error(`LinkedIn login failed`);
        throw error;
      }
    } catch (error: any) {
      toast.error(`Failed to sign in with LinkedIn`);
      throw error;
    }
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
