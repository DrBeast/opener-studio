import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/design-system";
import { User, Award, GraduationCap, Star, Target, Zap } from "lucide-react";

interface GuestProfileSummaryProps {
  userProfile: {
    first_name?: string;
    last_name?: string;
    current_company?: string;
    location?: string;
    job_role?: string;
  } | null;
  userSummary: {
    overall_blurb?: string;
    experience?: string;
    education?: string;
    expertise?: string;
    achievements?: string;
    combined_experience_highlights?: string[];
    combined_education_highlights?: string[];
    key_skills?: string[];
    domain_expertise?: string[];
    technical_expertise?: string[];
    value_proposition_summary?: string;
  } | null;
  className?: string;
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

export const GuestProfileSummary: React.FC<GuestProfileSummaryProps> = ({
  userProfile,
  userSummary,
  className = "",
}) => {
  if (!userProfile || !userSummary) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Basic Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">
              {userProfile.first_name} {userProfile.last_name}
            </CardTitle>
          </div>
          <div className="space-y-2 text-sm">
            {userProfile.job_role && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Role:</span>
                <span className="text-gray-600">{userProfile.job_role}</span>
              </div>
            )}
            {userProfile.current_company && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Company:</span>
                <span className="text-gray-600">
                  {userProfile.current_company}
                </span>
              </div>
            )}
            {userProfile.location && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Location:</span>
                <span className="text-gray-600">{userProfile.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Summary */}
      {userSummary.overall_blurb && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Professional Summary</CardTitle>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {userSummary.overall_blurb}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Experience Highlights */}
      {userSummary.combined_experience_highlights &&
        userSummary.combined_experience_highlights.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Experience Highlights</CardTitle>
              </div>
              {renderArrayItems(userSummary.combined_experience_highlights)}
            </CardContent>
          </Card>
        )}

      {/* Education Highlights */}
      {userSummary.combined_education_highlights &&
        userSummary.combined_education_highlights.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Education Highlights</CardTitle>
              </div>
              {renderArrayItems(userSummary.combined_education_highlights)}
            </CardContent>
          </Card>
        )}

      {/* Key Skills */}
      {userSummary.key_skills && userSummary.key_skills.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Key Skills</CardTitle>
            </div>
            {renderArrayItems(userSummary.key_skills)}
          </CardContent>
        </Card>
      )}

      {/* Domain Expertise */}
      {userSummary.domain_expertise &&
        userSummary.domain_expertise.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Domain Expertise</CardTitle>
              </div>
              {renderArrayItems(userSummary.domain_expertise)}
            </CardContent>
          </Card>
        )}

      {/* Value Proposition */}
      {userSummary.value_proposition_summary && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                Value Proposition
              </CardTitle>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {userSummary.value_proposition_summary}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
