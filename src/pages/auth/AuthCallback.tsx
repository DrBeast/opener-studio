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
  const [isLinkingComplete, setIsLinkingComplete] = useState(false);

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

        // Check if there's a guest session to link (will be handled in separate useEffect)
        const sessionId = localStorage.getItem("guest_session_id");
        if (sessionId) {
          console.log(
            `AuthCallback: Found guest session ${sessionId}, will be linked separately`
          );
        }

        // LinkedIn auth is no longer supported - removed to prevent duplicate profile creation
        toast.success("Successfully logged in");

        // Only navigate to pipeline after linking is complete
        if (isLinkingComplete) {
          setRedirectStatus("Redirecting to pipeline...");
          navigate("/pipeline");
        } else {
          setRedirectStatus("Preparing your account...");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Unexpected error during authentication:", errorMessage);
        console.error("Full error details:", err);
        setError(`Unexpected error: ${errorMessage}`);
        setDebugInfo("Please check browser console for more details");
        toast.error("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate("/auth/login"), 5000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Handle guest profile linking in separate useEffect to prevent double execution
  useEffect(() => {
    const handleGuestLinking = async () => {
      const sessionId = localStorage.getItem("guest_session_id");
      if (!sessionId) {
        // No guest session, linking is complete
        setIsLinkingComplete(true);
        return;
      }

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // No user, linking is complete
        setIsLinkingComplete(true);
        return;
      }

      const user = session.user;
      console.log(
        `AuthCallback: Found session ID ${sessionId}, attempting to link guest profile to user ${user.id}`
      );
      setRedirectStatus("Linking your guest profile...");

      try {
        // Check if already linked
        const linkStatusKey = `linked-profile-${sessionId}-${user.id}`;
        const alreadyLinked = localStorage.getItem(linkStatusKey);

        if (!alreadyLinked) {
          await linkGuestProfile(user.id, sessionId);
        } else {
          console.log(
            "AuthCallback: Guest profile was already linked for this session and user"
          );
        }
      } catch (linkErr) {
        console.error("Failed to link guest profile:", linkErr);
        toast.error("Failed to link your profile data");
      } finally {
        // Always mark linking as complete, regardless of success/failure
        setIsLinkingComplete(true);
      }
    };

    // Run linking after a short delay to ensure auth is complete
    const timeoutId = setTimeout(handleGuestLinking, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Navigate to pipeline when linking is complete
  useEffect(() => {
    if (isLinkingComplete) {
      setRedirectStatus("Redirecting to pipeline...");
      navigate("/pipeline");
    }
  }, [isLinkingComplete, navigate]);

  // Define the guest profile linking function within the component
  const linkGuestProfile = async (userId: string, sessionId: string) => {
    try {
      console.log(
        `AuthCallback: Attempting to link guest profile for session ${sessionId} to user ${userId}`
      );
      setRedirectStatus("Linking guest profile...");

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

      // Check if anything was actually transferred
      const transferred = data?.transferred;
      const success =
        transferred &&
        (transferred.profile ||
          transferred.summary ||
          transferred.contacts > 0 ||
          transferred.messages > 0);

      if (success) {
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
      } else {
        console.log("AuthCallback: No guest data found to link");
        return false;
      }
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
