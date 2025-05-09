
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error in auth callback:", error.message);
          setError(error.message);
          toast.error(`Authentication failed: ${error.message}`);
          setTimeout(() => navigate("/auth/login"), 3000);
          return;
        }
        
        if (!data.session) {
          console.error("No session found");
          setError("No session found. Authentication may have failed.");
          toast.error("Authentication failed. Please try again.");
          setTimeout(() => navigate("/auth/login"), 3000);
          return;
        }
        
        console.log("Authentication successful, redirecting to profile");
        toast.success("Successfully logged in");
        
        // If successful, redirect to profile
        navigate("/profile");
      } catch (err: any) {
        console.error("Unexpected error during authentication:", err.message);
        setError(`Unexpected error: ${err.message}`);
        toast.error("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate("/auth/login"), 3000);
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
              <p className="text-sm text-center">
                Redirecting you back to the login page...
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
