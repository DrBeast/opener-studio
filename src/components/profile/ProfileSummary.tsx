
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCcw, ChevronDown, ChevronUp, User, Award, GraduationCap, Star } from "lucide-react";
import { Background } from "@/types/profile";
import { useState } from "react";

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
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!backgroundSummary) {
    return (
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900">Profile Setup Needed</h4>
              <p className="text-amber-800 text-sm">You haven't provided any professional background information yet. Click 'Edit Profile' to get started.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">AI-Generated Profile Summary</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerateAISummary}
          className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
        >
          <RefreshCcw className="h-4 w-4" />
          Regenerate
        </Button>
      </div>
      
      {/* Main Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {backgroundSummary.overall_blurb && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-primary">Professional Overview</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">{backgroundSummary.overall_blurb}</p>
            </CardContent>
          </Card>
        )}
        
        {backgroundSummary.value_proposition_summary && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-700">Value Proposition</h4>
              </div>
              <p className="text-gray-700 leading-relaxed">{backgroundSummary.value_proposition_summary}</p>
            </CardContent>
          </Card>
        )}
      </div>
    
      {/* Expandable detailed sections */}
      <Collapsible open={isDetailsExpanded} onOpenChange={setIsDetailsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between h-12 hover:bg-gray-50 border-2 border-gray-200"
          >
            <span className="font-medium">View Detailed Breakdown</span>
            {isDetailsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-700">Experience</h4>
                </div>
                <p className="text-gray-700 mb-3 leading-relaxed">{backgroundSummary.experience}</p>
                {renderArrayItems(backgroundSummary.combined_experience_highlights)}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-700">Education</h4>
                </div>
                <p className="text-gray-700 mb-3 leading-relaxed">{backgroundSummary.education}</p>
                {renderArrayItems(backgroundSummary.combined_education_highlights)}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-700">Expertise</h4>
                </div>
                <p className="text-gray-700 mb-3 leading-relaxed">{backgroundSummary.expertise}</p>
                
                {backgroundSummary.key_skills && backgroundSummary.key_skills.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-orange-600 mb-2">Key Skills:</h5>
                    {renderArrayItems(backgroundSummary.key_skills)}
                  </div>
                )}
                
                {backgroundSummary.domain_expertise && backgroundSummary.domain_expertise.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-orange-600 mb-2">Domain Expertise:</h5>
                    {renderArrayItems(backgroundSummary.domain_expertise)}
                  </div>
                )}
                
                {backgroundSummary.technical_expertise && backgroundSummary.technical_expertise.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-orange-600 mb-2">Technical Expertise:</h5>
                    {renderArrayItems(backgroundSummary.technical_expertise)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-700">Key Achievements</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{backgroundSummary.achievements}</p>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ProfileSummary;
