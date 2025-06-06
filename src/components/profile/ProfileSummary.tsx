import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Button } from "@/components/ui/design-system/buttons";
import { OutlineAction } from "@/components/ui/design-system/buttons";
import { CollapsibleWide } from "@/components/ui/design-system/buttons";

import {
  AirtableCard,
  AirtableCardContent,
} from "@/components/ui/airtable-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  User,
  Award,
  GraduationCap,
  Star,
} from "lucide-react";
import { Background } from "@/types/profile";
import { useState } from "react";
import {
  Card,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/design-system"; // Ensure CardContent and CardDescription are imported if you are using them here

interface ProfileSummaryProps {
  backgroundSummary: Background | null;
  onRegenerateAISummary: () => void;
}

// Helper function to render arrays safely
const renderArrayItems = (items?: string[]) => {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="list-disc list-inside text-sm space-y-1 pl-2 text-gray-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

const ProfileSummary = ({
  backgroundSummary,
  onRegenerateAISummary,
}: ProfileSummaryProps) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  if (!backgroundSummary) {
    return (
      <AirtableCard className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <AirtableCardContent className="p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <User className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-amber-900">
                Profile Setup Needed
              </h4>
              <p className="text-amber-800">
                You haven't provided any professional background information
                yet. Click 'Edit Profile' to get started.
              </p>
            </div>
          </div>
        </AirtableCardContent>
      </AirtableCard>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        {/* Main Summary Cards - Changed to single column (no md:grid-cols-2) and uses space-y for vertical gap */}
        <div className="grid gap-6 w-full">
          {" "}
          {/* Removed md:grid-cols-2 and added w-full */}
          {backgroundSummary.overall_blurb && (
            <Card className="bg-gradient-to-br from-purple-50 to-purple-200 border-purple-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-6 w-6 text-purple-600" />
                  <CardTitle className="font-semibold text-lg text-purple-800">
                    Professional Overview
                  </CardTitle>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {backgroundSummary.overall_blurb}
                </p>
              </CardContent>
            </Card>
          )}
          {backgroundSummary.value_proposition_summary && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-200 border-green-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-4">
                  <Award className="h-6 w-6 text-green-600" />
                  <CardTitle className="font-semibold text-lg text-green-800">
                    Value Proposition
                  </CardTitle>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {backgroundSummary.value_proposition_summary}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <OutlineAction onClick={onRegenerateAISummary}>
          <RefreshCcw className="h-4 w-4" />
          Regenerate
        </OutlineAction>
      </div>

      {/* Expandable detailed sections - Changed to single column (no md:grid-cols-2) and uses space-y for vertical gap */}
      <Collapsible open={isDetailsExpanded} onOpenChange={setIsDetailsExpanded}>
        <CollapsibleTrigger asChild>
          <CollapsibleWide expanded={isDetailsExpanded} variant="outline">
            View Detailed Breakdown
          </CollapsibleWide>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          <div className="grid gap-6 w-full">
            {" "}
            {/* Removed md:grid-cols-2 and added w-full */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-200 border-blue-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-5">
                  <User className="h-6 w-6 text-blue-600" />
                  <h4 className="font-semibold text-lg text-blue-800">
                    Experience
                  </h4>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed text-base">
                  {backgroundSummary.experience}
                </p>
                {renderArrayItems(
                  backgroundSummary.combined_experience_highlights
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-200 border-purple-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-5">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                  <h4 className="font-semibold text-lg text-purple-800">
                    Education
                  </h4>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed text-base">
                  {backgroundSummary.education}
                </p>
                {renderArrayItems(
                  backgroundSummary.combined_education_highlights
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-red-200 border-orange-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-5">
                  <Star className="h-6 w-6 text-orange-600" />
                  <h4 className="font-semibold text-lg text-orange-800">
                    Expertise
                  </h4>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed text-base">
                  {backgroundSummary.expertise}
                </p>
                {backgroundSummary.key_skills &&
                  backgroundSummary.key_skills.length > 0 && (
                    <div className="mt-5">
                      <h5 className="text-sm font-semibold text-orange-700 mb-3">
                        Key Skills:
                      </h5>
                      {renderArrayItems(backgroundSummary.key_skills)}
                    </div>
                  )}
                {backgroundSummary.domain_expertise &&
                  backgroundSummary.domain_expertise.length > 0 && (
                    <div className="mt-5">
                      <h5 className="text-sm font-semibold text-orange-700 mb-3">
                        Domain Expertise:
                      </h5>
                      {renderArrayItems(backgroundSummary.domain_expertise)}
                    </div>
                  )}
                {backgroundSummary.technical_expertise &&
                  backgroundSummary.technical_expertise.length > 0 && (
                    <div className="mt-5">
                      <h5 className="text-sm font-semibold text-orange-700 mb-3">
                        Technical Expertise:
                      </h5>
                      {renderArrayItems(backgroundSummary.technical_expertise)}
                    </div>
                  )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-200 border-emerald-200">
              <CardContent className="p-8">
                {" "}
                {/* Changed AirtableCardContent to CardContent */}
                <div className="flex items-center gap-3 mb-5">
                  <Award className="h-6 w-6 text-emerald-600" />
                  <h4 className="font-semibold text-lg text-emerald-800">
                    Key Achievements
                  </h4>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {backgroundSummary.achievements}
                </p>
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ProfileSummary;
