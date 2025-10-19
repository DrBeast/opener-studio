import React from "react";
import { PrimaryCard, CardContent } from "@/components/ui/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/airtable-ds/avatar";
import { Briefcase, MapPin, Building, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";

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
    value_proposition_summary?: string;
  } | null;
  className?: string;
}

const getInitials = (first?: string, last?: string) => {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

export const GuestProfileSummary: React.FC<GuestProfileSummaryProps> = ({
  userProfile,
  userSummary,
  className = "",
}) => {
  if (!userProfile || !userSummary) {
    return null;
  }

  const initials = getInitials(userProfile.first_name, userProfile.last_name);

  return (
    <PrimaryCard
      className={cn("bg-blue-50 border-blue-200 min-h-[400px]", className)}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Main Flex Container */}
        <div className="flex items-start gap-3">
          {/* Avatar (Left Column) */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* All text content (Right Column) */}
          <div className="flex-1 space-y-3">
            {/* Name, Role, Company, Location */}
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
                {userProfile.first_name} {userProfile.last_name}
              </h4>
              {userProfile.job_role && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {userProfile.job_role}
                </p>
              )}
              {userProfile.current_company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> {userProfile.current_company}
                </p>
              )}
              {userProfile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {userProfile.location}
                </p>
              )}
            </div>

            {/* Professional Summary */}
            {userSummary.overall_blurb && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Professional Summary:
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {userSummary.overall_blurb}
                </p>
              </div>
            )}

            {/* Value Proposition */}
            {userSummary.value_proposition_summary && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Value Proposition:
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {userSummary.value_proposition_summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </PrimaryCard>
  );
};
