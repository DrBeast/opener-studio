import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Label } from "@/components/ui/airtable-ds/label";

interface ProfessionalBackgroundProps {
  backgroundInput: string;
  setBackgroundInput: (value: string) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  existingData?: {
    background?: string;
    linkedin?: string;
    additional?: string;
  };
}

const ProfessionalBackground = ({
  backgroundInput,
  setBackgroundInput,
  isSubmitting,
  isEditing = false,
  existingData = {},
}: ProfessionalBackgroundProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="background-input" className="text-lg font-semibold">
          Professional Background
        </Label>
        <p className="text-sm text-[hsl(var(--normaltext))] mt-1">
          {isEditing
            ? "Update your professional background information. This will be used to regenerate your AI profile summary."
            : "Share your professional background information to generate your AI profile summary."}
        </p>
      </div>

      <div>
        <Textarea
          id="background-input"
          placeholder="Paste your LinkedIn profile or describe your professional background..."
          value={backgroundInput}
          onChange={(e) => setBackgroundInput(e.target.value)}
          className="min-h-[300px] text-sm resize-none bg-secondary border-border"
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

export default ProfessionalBackground;
