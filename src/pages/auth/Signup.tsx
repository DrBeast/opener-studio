import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/airtable-ds/button";
import { Input } from "@/components/ui/airtable-ds/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/airtable-ds/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/airtable-ds/form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/airtable-ds/alert";
import { Linkedin } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Signup = () => {
  const { signUp, signInWithLinkedIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect param - default to pipeline instead of profile
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirectTo") || "/pipeline";

  // Get session ID when component mounts
  useEffect(() => {
    const storedSessionId = localStorage.getItem("guest_session_id");
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
      // Clear any existing toasts
      toast.dismiss("profile-linking-progress");
      toast.dismiss("signup-error");

      // Log session ID for debugging
      console.log(
        `Signup: Starting signup process with session ID: ${
          sessionId || "none"
        }`
      );

      // Perform signup (this will also trigger profile linking internally via useAuth)
      await signUp(data.email, data.password);

      // Show a toast about profile linking if a session ID exists
      if (sessionId) {
        toast.info("Your profile data will be linked to your new account", {
          id: "profile-linking-progress",
          duration: 3000,
        });
      }

      // Redirect after a brief delay to allow for authentication to complete
      setTimeout(() => {
        navigate(redirectTo);
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);

      // Set error message for UI display with more details
      console.error("Signup error:", error);
      setErrorMessage(error.message || "An error occurred during signup");

      // Also show error toast
      toast.error(error.message || "An error occurred during signup", {
        id: "signup-error",
        duration: 5000,
      });

      // Log details for debugging
      if (error.cause) {
        console.error("Error cause:", error.cause);
      }
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

            {sessionId && (
              <div className="text-sm text-blue-600 mb-2">
                A temporary profile was detected and will be linked to your new
                account.
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            {/* LinkedIn Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white font-medium transition-all duration-200"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  await signInWithLinkedIn();
                } catch (error: any) {
                  console.error("LinkedIn sign-up error:", error);
                  toast.error(
                    error.message || "Failed to sign up with LinkedIn"
                  );
                  setIsLoading(false);
                }
              }}
            >
              <Linkedin className="mr-2 h-5 w-5" />
              Sign up with LinkedIn
            </Button>

            {/* Google Sign Up Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-[#4285F4] text-[#4285F4] hover:bg-[#4285F4] hover:text-white font-medium transition-all duration-200"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  await signInWithGoogle();
                } catch (error: any) {
                  console.error("Google sign-up error:", error);
                  toast.error(error.message || "Failed to sign up with Google");
                  setIsLoading(false);
                }
              }}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm w-full text-[hsl(var(--normaltext))]">
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
