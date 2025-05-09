
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
        
        // Check for LinkedIn data in user metadata
        const user = data.session.user;
        console.log("Authentication successful, user data:", user);
        
        // Check if we need to update the profile with LinkedIn data
        if (user.app_metadata.provider === 'linkedin_oidc' && user.user_metadata) {
          console.log("LinkedIn user detected, metadata structure:", JSON.stringify(user.user_metadata, null, 2));
          setRedirectStatus("Processing LinkedIn data...");
          
          try {
            // Check if the user already has a profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
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
                  id: user.id,
                  first_name: firstName,
                  last_name: lastName,
                  updated_at: new Date().toISOString()
                };
                
                console.log("Profile update payload:", profileUpdate);
                
                const { error: updateError } = await supabase
                  .from('profiles')
                  .upsert(profileUpdate, { onConflict: 'id' });
                
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

            // Check for user data completion status to determine redirect
            setRedirectStatus("Checking profile completion...");
            
            try {
              // Get all user background data first
              const { data: backgroundData, error: backgroundError } = await supabase
                .from('user_backgrounds')
                .select('*')
                .eq('user_id', user.id);
                
              if (backgroundError) {
                console.error("Error checking background data:", backgroundError);
                toast.error("Error checking profile completion");
                navigate("/profile");
                return;
              }
              
              // Get target criteria data
              const { data: targetData, error: targetError } = await supabase
                .from('target_criteria')
                .select('*')
                .eq('user_id', user.id);
                
              if (targetError) {
                console.error("Error checking target criteria:", targetError);
              }
              
              // Determine best path based on profile completion
              const hasBackground = backgroundData && backgroundData.length > 0;
              const hasTargets = targetData && targetData.length > 0;
              
              setRedirectStatus("Redirecting you to the appropriate page...");
              
              // Decision logic for redirection:
              if (!hasBackground) {
                // If user doesn't have background data, redirect to enrichment page
                console.log("User needs to complete profile enrichment");
                navigate("/profile/enrich");
              } else if (!hasTargets) {
                // If user has background but no targets, redirect to job targets
                console.log("User needs to complete job targets");
                navigate("/profile/job-targets");
              } else {
                // User has completed both sections, redirect to profile
                console.log("User profile is complete, redirecting to profile");
                navigate("/profile");
              }
            } catch (err: any) {
              console.error("Error in redirect logic:", err.message);
              navigate("/profile");
            }
            
          } catch (profileErr: any) {
            console.error("Error processing profile data:", profileErr.message);
            console.error("Full error details:", JSON.stringify(profileErr, null, 2));
            toast.error("Error processing profile data");
            navigate("/profile/enrich"); // Still redirect to enrichment on error
          }
        } else {
          // Not a LinkedIn user, use same logic for redirection
          setRedirectStatus("Checking profile completion...");
          toast.success("Successfully logged in");
          
          try {
            // Get all user background data
            const { data: backgroundData, error: backgroundError } = await supabase
              .from('user_backgrounds')
              .select('*')
              .eq('user_id', user.id);
              
            if (backgroundError) {
              console.error("Error checking background data:", backgroundError);
            }
            
            // Get target criteria data
            const { data: targetData, error: targetError } = await supabase
              .from('target_criteria')
              .select('*')
              .eq('user_id', user.id);
              
            if (targetError) {
              console.error("Error checking target criteria:", targetError);
            }
            
            // Determine best path based on profile completion
            const hasBackground = backgroundData && backgroundData.length > 0;
            const hasTargets = targetData && targetData.length > 0;
            
            setRedirectStatus("Redirecting you to the appropriate page...");
            
            if (!hasBackground) {
              // If user doesn't have background data, redirect to enrichment page
              console.log("User needs to complete profile enrichment");
              navigate("/profile/enrich");
            } else if (!hasTargets) {
              // If user has background but no targets, redirect to job targets
              console.log("User needs to complete job targets");
              navigate("/profile/job-targets");
            } else {
              // User has completed both sections, redirect to profile
              console.log("User profile is complete, redirecting to profile");
              navigate("/profile");
            }
          } catch (err: any) {
            console.error("Unexpected error determining user status:", err.message);
            navigate("/profile");
          }
        }
        
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
  }, [navigate]);

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
                {redirectStatus}
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
