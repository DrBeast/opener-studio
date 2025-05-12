
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
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Signup = () => {
  const { signUp, signInWithLinkedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
    try {
      // Clear any previous linking error messages
      toast.dismiss("profile-linking-error");
      
      // Log that we're starting signup with session ID (if any)
      console.log(`Signup: Starting signup process with session ID: ${sessionId || "none"}`);
      
      await signUp(data.email, data.password);
      
      // Check if there's a guest profile to link and show appropriate message
      if (sessionId) {
        toast.info("Linking your profile data...");
        console.log("Signup: User signed up, waiting to ensure profile linking has time to complete");
        
        // Add a more substantial delay to ensure profile linking has time to complete
        setTimeout(() => {
          // Verify if the profile was actually linked
          const verifyLinking = async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session?.user) {
                // Check if a proper user profile exists
                const { data: profileData } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();
                  
                if (profileData) {
                  console.log("Signup: Profile successfully linked:", profileData);
                  toast.success("Your profile data was successfully linked to your account");
                } else {
                  console.log("Signup: Profile linking verification check - no profile found");
                  
                  // One last attempt to ensure profile is linked
                  try {
                    console.log("Signup: Making final attempt to link profile");
                    const { error: linkError } = await supabase.functions.invoke("link_guest_profile", {
                      body: { userId: session.user.id, sessionId }
                    });
                    
                    if (linkError) {
                      console.error("Signup: Final linking attempt failed:", linkError);
                      // Only show error on final attempt
                      toast.warning("Profile linking may have experienced issues. Your account was created successfully, but you may need to enter your profile information again.", { 
                        duration: 6000,
                        id: "profile-linking-error" 
                      });
                    } else {
                      toast.success("Your profile data was successfully linked to your account");
                    }
                  } catch (err) {
                    console.error("Signup: Error in final linking attempt:", err);
                  }
                }
              }
            } catch (err) {
              console.error("Signup: Error verifying profile linking:", err);
            }
            
            // Redirect regardless of verification result
            navigate(redirectTo);
          };
          
          verifyLinking();
        }, 3000); // Longer delay to ensure linking completes
      } else {
        // Redirect to profile page after successful signup
        navigate(redirectTo);
      }
    } catch (error) {
      // Error is handled in the useAuth hook
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      await signInWithLinkedIn();
      // Redirect happens automatically
    } catch (error) {
      // Error is handled in the useAuth hook
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
