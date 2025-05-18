
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Background } from "@/types/profile";

interface EditableSummaryProps {
  editableSummary: Background;
  onSummaryChange: (field: keyof Background, value: string | string[]) => void;
}

const EditableSummary = ({ editableSummary, onSummaryChange }: EditableSummaryProps) => {
  // Helper function to handle changes to array fields in summary
  const handleArrayFieldChange = (field: keyof Background, index: number, value: string) => {
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
      const newArray = (editableSummary[field] as string[]).filter((_, i) => i !== index);
      onSummaryChange(field, newArray);
    }
  };
  
  // Helper function to render editable arrays
  const renderEditableArrayItems = (field: keyof Background, items?: string[]) => {
    if (!items || !Array.isArray(items)) return null;
    
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
              className="flex-grow"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => handleRemoveArrayItem(field, index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => handleAddArrayItem(field)}
          className="mt-2"
        >
          Add Item
        </Button>
      </div>
    );
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-medium mb-4">Edit AI Summary</h3>
      
      {/* Overall Blurb Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Overall Summary</label>
        <Textarea
          value={editableSummary.overall_blurb || ""}
          onChange={(e) => onSummaryChange('overall_blurb', e.target.value)}
          rows={4}
        />
      </div>
      
      {/* Value Proposition Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Value Proposition</label>
        <Textarea
          value={editableSummary.value_proposition_summary || ""}
          onChange={(e) => onSummaryChange('value_proposition_summary', e.target.value)}
          rows={4}
        />
      </div>
      
      {/* Experience Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Experience</label>
        <Textarea
          value={editableSummary.experience}
          onChange={(e) => onSummaryChange('experience', e.target.value)}
          rows={3}
        />
        
        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Experience Highlights</label>
          {renderEditableArrayItems('combined_experience_highlights', editableSummary.combined_experience_highlights)}
        </div>
      </div>
      
      {/* Education Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Education</label>
        <Textarea
          value={editableSummary.education}
          onChange={(e) => onSummaryChange('education', e.target.value)}
          rows={3}
        />
        
        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Education Highlights</label>
          {renderEditableArrayItems('combined_education_highlights', editableSummary.combined_education_highlights)}
        </div>
      </div>
      
      {/* Expertise Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Expertise</label>
        <Textarea
          value={editableSummary.expertise}
          onChange={(e) => onSummaryChange('expertise', e.target.value)}
          rows={3}
        />
        
        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Key Skills</label>
          {renderEditableArrayItems('key_skills', editableSummary.key_skills)}
        </div>
        
        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Domain Expertise</label>
          {renderEditableArrayItems('domain_expertise', editableSummary.domain_expertise)}
        </div>
        
        <div className="mt-4">
          <label className="text-sm font-medium block mb-2">Technical Expertise</label>
          {renderEditableArrayItems('technical_expertise', editableSummary.technical_expertise)}
        </div>
      </div>
      
      {/* Achievements Section */}
      <div className="mb-6">
        <label className="text-base font-medium block mb-2">Key Achievements</label>
        <Textarea
          value={editableSummary.achievements}
          onChange={(e) => onSummaryChange('achievements', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default EditableSummary;
