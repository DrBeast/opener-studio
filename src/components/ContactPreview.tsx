import React from "react";
import { PrimaryCard, CardContent } from "@/components/ui/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, MapPin, Building, Linkedin } from "lucide-react";

interface ContactPreviewProps {
  contact: {
    first_name: string;
    last_name: string;
    role?: string;
    current_company?: string;
    location?: string;
    bio_summary?: string;
    how_i_can_help?: string;
    linkedin_url?: string;
  };
}

const getInitials = (first?: string, last?: string) => {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

export const ContactPreview: React.FC<ContactPreviewProps> = ({ contact }) => {
  const initials = getInitials(contact.first_name, contact.last_name);

  return (
    <PrimaryCard className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-foreground">
              {contact.first_name} {contact.last_name}
            </h4>
            {contact.role && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" /> {contact.role}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {contact.current_company && (
                <span className="inline-flex items-center gap-1.5">
                  <Building className="h-4 w-4" /> {contact.current_company}
                </span>
              )}
              {contact.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {contact.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {contact.bio_summary && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-1">Background:</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {contact.bio_summary}
            </p>
          </div>
        )}

        {contact.how_i_can_help && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-1">How You Can Help:</p>
            <p className="text-sm leading-6 text-primary">
              {contact.how_i_can_help}
            </p>
          </div>
        )}

        {contact.linkedin_url && (
          <div className="mt-4">
            <a
              href={contact.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="h-4 w-4" /> LinkedIn
            </a>
          </div>
        )}
      </CardContent>
    </PrimaryCard>
  );
};
