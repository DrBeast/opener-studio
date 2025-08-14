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

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

const Signup = () => {
  const { signUp } = useAuth();
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
    const storedSessionId = localStorage.getItem("profile-session-id");
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
