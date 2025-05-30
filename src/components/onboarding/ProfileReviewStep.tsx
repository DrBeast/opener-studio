
import { CheckCircle, User } from "lucide-react";
import { Background } from "@/types/profile";

interface ProfileReviewStepProps {
  backgroundSummary: Background | null;
}

export const ProfileReviewStep = ({ backgroundSummary }: ProfileReviewStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Welcome to ConnectorAI!</h3>
        <p className="text-muted-foreground">
          Let's get you set up to start building meaningful professional connections.
        </p>
      </div>

      {backgroundSummary && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Profile Already Generated</span>
          </div>
          <p className="text-sm text-green-700 mb-2">
            {backgroundSummary.overall_blurb?.substring(0, 150)}...
          </p>
          <p className="text-xs text-green-600">
            You can edit this later in your profile section.
          </p>
        </div>
      )}
    </div>
  );
};
