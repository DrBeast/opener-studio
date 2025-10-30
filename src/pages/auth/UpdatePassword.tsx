import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { VALIDATION_LIMITS } from "@/lib/validation-constants";

const formSchema = z
  .object({
    password: z.string().min(VALIDATION_LIMITS.MIN_CHARS_PASSWORD, {
      message: `Password must be at least ${VALIDATION_LIMITS.MIN_CHARS_PASSWORD} characters`,
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const UpdatePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        navigate("/auth/forgot-password");
        return;
      }

      setIsValidSession(true);
    };

    checkSession();
  }, [navigate]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsPasswordUpdated(true);
      toast.success("Password updated successfully!");

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pb-6 pt-6">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-[hsl(var(--normaltext))]">
                  Verifying reset link...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isPasswordUpdated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-[hsl(var(--normaltext))]">
                Password Updated!
              </CardTitle>
              <CardDescription className="text-center text-[hsl(var(--normaltext))]">
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-[hsl(var(--normaltext))]">
                  You can now sign in with your new password.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <Button
                onClick={() => navigate("/auth/login")}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
            Set New Password
          </h1>
          <p className="text-[hsl(var(--normaltext))]">
            Enter your new password below
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-[hsl(var(--normaltext))]">
              Update Password
            </CardTitle>
            <CardDescription className="text-center text-[hsl(var(--normaltext))]">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(var(--normaltext))] font-medium">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--normaltext))]" />
                          <Input
                            placeholder="••••••••"
                            type="password"
                            disabled={isLoading}
                            className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(var(--normaltext))] font-medium">
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--normaltext))]" />
                          <Input
                            placeholder="••••••••"
                            type="password"
                            disabled={isLoading}
                            className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <Button
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm text-[hsl(var(--normaltext))]">
              Remember your password?{" "}
              <Link
                to="/auth/login"
                className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
              >
                Sign in instead
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-sm text-[hsl(var(--normaltext))]">
            Secure password update powered by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
