
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Linkedin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Signup = () => {
  const { signUp, signInWithLinkedIn, linkUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for redirect param
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirectTo') || '/profile';

  // Get session ID when component mounts
  useEffect(() => {
    const storedSessionId = localStorage.getItem('profile-session-id');
    if (storedSessionId) {
      console.log("Signup: Found existing session ID:", storedSessionId);
      setSessionId(storedSessionId);
    } else {
      console.log("Signup: No session ID found in localStorage");
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Dismiss any existing toast messages for clean UX
      toast.dismiss("profile-linking-success");
      toast.dismiss("signup-error");
      
      // Log that we're starting signup with session ID (if any)
      console.log(`Signup: Starting signup process with session ID: ${sessionId || "none"}`);
      
      await signUp(data.email, data.password);
      
      // Check if there's a guest profile to link and show appropriate message
      if (sessionId) {
        toast.info("Linking your profile data...", { id: "profile-linking-progress" });
        console.log("Signup: User signed up, waiting to ensure profile linking has time to complete");
        
        // Get the current user data
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Make an explicit attempt to link the profile after signup success
          console.log("Signup: Making direct profile linking attempt with session ID:", sessionId);
          
          // Add a substantial delay to ensure auth is fully initialized
          setTimeout(async () => {
            try {
              const linkSuccess = await linkUserProfile(session.user.id, sessionId);
              
              if (linkSuccess) {
                toast.dismiss("profile-linking-progress");
                toast.success("Your profile data was successfully linked to your account", { 
                  id: "profile-linking-success",
                  duration: 5000
                });
              } else {
                // If linking fails, make one more attempt
                console.log("Signup: First direct linking attempt failed, trying again");
                setTimeout(async () => {
                  const secondAttempt = await linkUserProfile(session.user.id, sessionId);
                  
                  if (secondAttempt) {
                    toast.dismiss("profile-linking-progress");
                    toast.success("Your profile data was successfully linked to your account", { 
                      id: "profile-linking-success",
                      duration: 5000
                    });
                  } else {
                    toast.dismiss("profile-linking-progress"); 
                    toast.error("Unable to link your profile data. Please try again from your profile page.", {
                      id: "profile-linking-error",
                      duration: 5000
                    });
                  }
                  
                  // Redirect after a short delay to ensure toast is seen
                  setTimeout(() => {
                    navigate(redirectTo);
                  }, 1500);
                }, 2000);
              }
            } catch (err) {
              console.error("Signup: Error in explicit profile linking attempt:", err);
              toast.dismiss("profile-linking-progress");
              toast.error("Unable to link your profile data. Please try again from your profile page.", {
                id: "profile-linking-error",
                duration: 5000
              });
              
              // Redirect despite error
              setTimeout(() => {
                navigate(redirectTo);
              }, 1500);
            }
          }, 2000);
        } else {
          toast.dismiss("profile-linking-progress");
          toast.error("Unable to link your profile. Please try again from your profile page.", {
            id: "profile-linking-error",
            duration: 5000
          });
          
          // Redirect despite error
          setTimeout(() => {
            navigate(redirectTo);
          }, 1500);
        }
      } else {
        // Redirect to profile page after successful signup
        navigate(redirectTo);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast.dismiss("profile-linking-progress");
      
      // Set error message for UI display with more details
      console.error("Signup error:", error);
      setErrorMessage(error.message || "An error occurred during signup");
      
      // Also show error toast
      toast.error(error.message || "An error occurred during signup", {
        id: "signup-error",
        duration: 5000
      });
      
      // Log details for debugging
      if (error.cause) {
        console.error("Error cause:", error.cause);
      }
    }
  };

  const handleLinkedInSignIn = async () => {
    setErrorMessage(null);
    try {
      await signInWithLinkedIn();
      // Redirect happens automatically
    } catch (error: any) {
      console.error("LinkedIn signin error:", error);
      setErrorMessage(error.message || "An error occurred during LinkedIn sign-in");
      toast.error(error.message || "An error occurred during LinkedIn sign-in", {
        id: "linkedin-error",
        duration: 5000
      });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>
            Create an account to get started with EngageAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          
            <Button 
              variant="outline" 
              className="w-full" 
              type="button" 
              onClick={handleLinkedInSignIn}
              disabled={isLoading}
            >
              <Linkedin className="mr-2 h-4 w-4" />
              Continue with LinkedIn
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {sessionId && (
              <div className="text-sm text-blue-600 mb-2">
                A temporary profile was detected and will be linked to your new account.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="you@example.com" 
                          type="email" 
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••••" 
                          type="password" 
                          disabled={isLoading} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
