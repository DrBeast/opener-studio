
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface ProfessionalBackgroundProps {
  linkedinContent: string;
  setLinkedinContent: (value: string) => void;
  additionalDetails: string;
  setAdditionalDetails: (value: string) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  existingData?: {
    linkedin?: string;
    additional?: string;
    cv?: { name: string; url: string };
  };
}

const ProfessionalBackground = ({
  linkedinContent,
  setLinkedinContent,
  additionalDetails,
  setAdditionalDetails,
  isSubmitting,
  isEditing = false,
  existingData = {}
}: ProfessionalBackgroundProps) => {
  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 p-6 rounded-lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">LinkedIn Profile</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isEditing && existingData.linkedin 
                ? "Update your LinkedIn profile information or add more details below."
                : "Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it into the text box below. This will help us understand your professional background better."
              }
            </p>
            
            {isEditing && existingData.linkedin && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                <p>Your current LinkedIn content is shown below. You can keep it as is or update it.</p>
              </div>
            )}
            
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
              {isEditing && existingData.additional
                ? "Update or add to your additional professional details below."
                : "Add any additional details about your professional background, specific strengths, or key successes that might not be captured in your LinkedIn profile."
              }
            </p>
            
            {isEditing && existingData.additional && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                <p>Your current additional details are shown below. You can keep them as is or update them.</p>
              </div>
            )}
            
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
