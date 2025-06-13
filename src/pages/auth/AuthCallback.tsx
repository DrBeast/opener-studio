
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [redirectStatus, setRedirectStatus] = useState<string>("Checking authentication...");
  const [linkAttempts, setLinkAttempts] = useState(0);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback triggered");
        
        // Get the URL parameters
        const hashParams = window.location.hash;
        const queryParams = window.location.search;
        
        // Log the parameters for debugging (not including sensitive info)
        if (hashParams) {
          console.log("Hash parameters present");
          setDebugInfo("Authentication flow is using URL hash parameters");
        }
        
        if (queryParams) {
          console.log("Query parameters present");
          setDebugInfo("Authentication flow is using URL query parameters");
        }
        
        // Get the session from URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error in auth callback:", error.message);
          setError(`Authentication failed: ${error.message}`);
          toast.error(`Authentication failed: ${error.message}`);
          setTimeout(() => navigate("/auth/login"), 5000);
          return;
        }
        
        if (!data.session) {
          console.error("No session found");
          setError("No session found. Authentication may have failed.");
          setDebugInfo("This could indicate a redirect URL mismatch or LinkedIn configuration issue");
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => navigate("/auth/login"), 5000);
          return;
        }
        
        // Get the user data
        const user = data.session.user;
        console.log("Authentication successful, user data:", user);
        
        // Check if there's a temporary profile to link
        setRedirectStatus("Checking for guest profile to link...");
        const sessionId = localStorage.getItem('profile-session-id');
        
        if (sessionId && user) {
          try {
            console.log(`AuthCallback: Found session ID ${sessionId}, attempting to link guest profile to user ${user.id}`);
            setRedirectStatus("Linking your guest profile...");
            
            // Important: Create a linkStatusKey unique to this user and session
            const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
            const alreadyLinked = localStorage.getItem(linkStatusKey);
            
            if (!alreadyLinked) {
              // First link attempt
              await linkGuestProfile(user.id, sessionId);
              
              // If first attempt appears to fail (we'll check again below), try a few more times
              setTimeout(async () => {
                // Check if the profile was linked
                const { data: profileCheck } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('user_id', user.id)
                  .maybeSingle();
                  
                if (!profileCheck && linkAttempts < 3) {
                  console.log(`AuthCallback: Profile may not be linked after first attempt. Retry #${linkAttempts + 1}`);
                  setLinkAttempts(prev => prev + 1);
                  await linkGuestProfile(user.id, sessionId);
                }
              }, 1500);
            } else {
              console.log("AuthCallback: Guest profile was already linked for this session and user");
            }
          } catch (linkErr) {
            console.error("Failed to link guest profile:", linkErr);
            toast.error("Failed to link your profile data");
          }
        }
        
        // Check for LinkedIn data in user metadata
        if (user.app_metadata.provider === 'linkedin_oidc' && user.user_metadata) {
          console.log("LinkedIn user detected, metadata structure:", JSON.stringify(user.user_metadata, null, 2));
          setRedirectStatus("Processing LinkedIn data...");
          
          try {
            // Check if the user already has a profile in user_profiles table
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (profileError) {
              if (profileError.code === 'PGRST116') {
                console.log("No profile found for user, will create one");
              } else {
                console.error("Error checking profile:", profileError);
                toast.error("Error checking profile status");
              }
            }
            
            // We'll update the profile even if it exists but has empty name fields
            const shouldUpdateProfile = !profileData || (!profileData.first_name && !profileData.last_name);
            
            if (shouldUpdateProfile) {
              setRedirectStatus("Creating your profile...");
              
              // Try multiple potential field names that LinkedIn might provide
              const firstName = 
                user.user_metadata.given_name || 
                user.user_metadata.first_name || 
                user.user_metadata.name?.split(' ')[0] || 
                user.user_metadata.full_name?.split(' ')[0] || 
                '';
                                
              const lastName = 
                user.user_metadata.family_name || 
                user.user_metadata.last_name || 
                user.user_metadata.name?.split(' ').slice(1).join(' ') || 
                user.user_metadata.full_name?.split(' ').slice(1).join(' ') || 
                '';
              
              console.log(`Extracted name data from LinkedIn - First: "${firstName}", Last: "${lastName}"`);
              
              if (firstName || lastName) {
                console.log("Updating profile with name data");
                const profileUpdate = {
                  user_id: user.id,
                  first_name: firstName,
                  last_name: lastName,
                  updated_at: new Date().toISOString()
                };
                
                console.log("Profile update payload:", profileUpdate);
                
                const { error: updateError } = await supabase
                  .from('user_profiles')
                  .upsert(profileUpdate, { onConflict: 'user_id' });
                
                if (updateError) {
                  console.error("Error updating profile with LinkedIn data:", updateError);
                  console.error("Full error details:", JSON.stringify(updateError, null, 2));
                  toast.error("Failed to update profile with LinkedIn data");
                  
                  // Try to provide more specific error information
                  if (updateError.code === '42501') {
                    setDebugInfo("Permission denied. This may be due to Row Level Security (RLS) policies.");
                  } else if (updateError.code === '23505') {
                    setDebugInfo("Duplicate key violation. The profile may already exist.");
                  }
                } else {
                  console.log("Profile updated with LinkedIn data successfully");
                  toast.success("Profile updated with your LinkedIn information");
                }
              } else {
                console.log("No name data available from LinkedIn metadata");
                toast.warning("Could not extract name from your LinkedIn profile");
              }
            } else {
              console.log("User already has profile data, not overwriting");
            }
          } catch (profileErr: any) {
            console.error("Error processing profile data:", profileErr.message);
            console.error("Full error details:", JSON.stringify(profileErr, null, 2));
            toast.error("Error processing profile data");
          }
        } else {
          // Not a LinkedIn user
          toast.success("Successfully logged in");
        }
        
        // Always navigate to dashboard after successful authentication
        setRedirectStatus("Redirecting to dashboard...");
        navigate("/dashboard");
        
      } catch (err: any) {
        console.error("Unexpected error during authentication:", err.message);
        console.error("Full error details:", err);
        setError(`Unexpected error: ${err.message}`);
        setDebugInfo("Please check browser console for more details");
        toast.error("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate("/auth/login"), 5000);
      }
    };

    handleAuthCallback();
  }, [navigate, linkAttempts]);

  // Define the guest profile linking function within the component
  const linkGuestProfile = async (userId: string, sessionId: string) => {
    try {
      console.log(`AuthCallback: Attempting to link guest profile for session ${sessionId} to user ${userId}`);
      setRedirectStatus(`Linking guest profile... (Attempt ${linkAttempts + 1})`);
      
      const { data, error } = await supabase.functions.invoke("link_guest_profile", {
        body: { userId, sessionId }
      });

      if (error) {
        console.error("Error linking guest profile:", error);
        toast.error("Failed to link your profile data");
        return false;
      }

      if (data?.success) {
        // Mark this session as linked for this specific user
        const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
        localStorage.setItem(linkStatusKey, JSON.stringify({
          linked: true,
          timestamp: new Date().toISOString(),
          success: true
        }));
        console.log("AuthCallback: Guest profile successfully linked to user account");
        toast.success("Your profile data has been saved to your account");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to link guest profile:", err);
      toast.error("Failed to link your profile data");
      return false;
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {error ? (
            <>
              <div className="text-red-500 rounded-full h-12 w-12 flex items-center justify-center border-2 border-red-500">
                ⚠️
              </div>
              <h2 className="text-xl font-medium text-red-500">Authentication Failed</h2>
              <p className="text-center text-muted-foreground">
                {error}
              </p>
              {debugInfo && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Troubleshooting Information</AlertTitle>
                  <AlertDescription>
                    {debugInfo}
                    <p className="mt-2">
                      Please verify that your LinkedIn App's Redirect URLs include:
                      <code className="block bg-gray-100 p-1 mt-1 rounded text-sm">
                        {window.location.origin}/auth/callback
                      </code>
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-center">
                Redirecting you back to the login page in 5 seconds...
              </p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <h2 className="text-xl font-medium">Logging you in...</h2>
              <p className="text-center text-muted-foreground">
                {redirectStatus} {linkAttempts > 0 && `(Attempt ${linkAttempts})`}
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
