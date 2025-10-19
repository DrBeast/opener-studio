import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/airtable-ds/use-toast";

// Icons Imports
import { UserPlus, MessageCircle, LucideTarget } from "lucide-react";

// Design System Imports
import {
  CardContent,
  PrimaryCard,
  InfoBox,
  CardTitle,
} from "@/components/ui/design-system";

import { useCompanies } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";

import { AddContact } from "@/components/AddContact";
import { MessageGeneration } from "@/components/MessageGeneration";
import { RecentContactsList } from "@/components/RecentContactsList";
import { ContactDetails } from "@/components/ContactDetails";

// Interface for contact data used in message generation
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

const PipelineDashboard = () => {
  const navigate = useNavigate();
  const { companies, isLoading: companiesLoading } = useCompanies();

  const { contacts, fetchContacts } = useContacts();

  // State variables
  const [contactForMessage, setContactForMessage] =
    useState<ContactForMessage | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);

  // Ref for scrolling to studio
  const studioRef = useRef<HTMLDivElement>(null);

  // Handler to receive contact from workflow
  const handleContactCreated = (newContact: ContactForMessage) => {
    console.log("Parent received new contact:", newContact);

    // Ensure the contact object has the correct structure for MessageGeneration
    const contactForGeneration = {
      contact_id: newContact.contact_id,
      first_name: newContact.first_name,
      last_name: newContact.last_name,
      role: newContact.role,
      company_id: newContact.company_id,
      current_company: newContact.current_company,
      location: newContact.location,
      bio_summary: newContact.bio_summary,
      how_i_can_help: newContact.how_i_can_help,
      recent_activity_summary: newContact.recent_activity_summary,
    };

    console.log(
      "Contact prepared for message generation:",
      contactForGeneration
    );
    setContactForMessage(contactForGeneration);
    fetchContacts();
  };

  // Handler for selecting existing contact from RecentContactsList
  const handleSelectExistingContact = (selectedContact: ContactForMessage) => {
    setContactForMessage(selectedContact);

    // Scroll to studio smoothly
    if (studioRef.current) {
      studioRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handler for opening ContactDetails modal
  const handleContactClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsContactDetailsOpen(true);
  };

  // Handler for closing ContactDetails modal
  const handleContactDetailClose = () => {
    setIsContactDetailsOpen(false);
    setSelectedContactId(null);
  };

  // Handler for viewing all contacts
  const handleViewAllContacts = () => {
    navigate("/message-history");
  };

  const isLoading = companiesLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-100 min-h-screen">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-8 space-y-6">
        {/* Message Crafting Studio */}
        <div ref={studioRef}>
          <PrimaryCard className="w-full border-2">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
                {/* Left Panel - Contact Creation */}
                <div
                  className={`p-8 border-r border-border/50 ${
                    !contactForMessage ? "bg-primary/5" : "bg-background"
                  } transition-colors duration-300`}
                >
                  {!contactForMessage && (
                    <div className="flex items-center gap-2 mb-6">
                      <UserPlus className="h-6 w-6 text-primary" />
                      <CardTitle className="text-xl font-semibold text-primary">
                        Add profile and create contact
                      </CardTitle>
                    </div>
                  )}

                  <div className="space-y-6">
                    <AddContact
                      companies={companies}
                      onContactCreated={handleContactCreated}
                      createdContact={contactForMessage}
                      onClearContact={() => setContactForMessage(null)}
                    />
                    {!contactForMessage && (
                      <InfoBox
                        className="text-sm"
                        title="Who should I contact?"
                        description="Start with people you already know. For new contacts, think of companies you are interested in, then try searching LinkedIn for [company name] [function]."
                        icon={<LucideTarget className="h-4 w-4" />}
                      />
                    )}
                  </div>
                </div>

                {/* Right Panel - Message Generation */}
                <div
                  className={`p-8 relative ${
                    !contactForMessage ? "bg-muted/30" : "bg-primary/5"
                  } transition-colors duration-300`}
                >
                  {/* Conditional overlay */}
                  {!contactForMessage && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                          Create a contact first to generate messages
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-6">
                    <MessageCircle
                      className={`h-6 w-6 ${
                        !contactForMessage
                          ? "text-muted-foreground" // Inactive styles
                          : "text-primary" // Active styles
                      }`}
                    />
                    <CardTitle
                      className={`text-xl font-semibold ${
                        !contactForMessage
                          ? "text-muted-foreground" // Inactive styles
                          : "text-primary" // Active styles
                      }`}
                    >
                      {contactForMessage
                        ? `Generate message for ${contactForMessage.first_name} ${contactForMessage.last_name}`
                        : "Generate message"}
                    </CardTitle>
                  </div>

                  {/* The MessageGeneration component is always rendered */}
                  <div
                    className={`${
                      !contactForMessage
                        ? "pointer-events-none opacity-50"
                        : "opacity-100"
                    } transition-opacity duration-300`}
                  >
                    <MessageGeneration
                      contact={contactForMessage}
                      companyName={
                        contactForMessage?.company_id
                          ? companies.find(
                              (c) =>
                                c.company_id === contactForMessage.company_id
                            )?.name || ""
                          : contactForMessage?.current_company || ""
                      }
                      isOpen={true}
                      onClose={() => {}}
                      onMessageSaved={() => {
                        toast({
                          title: "Success",
                          description: "Message copied and saved to history!",
                        });
                        setContactForMessage(null);
                      }}
                      embedded={true}
                      disabled={!contactForMessage}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </PrimaryCard>
        </div>

        {/* Recent Contacts List */}
        <RecentContactsList
          contacts={contacts}
          onSelectContact={handleSelectExistingContact}
          onContactClick={handleContactClick}
          onViewAllContacts={handleViewAllContacts}
        />
      </div>

      {/* Contact Details Modal */}
      {selectedContactId && (
        <ContactDetails
          contactId={selectedContactId}
          isOpen={isContactDetailsOpen}
          onClose={handleContactDetailClose}
          onContactUpdated={fetchContacts}
        />
      )}
    </div>
  );
};

export default PipelineDashboard;
