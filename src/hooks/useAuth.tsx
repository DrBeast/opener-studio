
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  linkUserProfile: (userId: string, sessionId: string | null) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingInProgress, setLinkingInProgress] = useState(false);

  // Function to link a guest profile with improved error handling and retry logic
  const linkUserProfile = async (userId: string, sessionId: string | null): Promise<boolean> => {
    if (!sessionId) {
      console.log("No session ID found, skipping profile linking");
      return false;
    }
    
    console.log(`useAuth: Attempting to link guest profile (session: ${sessionId}) to user: ${userId}`);
    setLinkingInProgress(true);
    
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
            setLinkingInProgress(false);
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
    
    try {
      // Add more logging to track the linking process
      console.log(`useAuth: Calling link_guest_profile function with userId: ${userId}, sessionId: ${sessionId}`);
      
      // Call the edge function to link the profile with retries
      let attempts = 0;
      let success = false;
      let finalData = null;
      
      while (!success && attempts < 3) {
        attempts++;
        try {
          const { data, error } = await supabase.functions.invoke("link_guest_profile", {
            body: { userId, sessionId }
          });
  
          if (error) {
            console.error(`useAuth: Error linking guest profile (attempt ${attempts}):`, error);
            
            if (attempts < 3) {
              console.log(`useAuth: Waiting 500ms before retry ${attempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else {
            console.log(`useAuth: Successfully linked profile on attempt ${attempts}:`, data);
            success = true;
            finalData = data;
            break;
          }
        } catch (err) {
          console.error(`useAuth: Failed to link guest profile (attempt ${attempts}):`, err);
          
          if (attempts < 3) {
            console.log(`useAuth: Waiting 500ms before retry ${attempts + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (success && finalData?.success) {
        // Mark this session as linked for this specific user
        localStorage.setItem(linkStatusKey, JSON.stringify({
          linked: true,
          timestamp: new Date().toISOString(),
          success: true,
          attempts
        }));
        console.log("Guest profile successfully linked to user account:", finalData);
        
        // Verify the linking was successful
        try {
          const { data: profileCheck } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!profileCheck) {
            console.log("WARNING: Profile linking may have failed - no profile found after linking");
            toast.error("Failed to link your profile. Some of your data may not be available.", {
              id: "profile-linking-error",
              duration: 5000
            });
          } else {
            console.log("Profile linking verified - profile exists:", profileCheck);
            toast.success("Profile successfully linked to your account", {
              id: "profile-linking-success"
            });
          }
        } catch (e) {
          console.error("Error verifying profile linking:", e);
        }
        
        setLinkingInProgress(false);
        return true;
      }
      
      setLinkingInProgress(false);
      return false;
    } catch (err) {
      console.error("Failed to link guest profile:", err);
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
          const sessionId = localStorage.getItem('profile-session-id');
          if (sessionId) {
            await linkUserProfile(session.user.id, sessionId);
          }
        }
      } catch (error: any) {
        console.error("Authentication check failed:", error);
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
            const sessionId = localStorage.getItem('profile-session-id');
            if (sessionId) {
              // Add a small delay to ensure database is ready
              setTimeout(async () => {
                await linkUserProfile(session.user.id, sessionId);
              }, 500);
            }
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
        console.error("Sign in error:", error);
        throw error;
      }

      // Try to link guest profile immediately after successful sign-in
      if (data.user) {
        console.log("useAuth: Successfully signed in, attempting to link guest profile");
        const sessionId = localStorage.getItem('profile-session-id');
        if (sessionId) {
          setTimeout(async () => {
            await linkUserProfile(data.user.id, sessionId);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error("Sign in failed:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Beginning signup process with email:", email);
      const sessionId = localStorage.getItem('profile-session-id');
      console.log("Current session ID during signup:", sessionId);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      console.log("useAuth: Successfully signed up, user data:", data.user);
      
      // Sign in automatically after sign up since email verification is disabled
      try {
        await signIn(email, password);
      } catch (signInError) {
        console.error("Auto sign-in after signup failed:", signInError);
        throw signInError;
      }
      
      // After automatic sign-in, try to link profile
      if (data.user && sessionId) {
        console.log(`useAuth: After signup and auto-signin, attempting to link guest profile (session: ${sessionId})`);
        
        // First attempt with delay to ensure auth is ready
        setTimeout(async () => {
          const linked = await linkUserProfile(data.user!.id, sessionId);
          
          // If first attempt fails, try again after a longer delay
          if (!linked) {
            console.log("useAuth: First profile linking attempt failed, trying again in 1.5 seconds");
            setTimeout(async () => {
              const linked2 = await linkUserProfile(data.user!.id, sessionId);
              
              // If second attempt fails, try one more time
              if (!linked2) {
                console.log("useAuth: Second profile linking attempt failed, trying final attempt in 2 seconds");
                setTimeout(async () => {
                  await linkUserProfile(data.user!.id, sessionId);
                }, 2000);
              }
            }, 1500);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error("Sign up failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error("Failed to sign out:", error);
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
        console.error("LinkedIn sign in error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Failed to sign in with LinkedIn:", error);
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
        linkUserProfile
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
