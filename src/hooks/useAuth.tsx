
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

  // Simplified function to link a guest profile
  const linkUserProfile = async (userId: string, sessionId: string | null): Promise<boolean> => {
    if (!sessionId) {
      console.log("No session ID found, skipping profile linking");
      return false;
    }
    
    console.log(`useAuth: Attempting to link guest profile (session: ${sessionId}) to user: ${userId}`);
    
    // Create a unique key for this specific user and session
    const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
    const alreadyLinkedData = localStorage.getItem(linkStatusKey);
    
    // Check if already linked
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
          }
        }
      } catch (e) {
        console.error("Error parsing linked status data:", e);
      }
    }
    
    try {
      console.log(`useAuth: Calling link_guest_profile function with userId: ${userId}, sessionId: ${sessionId}`);
      
      // Call the edge function with a single attempt and appropriate timeout
      const { data, error } = await supabase.functions.invoke("link_guest_profile", {
        body: { userId, sessionId }
      });

      if (error) {
        console.error(`useAuth: Error linking guest profile:`, error);
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
        toast.success("Profile successfully linked to your account", {
          id: "profile-linking-success"
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Failed to link guest profile:", err);
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
      
      // Sign in automatically after sign up
      try {
        await signIn(email, password);
      } catch (signInError) {
        console.error("Auto sign-in after signup failed:", signInError);
        throw signInError;
      }
      
      // After automatic sign-in, try to link profile
      if (data.user && sessionId) {
        console.log(`useAuth: After signup and auto-signin, attempting to link guest profile (session: ${sessionId})`);
        
        // Add a single attempt with appropriate delay
        setTimeout(async () => {
          await linkUserProfile(data.user!.id, sessionId);
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
