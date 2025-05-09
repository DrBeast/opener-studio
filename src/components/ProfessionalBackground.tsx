
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface ProfessionalBackgroundProps {
  linkedinContent: string;
  setLinkedinContent: (value: string) => void;
  additionalDetails: string;
  setAdditionalDetails: (value: string) => void;
  isSubmitting: boolean;
}

const ProfessionalBackground = ({
  linkedinContent,
  setLinkedinContent,
  additionalDetails,
  setAdditionalDetails,
  isSubmitting
}: ProfessionalBackgroundProps) => {
  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 p-6 rounded-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">LinkedIn Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box below.
              This will help us understand your professional background better.
            </p>
            <Textarea
              placeholder="Paste your LinkedIn profile content here..."
              className="min-h-[200px] w-full"
              value={linkedinContent}
              onChange={(e) => setLinkedinContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>
      
      <Card className="bg-primary/5 p-6 rounded-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Additional Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add any additional details about your professional background, specific strengths, 
              or key successes that might not be captured in your LinkedIn profile.
            </p>
            <Textarea
              placeholder="Tell us more about your professional stories, specific strengths, or key successes..."
              className="min-h-[200px] w-full"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfessionalBackground;
