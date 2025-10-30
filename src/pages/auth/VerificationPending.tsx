import { useLocation } from "react-router-dom";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/airtable-ds/card";
import { Alert, AlertDescription } from "@/components/ui/airtable-ds/alert";

const VerificationPending = () => {
  const location = useLocation();
  // Optional: get email from navigation state
  const email = (location.state as { email?: string })?.email;

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-4">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{" "}
            {email && <span className="font-medium">{email}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Click the verification link in the email to activate your
                account and start using Opener Studio.
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Didn't receive the email?</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes - it may take time to arrive</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4">
            You can close this page - the verification link will work from your
            email
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationPending;
