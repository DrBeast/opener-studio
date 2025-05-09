
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the session from URL
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error in auth callback:", error.message);
        navigate("/auth/login");
        return;
      }
      
      // If successful, redirect to profile
      navigate("/profile");
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <h2 className="text-xl font-medium">Logging you in...</h2>
          <p className="text-center text-muted-foreground">
            Please wait while we complete the authentication process.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
