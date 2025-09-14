import React from "react";
import { Button } from "@/components/ui/design-system/buttons";
import {
  PrimaryCard,
  CardContent,
  CardTitle,
} from "@/components/ui/design-system";
import { MessageCircle, User, Users } from "lucide-react";
import { useContactInteractionOverview } from "@/hooks/useContactInteractionOverview";

interface Contact {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name?: string;
  bio_summary: string;
  how_i_can_help: string;
}

interface ContactForMessage {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id?: string;
  current_company: string;
  location: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
}

interface RecentContactsListProps {
  contacts: Contact[];
  onSelectContact: (contact: ContactForMessage) => void;
  onContactClick?: (contactId: string) => void;
  onViewAllContacts?: () => void;
}

const ConversationHistory = ({ contactId }: { contactId: string }) => {
  const { overview, isLoading, error } =
    useContactInteractionOverview(contactId);

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Conversation history:</span> Loading...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Conversation history:</span> Error loading
        history
      </p>
    );
  }

  if (!overview) {
    return (
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Conversation history:</span> No
        interactions yet
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground line-clamp-2">
      <span className="font-medium">Conversation history:</span>{" "}
      {overview.overview}
    </p>
  );
};

const ContactRow = ({
  contact,
  onSelectContact,
  onContactClick,
}: {
  contact: Contact;
  onSelectContact: (contact: ContactForMessage) => void;
  onContactClick?: (contactId: string) => void;
}) => {
  const handleWriteMessage = () => {
    // Transform the contact to match ContactForMessage interface
    const contactForMessage: ContactForMessage = {
      contact_id: contact.contact_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      role: contact.role,
      current_company: contact.company_name || "",
      location: "", // Not available in Contact interface
      bio_summary: contact.bio_summary,
      how_i_can_help: contact.how_i_can_help,
      recent_activity_summary: "", // Not available in Contact interface
    };

    onSelectContact(contactForMessage);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleRowClick = () => {
    if (onContactClick) {
      onContactClick(contact.contact_id);
    }
  };

  return (
    <div
      className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {getInitials(contact.first_name, contact.last_name)}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          {/* Name and Role */}
          <div>
            <h3 className="font-medium text-sm">
              {contact.first_name} {contact.last_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {contact.role}{" "}
              {contact.company_name && `at ${contact.company_name}`}
            </p>
          </div>

          {/* Bio Summary */}
          {contact.bio_summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {contact.bio_summary}
            </p>
          )}

          {/* How I Can Help */}
          {contact.how_i_can_help && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              <span className="font-medium">How I can help:</span>{" "}
              {contact.how_i_can_help}
            </p>
          )}

          {/* Conversation History */}
          <ConversationHistory contactId={contact.contact_id} />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          onClick={handleWriteMessage}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Write Message
        </Button>
      </div>
    </div>
  );
};

export const RecentContactsList = ({
  contacts,
  onSelectContact,
  onContactClick,
  onViewAllContacts,
}: RecentContactsListProps) => {
  // Show only the most recent 5 contacts
  const recentContacts = contacts.slice(0, 5);

  if (recentContacts.length === 0) {
    return null;
  }

  return (
    <PrimaryCard className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Recent Contacts</CardTitle>
          </div>

          {/* <p>
            Select a contact below to write a follow-up message or start a new
            conversation.
          </p> */}

          <div className="space-y-3">
            {recentContacts.map((contact) => (
              <ContactRow
                key={contact.contact_id}
                contact={contact}
                onSelectContact={onSelectContact}
                onContactClick={onContactClick}
              />
            ))}
          </div>

          {/* More Contacts Button */}
          {onViewAllContacts && (
            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAllContacts}
                className="flex items-center gap-2 w-full"
              >
                <Users className="h-4 w-4" />
                More Contacts
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </PrimaryCard>
  );
};
