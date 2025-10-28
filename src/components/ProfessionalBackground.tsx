import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Label } from "@/components/ui/airtable-ds/label";
import { VALIDATION_LIMITS } from "@/lib/validation-constants";

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
  wordCount?: number;
}

const ProfessionalBackground = ({
  backgroundInput,
  setBackgroundInput,
  isSubmitting,
  isEditing = false,
  existingData = {},
  wordCount = 0,
}: ProfessionalBackgroundProps) => {
  return (
    <div className="space-y-4">
      <Textarea
        id="background-input"
        placeholder={`Paste your LinkedIn profile or CV or type in your professional background (${VALIDATION_LIMITS.MIN_WORDS_BG} words min)`}
        value={backgroundInput}
        onChange={(e) => setBackgroundInput(e.target.value)}
        className="min-h-[300px] text-sm resize-none bg-secondary border-border"
        disabled={isSubmitting}
      />
    </div>
  );
};

export default ProfessionalBackground;
