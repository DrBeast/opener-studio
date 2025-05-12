
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

  // Function to link a guest profile with improved error handling and retry logic
  const linkGuestProfile = async (userId: string) => {
    const sessionId = localStorage.getItem('profile-session-id');
    if (!sessionId) {
      console.log("No session ID found, skipping profile linking");
      return false;
    }
    
    // Create a unique key for this specific user and session
    const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
    const alreadyLinkedData = localStorage.getItem(linkStatusKey);
    
    // Check if already linked, but verify in database too
    if (alreadyLinkedData) {
      try {
        const linked = JSON.parse(alreadyLinkedData);
        if (linked.linked && linked.success) {
          console.log("This profile was previously linked to the current user according to localStorage");
          
          // Double-check in database that the profile was actually linked
          const { data: profileCheck } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (profileCheck) {
            console.log("Confirmed: User profile exists in database");
            return true;
          } else {
            console.log("Profile marked as linked in localStorage but not found in database - will attempt linking again");
            // Continue with linking process
          }
        }
      } catch (e) {
        console.error("Error parsing linked status data:", e);
      }
    }

    console.log(`useAuth: Attempting to link guest profile (session: ${sessionId}) to user: ${userId}`);
    setLinkingInProgress(true);
    
    try {
      // Clear any existing error toasts related to profile linking
      toast.dismiss("profile-linking-error");
      
      // First, check if the user already has a profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        console.log("User already has a profile:", existingProfile);
        
        // Check if it's empty or just has basic info
        const hasContent = existingProfile.linkedin_content || 
                         existingProfile.additional_details || 
                         existingProfile.cv_content;
        
        if (!hasContent) {
          console.log("Existing profile has no content, will proceed with linking guest data");
        } else {
          console.log("Existing profile has content, not overwriting with guest data");
          setLinkingInProgress(false);
          return true;
        }
      }
      
      // Call the edge function to link the profile
      const { data, error } = await supabase.functions.invoke("link_guest_profile", {
        body: { userId, sessionId }
      });

      if (error) {
        console.error("Error linking guest profile:", error);
        // Don't show the error toast here - we'll only show it if all attempts fail
        setLinkingInProgress(false);
        return false;
      }

      if (data?.success) {
        // Mark this session as linked for this specific user
        localStorage.setItem(linkStatusKey, JSON.stringify({
          linked: true,
          timestamp: new Date().toISOString(),
          success: true
        }));
        console.log("Guest profile successfully linked to user account:", data);
        toast.success("Profile successfully linked to your account", { id: "profile-linking-success" });
        
        // Verify the linking was successful
        setTimeout(async () => {
          try {
            const { data: profileCheck } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
              
            if (!profileCheck) {
              console.log("WARNING: Profile linking may have failed - no profile found after linking");
              // Try one more time
              await supabase.functions.invoke("link_guest_profile", {
                body: { userId, sessionId }
              });
            } else {
              console.log("Profile linking verified - profile exists:", profileCheck);
            }
          } catch (e) {
            console.error("Error verifying profile linking:", e);
          }
        }, 1000);
        
        setLinkingInProgress(false);
        return true;
      }
      
      setLinkingInProgress(false);
      return false;
    } catch (err) {
      console.error("Failed to link guest profile:", err);
      // Only show error on final failed attempt (handled by the retries in signUp method)
      setLinkingInProgress(false);
      return false;
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
            console.log("useAuth: Auth state changed to SIGNED_IN, will attempt to link profile");
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
        console.log("useAuth: Successfully signed in, attempting to link guest profile");
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
      // Clear any existing error toasts related to profile linking
      toast.dismiss("profile-linking-error");
      
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

      console.log("useAuth: Successfully signed up, user data:", data.user);
      
      // Sign in automatically after sign up since email verification is disabled
      await signIn(email, password);
      
      // After automatic sign-in, try to link profile with multiple attempts
      if (data.user) {
        console.log("useAuth: After signup and auto-signin, attempting to link guest profile multiple times");
        
        // First attempt
        setTimeout(async () => {
          const linked = await linkGuestProfile(data.user!.id);
          
          // If first attempt fails, try again after a delay
          if (!linked) {
            console.log("useAuth: First profile linking attempt failed, trying again in 1.5 seconds");
            setTimeout(async () => {
              const linked2 = await linkGuestProfile(data.user!.id);
              
              // If second attempt fails, try one more time
              if (!linked2) {
                console.log("useAuth: Second profile linking attempt failed, trying final attempt in 2 seconds");
                setTimeout(async () => {
                  const linked3 = await linkGuestProfile(data.user!.id);
                  
                  // Only show error toast if all attempts have failed
                  if (!linked3) {
                    console.log("useAuth: All profile linking attempts failed");
                    toast.error("Failed to link your profile data", { id: "profile-linking-error" });
                  }
                }, 2000);
              }
            }, 1500);
          }
        }, 1000);
      }
      
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
