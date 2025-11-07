import React from "react";
import {
  PrimaryCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/design-system";
import { Avatar, AvatarFallback } from "@/components/ui/airtable-ds/avatar";
import { Briefcase, MapPin, Building, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

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
  className?: string;
}

const getInitials = (first?: string, last?: string) => {
  const f = first?.[0] ?? "";
  const l = last?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

export const ContactPreview: React.FC<ContactPreviewProps> = ({
  contact,
  className,
}) => {
  const initials = getInitials(contact.first_name, contact.last_name);

  return (
    <div className={cn("space-y-4", className)}>
      <PrimaryCard className="bg-background">
        <CardContent className="p-4 flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h4 className="text-base font-semibold text-foreground">
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
            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            )}
          </div>
        </CardContent>
      </PrimaryCard>

      <Card className="bg-background">
        <CardHeader className="pb-1 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground leading-6 px-4 pb-4 pt-2">
          {contact.bio_summary ? (
            contact.bio_summary
          ) : (
            <span className="text-muted-foreground">No summary provided.</span>
          )}
        </CardContent>
      </Card>

      <Card className="bg-background">
        <CardHeader className="pb-1 px-4 pt-4">
          <CardTitle className="text-sm font-semibold text-foreground">
            How I Can Help
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground leading-6 px-4 pb-4 pt-2">
          {contact.how_i_can_help ? (
            contact.how_i_can_help
          ) : (
            <span className="text-muted-foreground">
              No information provided.
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
