import { CheckCircle, User, Award } from "lucide-react";
import { Background } from "@/types/profile";
import EditableSummary from "@/components/profile/EditableSummary";

interface ProfileReviewStepProps {
  backgroundSummary: Background | null;
}

export const ProfileReviewStep = ({
  backgroundSummary,
}: ProfileReviewStepProps) => {
  return (
    <div className="space-y-6">
      {backgroundSummary && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-lg text-purple-800">
              Professional Background
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed text-base">
            {backgroundSummary.overall_blurb}
          </p>
        </div>
      )}
      {backgroundSummary && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-200 border-green-200 p-4 rounded-lg border">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-6 w-6 text-green-600" />
            <span className="font-semibold text-lg text-green-800">
              What you bring to the table
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed text-base">
            {backgroundSummary.value_proposition_summary}
          </p>
        </div>
      )}
    </div>
  );
};
