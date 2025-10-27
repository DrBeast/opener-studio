import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Input } from "@/components/ui/airtable-ds/input";
import { Button } from "@/components/ui/design-system/buttons";
import { Label } from "@/components/ui/airtable-ds/label";
import { Background } from "@/types/profile";

interface EditableSummaryProps {
  editableSummary: Background;
  onSummaryChange: (field: keyof Background, value: string | string[]) => void;
}

const EditableSummary = ({
  editableSummary,
  onSummaryChange,
}: EditableSummaryProps) => {
  // Helper function to handle changes to array fields in summary
  const handleArrayFieldChange = (
    field: keyof Background,
    index: number,
    value: string
  ) => {
    if (Array.isArray(editableSummary[field])) {
      const newArray = [...(editableSummary[field] as string[])];
      newArray[index] = value;
      onSummaryChange(field, newArray);
    }
  };

  // Helper function to add a new item to an array field
  const handleAddArrayItem = (field: keyof Background) => {
    if (Array.isArray(editableSummary[field])) {
      const newArray = [...(editableSummary[field] as string[]), ""];
      onSummaryChange(field, newArray);
    }
  };

  // Helper function to remove an item from an array field
  const handleRemoveArrayItem = (field: keyof Background, index: number) => {
    if (Array.isArray(editableSummary[field])) {
      const newArray = (editableSummary[field] as string[]).filter(
        (_, i) => i !== index
      );
      onSummaryChange(field, newArray);
    }
  };

  // Helper function to render editable arrays
  const renderEditableArrayItems = (
    field: keyof Background,
    items?: string[]
  ) => {
    if (!items || !Array.isArray(items)) return null;

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-3">
            <Input
              value={item}
              onChange={(e) =>
                handleArrayFieldChange(field, index, e.target.value)
              }
              className="flex-grow bg-secondary border-border"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveArrayItem(field, index)}
              //              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="success"
          size="sm"
          onClick={() => handleAddArrayItem(field)}
          //          className="mt-3"
        >
          Add Item
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Blurb Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Overall Summary
        </Label>
        <Textarea
          value={editableSummary.overall_blurb || ""}
          onChange={(e) => onSummaryChange("overall_blurb", e.target.value)}
          rows={4}
          className="bg-secondary border-border"
        />
      </div>

      {/* Value Proposition Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Value Proposition
        </Label>
        <Textarea
          value={editableSummary.value_proposition_summary || ""}
          onChange={(e) =>
            onSummaryChange("value_proposition_summary", e.target.value)
          }
          rows={4}
          className="bg-secondary border-border"
        />
      </div>

      {/* Expertise Section */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Expertise</Label>
        <Textarea
          value={editableSummary.expertise}
          onChange={(e) => onSummaryChange("expertise", e.target.value)}
          rows={3}
          className="bg-secondary border-border"
        />
      </div>

      {/* Key Skills */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Key Skills
        </Label>
        {renderEditableArrayItems("key_skills", editableSummary.key_skills)}
      </div>

      {/* Domain Expertise */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Domain Expertise
        </Label>
        {renderEditableArrayItems(
          "domain_expertise",
          editableSummary.domain_expertise
        )}
      </div>

      {/* Technical Expertise */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Technical Expertise
        </Label>
        {renderEditableArrayItems(
          "technical_expertise",
          editableSummary.technical_expertise
        )}
      </div>
    </div>
  );
};

export default EditableSummary;
