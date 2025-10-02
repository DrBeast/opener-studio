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
    <PrimaryCard className={cn("bg-green-50 border-green-200", className)}>
      <CardContent className="p-4">
        {/* Main Flex Container */}
        <div className="flex items-start gap-3">
          {/* Avatar (Left Column) */}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-green-100 text-green-700 text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* All text content is now in this container (Right Column) */}
          <div className="flex-1 space-y-3">
            {/* Name, Role, Company, Location */}
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
                {contact.first_name} {contact.last_name}
              </h4>

              {contact.role && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-3 w-3" />
                  <span>{contact.role}</span>
                </div>
              )}

              {contact.current_company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3 w-3" />
                  <span>{contact.current_company}</span>
                </div>
              )}

              {contact.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{contact.location}</span>
                </div>
              )}
            </div>

            {/* Bio Summary */}
            {contact.bio_summary && (
              <div className="space-y-1">
                <h5 className="text-sm font-medium text-foreground">
                  Background
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {contact.bio_summary}
                </p>
              </div>
            )}

            {/* How I Can Help */}
            {contact.how_i_can_help && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <h5 className="text-sm font-medium text-green-800">
                    How You Can Help
                  </h5>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-green-50 p-3 rounded-md border border-green-200">
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
