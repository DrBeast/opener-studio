import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/airtable-ds/card";
import { toast } from "@/components/ui/airtable-ds/sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/airtable-ds/alert";
import { AlertTriangle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [redirectStatus, setRedirectStatus] = useState<string>(
    "Checking authentication..."
  );
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
          setDebugInfo(
            "This could indicate a redirect URL mismatch or LinkedIn configuration issue"
          );
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => navigate("/auth/login"), 5000);
          return;
        }

        // Get the user data
        const user = data.session.user;
        console.log("Authentication successful, user data:", user);

        // Check if there's a temporary profile to link
        setRedirectStatus("Checking for guest profile to link...");
        const sessionId = localStorage.getItem("guest_session_id");

        if (sessionId && user) {
          try {
            console.log(
              `AuthCallback: Found session ID ${sessionId}, attempting to link guest profile to user ${user.id}`
            );
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
                  .from("user_profiles")
                  .select("*")
                  .eq("user_id", user.id)
                  .maybeSingle();

                if (!profileCheck && linkAttempts < 3) {
                  console.log(
                    `AuthCallback: Profile may not be linked after first attempt. Retry #${
                      linkAttempts + 1
                    }`
                  );
                  setLinkAttempts((prev) => prev + 1);
                  await linkGuestProfile(user.id, sessionId);
                }
              }, 1500);
            } else {
              console.log(
                "AuthCallback: Guest profile was already linked for this session and user"
              );
            }
          } catch (linkErr) {
            console.error("Failed to link guest profile:", linkErr);
            toast.error("Failed to link your profile data");
          }
        }

        // LinkedIn auth is no longer supported - removed to prevent duplicate profile creation
        toast.success("Successfully logged in");

        // Always navigate to pipeline after successful authentication
        setRedirectStatus("Redirecting to pipeline...");
        navigate("/pipeline");
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
      console.log(
        `AuthCallback: Attempting to link guest profile for session ${sessionId} to user ${userId}`
      );
      setRedirectStatus(
        `Linking guest profile... (Attempt ${linkAttempts + 1})`
      );

      const { data, error } = await supabase.functions.invoke(
        "link_guest_profile",
        {
          body: { userId, sessionId },
        }
      );

      if (error) {
        console.error("Error linking guest profile:", error);
        toast.error("Failed to link your profile data");
        return false;
      }

      if (data?.success) {
        // Mark this session as linked for this specific user
        const linkStatusKey = `linked-profile-${sessionId}-${userId}`;
        localStorage.setItem(
          linkStatusKey,
          JSON.stringify({
            linked: true,
            timestamp: new Date().toISOString(),
            success: true,
          })
        );
        console.log(
          "AuthCallback: Guest profile successfully linked to user account"
        );
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
              <h2 className="text-xl font-medium text-red-500">
                Authentication Failed
              </h2>
              <p className="text-center text-muted-foreground">{error}</p>
              {debugInfo && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Troubleshooting Information</AlertTitle>
                  <AlertDescription>
                    {debugInfo}
                    <p className="mt-2">
                      Please verify that your LinkedIn App's Redirect URLs
                      include:
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
                {redirectStatus}{" "}
                {linkAttempts > 0 && `(Attempt ${linkAttempts})`}
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
