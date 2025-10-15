import { Textarea } from "@/components/ui/airtable-ds/textarea";
import { Input } from "@/components/ui/airtable-ds/input";
import { Button } from "@/components/ui/design-system/buttons";

import {
  AirtableCard,
  AirtableCardContent,
  AirtableCardHeader,
  AirtableCardTitle,
} from "@/components/ui/airtable-ds/airtable-card";
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
              className="flex-grow border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
    <AirtableCard className="mt-8">
      <AirtableCardHeader>
        <AirtableCardTitle className="text-xl">
          Edit AI Summary
        </AirtableCardTitle>
      </AirtableCardHeader>
      <AirtableCardContent className="space-y-8">
        {/* Overall Blurb Section */}
        <div>
          <label className="text-base font-semibold block mb-3 text-gray-900">
            Overall Summary
          </label>
          <Textarea
            value={editableSummary.overall_blurb || ""}
            onChange={(e) => onSummaryChange("overall_blurb", e.target.value)}
            rows={4}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Value Proposition Section */}
        <div>
          <label className="text-base font-semibold block mb-3 text-gray-900">
            Value Proposition
          </label>
          <Textarea
            value={editableSummary.value_proposition_summary || ""}
            onChange={(e) =>
              onSummaryChange("value_proposition_summary", e.target.value)
            }
            rows={4}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Expertise Section */}
        <div>
          <label className="text-base font-semibold block mb-3 text-gray-900">
            Expertise
          </label>
          <Textarea
            value={editableSummary.expertise}
            onChange={(e) => onSummaryChange("expertise", e.target.value)}
            rows={3}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />

          <div className="mt-6">
            <label className="text-sm font-semibold block mb-3 text-gray-700">
              Key Skills
            </label>
            {renderEditableArrayItems("key_skills", editableSummary.key_skills)}
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold block mb-3 text-gray-700">
              Domain Expertise
            </label>
            {renderEditableArrayItems(
              "domain_expertise",
              editableSummary.domain_expertise
            )}
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold block mb-3 text-gray-700">
              Technical Expertise
            </label>
            {renderEditableArrayItems(
              "technical_expertise",
              editableSummary.technical_expertise
            )}
          </div>
        </div>

        {/* Achievements Section */}
      </AirtableCardContent>
    </AirtableCard>
  );
};

export default EditableSummary;
