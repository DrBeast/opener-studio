
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";
import { Background } from "@/types/profile";

interface ProfileSummaryProps {
  backgroundSummary: Background | null;
  onRegenerateAISummary: () => void;
}

// Helper function to render arrays safely
const renderArrayItems = (items?: string[]) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return <ul className="list-disc list-inside text-sm space-y-1 pl-2">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>;
};

const ProfileSummary = ({ backgroundSummary, onRegenerateAISummary }: ProfileSummaryProps) => {
  if (!backgroundSummary) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
        <p>You haven't provided any professional background information yet. Click 'Edit Profile' to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">AI Summary</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerateAISummary}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>
      
      {/* Show overall blurb if available */}
      {backgroundSummary.overall_blurb && (
        <div className="bg-primary/10 p-4 rounded-lg mb-4">
          <h4 className="font-semibold">Overall</h4>
          <p className="text-sm mt-1">{backgroundSummary.overall_blurb}</p>
        </div>
      )}
        
      {/* Show value proposition if available */}
      {backgroundSummary.value_proposition_summary && (
        <div className="bg-primary/10 p-4 rounded-lg mb-4">
          <h4 className="font-semibold">Value Proposition</h4>
          <p className="text-sm mt-1">{backgroundSummary.value_proposition_summary}</p>
        </div>
      )}
    
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold">Experience</h4>
          <p className="text-sm mt-1">{backgroundSummary.experience}</p>
          {renderArrayItems(backgroundSummary.combined_experience_highlights)}
        </div>
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold">Education</h4>
          <p className="text-sm mt-1">{backgroundSummary.education}</p>
          {renderArrayItems(backgroundSummary.combined_education_highlights)}
        </div>
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold">Expertise</h4>
          <p className="text-sm mt-1">{backgroundSummary.expertise}</p>
          {backgroundSummary.key_skills && backgroundSummary.key_skills.length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-medium">Key Skills:</h5>
              {renderArrayItems(backgroundSummary.key_skills)}
            </div>
          )}
          {backgroundSummary.domain_expertise && backgroundSummary.domain_expertise.length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-medium">Domain Expertise:</h5>
              {renderArrayItems(backgroundSummary.domain_expertise)}
            </div>
          )}
          {backgroundSummary.technical_expertise && backgroundSummary.technical_expertise.length > 0 && (
            <div className="mt-2">
              <h5 className="text-sm font-medium">Technical Expertise:</h5>
              {renderArrayItems(backgroundSummary.technical_expertise)}
            </div>
          )}
        </div>
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold">Key Achievements</h4>
          <p className="text-sm mt-1">{backgroundSummary.achievements}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
