import React from "react";
import { PrimaryCard, CardContent } from "@/components/ui/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/airtable-ds/avatar";
import { Briefcase, MapPin, Building, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestContactPreviewProps {
  contact: {
    first_name: string;
    last_name: string;
    role?: string;
    current_company?: string;
    location?: string;
    bio_summary?: string;
    how_i_can_help?: string;
  };
  className?: string;
}

const getInitials = (first?: string, last?: string) => {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

export const GuestContactPreview: React.FC<GuestContactPreviewProps> = ({
  contact,
  className,
}) => {
  const initials = getInitials(contact.first_name, contact.last_name);

  return (
    <PrimaryCard
      className={cn("bg-green-50 border-green-200 min-h-[400px]", className)}
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
                {contact.first_name} {contact.last_name}
              </h4>
              {contact.role && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {contact.role}
                </p>
              )}
              {contact.current_company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> {contact.current_company}
                </p>
              )}
              {contact.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {contact.location}
                </p>
              )}
            </div>

            {/* Professional Summary */}
            {contact.bio_summary && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Professional Summary:
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {contact.bio_summary}
                </p>
              </div>
            )}

            {/* How You Can Help */}
            {contact.how_i_can_help && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  How You Can Help:
                </p>
                <p className="text-sm leading-6 text-foreground">
                  {contact.how_i_can_help}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </PrimaryCard>
  );
};
