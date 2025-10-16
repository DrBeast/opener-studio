import { Link } from "react-router-dom";
import { Button } from "@/components/ui/airtable-ds/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/airtable-ds/card";

const VerificationPending = () => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a verification email. Please check your inbox and
            click on the verification link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-primary"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-[hsl(var(--normaltext))]">
              Once you verify your email, you'll be able to log in to your
              account.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link to="/auth/login">Return to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerificationPending;
