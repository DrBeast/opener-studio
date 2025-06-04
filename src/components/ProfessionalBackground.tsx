
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InfoBox } from "@/components/ui/design-system";

interface ProfessionalBackgroundProps {
  backgroundInput: string;
  setBackgroundInput: (value: string) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  existingData?: {
    background?: string;
    linkedin?: string;
    additional?: string;
    cv?: string;
  };
}

const ProfessionalBackground = ({
  backgroundInput,
  setBackgroundInput,
  isSubmitting,
  isEditing = false,
  existingData = {}
}: ProfessionalBackgroundProps) => {
  // If editing and backgroundInput is empty, try to populate from existing data
  const [initialValue] = useState(() => {
    if (isEditing && !backgroundInput) {
      // Combine existing data if available for backward compatibility
      const combinedExisting = [
        existingData.background,
        existingData.linkedin && `LinkedIn Profile:\n${existingData.linkedin}`,
        existingData.cv && `CV Content:\n${existingData.cv}`,
        existingData.additional && `Additional Details:\n${existingData.additional}`
      ].filter(Boolean).join('\n\n');
      
      return combinedExisting || backgroundInput;
    }
    return backgroundInput;
  });

  // Use the initial value if backgroundInput is empty
  const displayValue = backgroundInput || initialValue;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="background-input" className="text-lg font-semibold">
          Professional Background
        </Label>
        <p className="text-sm text-[hsl(var(--normaltext))] mt-1">
          {isEditing 
            ? "Update your professional background information. This will be used to regenerate your AI profile summary."
            : "Share your professional background information to generate your AI profile summary."
          }
        </p>
      </div>

      <InfoBox
        title="💡 How to add your background information"
        description="Copy your LinkedIn profile, CV content, or professional information to help AI create your profile summary."
        badges={["LinkedIn Profile", "CV/Resume", "Professional Bio"]}
      >
        <div className="space-y-2">
          <p><strong>LinkedIn Profile:</strong> Go to your LinkedIn profile, select everything (CMD/CTRL + A) and copy it (CMD/CTRL + C) into the text box below (CMD/CTRL + V). Don't worry about formatting, just copy everything - AI will figure it out.</p>
          <p><strong>CV/Resume:</strong> Copy your CV contents (CMD/CTRL + A) and paste it (CMD/CTRL + V) into the text box below. Don't worry about formatting.</p>
          <p><strong>Professional Information:</strong> Write about your bio, education, key skills, success stories, achievements, or any other professional information.</p>
          <p className="font-medium">The AI analyzes your background to highlight your value proposition for specific roles and companies, helping you articulate how you can add value in your networking outreach.</p>
        </div>
      </InfoBox>

      <div>
        <Textarea
          id="background-input"
          placeholder="Paste your LinkedIn profile, CV content, or describe your professional background..."
          value={displayValue}
          onChange={(e) => setBackgroundInput(e.target.value)}
          className="min-h-[300px]"
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

export default ProfessionalBackground;
