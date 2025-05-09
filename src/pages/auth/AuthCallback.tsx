
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
          console.log("LinkedIn user metadata:", user.user_metadata);
          
          try {
            // Check if the user already has a profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
              console.error("Error checking profile:", profileError);
            }
            
            // If no profile exists or profile fields are empty, update with LinkedIn data
            if (!profileData || (!profileData.first_name && !profileData.last_name)) {
              const firstName = user.user_metadata.name?.split(' ')[0] || 
                                user.user_metadata.full_name?.split(' ')[0] || 
                                user.user_metadata.first_name || '';
                                
              const lastName = user.user_metadata.name?.split(' ').slice(1).join(' ') || 
                              user.user_metadata.full_name?.split(' ').slice(1).join(' ') || 
                              user.user_metadata.last_name || '';
              
              if (firstName || lastName) {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .upsert({
                    id: user.id,
                    first_name: firstName,
                    last_name: lastName,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'id' });
                
                if (updateError) {
                  console.error("Error updating profile with LinkedIn data:", updateError);
                } else {
                  console.log("Profile updated with LinkedIn data");
                }
              }
            }
          } catch (profileErr) {
            console.error("Error processing profile data:", profileErr);
          }
        }
        
        console.log("Authentication successful, redirecting to profile");
        toast.success("Successfully logged in");
        
        // If successful, redirect to profile
        navigate("/profile");
      } catch (err: any) {
        console.error("Unexpected error during authentication:", err.message);
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
                Please wait while we complete the authentication process.
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
