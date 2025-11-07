import React, { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/airtable-ds/use-toast";
import { UserPlus, Search, MessageCircle, User } from "lucide-react";
import { Loader2 } from "lucide-react";

// Design System Imports
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/design-system/resizable";
import { ContactCard } from "@/components/ui/design-system/contactcard";
import {
  PrimaryCard,
  CardContent,
  CardTitle,
} from "@/components/ui/design-system";
import { PrimaryAction } from "@/components/ui/design-system";
import { Input } from "@/components/ui/airtable-ds/input";

// Hooks and Components
import { useCompanies } from "@/hooks/useCompanies";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";
import { ContactPreview } from "@/components/ContactPreview";
import { AddContactModal } from "@/components/AddContactModal";

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

const STORAGE_KEY = "studio_selectedContactId";

const Studio = () => {
  useRequireProfile();

  const { user, isLoading: authLoading } = useAuth();
  const { companies } = useCompanies();
  const { contacts, isLoading: contactsLoading, fetchContacts } = useContacts();

  // State variables
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load selected contact from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedContactId(stored);
      }
    }
  }, []);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSelectedContactId(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save selected contact to localStorage whenever it changes
  useEffect(() => {
    if (selectedContactId) {
      localStorage.setItem(STORAGE_KEY, selectedContactId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedContactId]);

  // Get selected contact object
  const selectedContact = useMemo(() => {
    if (!selectedContactId) return null;
    return contacts.find((c) => c.contact_id === selectedContactId) || null;
  }, [contacts, selectedContactId]);

  // Convert Contact to ContactForMessage
  const contactForMessage: ContactForMessage | null = useMemo(() => {
    if (!selectedContact) return null;
    return {
      contact_id: selectedContact.contact_id,
      first_name: selectedContact.first_name,
      last_name: selectedContact.last_name,
      role: selectedContact.role,
      company_id: selectedContact.company_id,
      current_company: selectedContact.company_name || "",
      location: selectedContact.location,
      bio_summary: selectedContact.bio_summary,
      how_i_can_help: selectedContact.how_i_can_help,
      recent_activity_summary: selectedContact.recent_activity_summary || "",
    };
  }, [selectedContact]);

  // Filter contacts based on search term
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;

    const searchLower = searchTerm.toLowerCase();
    return contacts.filter((contact) => {
      const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`;
      return (
        fullName.toLowerCase().includes(searchLower) ||
        contact.role?.toLowerCase().includes(searchLower) ||
        contact.company_name?.toLowerCase().includes(searchLower) ||
        contact.bio_summary?.toLowerCase().includes(searchLower)
      );
    });
  }, [contacts, searchTerm]);

  // Handle contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  // Handle add contact success
  const handleAddContactSuccess = () => {
    fetchContacts();
  };

  // Handle contact created from modal
  const handleContactCreated = (newContact: ContactForMessage) => {
    fetchContacts();
    setSelectedContactId(newContact.contact_id);
    setIsAddContactModalOpen(false);
  };

  const isLoading = contactsLoading || authLoading;

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full max-h-full bg-background overflow-hidden">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full max-h-full "
      >
        {/* Left Panel - Contacts */}
        <ResizablePanel defaultSize={25} minSize={20} className="border-r">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-foreground" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Contacts
                </CardTitle>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm
                      ? "No contacts match your search"
                      : "No contacts yet"}
                  </p>
                  {!searchTerm && (
                    <PrimaryAction
                      onClick={() => setIsAddContactModalOpen(true)}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create Contact
                    </PrimaryAction>
                  )}
                </div>
              ) : (
                <>
                  {filteredContacts.map((contact) => (
                    <ContactCard
                      key={contact.contact_id}
                      firstName={contact.first_name}
                      lastName={contact.last_name}
                      role={contact.role}
                      company={contact.company_name}
                      isSelected={contact.contact_id === selectedContactId}
                      onClick={() => handleContactSelect(contact.contact_id)}
                    />
                  ))}
                  {/* Create Contact Button - Below contacts */}
                  <div className="pt-2">
                    <PrimaryAction
                      onClick={() => setIsAddContactModalOpen(true)}
                      size="sm"
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4" />
                      Create Contact
                    </PrimaryAction>
                  </div>
                </>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Workspace */}
        <ResizablePanel defaultSize={50} minSize={30} className="border-r">
          <div className="flex flex-col h-full p-6 pb-2">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold text-foreground">
                Message Workspace
              </CardTitle>
            </div>

            <div className="flex-1 overflow-y-auto">
              <MessageGeneration
                contact={contactForMessage}
                companyName={
                  contactForMessage?.company_id
                    ? companies.find(
                        (c) => c.company_id === contactForMessage.company_id
                      )?.name ||
                      contactForMessage?.current_company ||
                      ""
                    : contactForMessage?.current_company || ""
                }
                isOpen={true}
                onClose={() => {}}
                onMessageSaved={() => {
                  toast({
                    title: "Success",
                    description: "Message copied and saved to history!",
                  });
                }}
                embedded={true}
                disabled={!contactForMessage}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Context */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center gap-2 mb-6">
              <CardTitle className="text-lg font-semibold text-foreground">
                Selected Contact
              </CardTitle>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {selectedContact ? (
                <ContactPreview
                  contact={{
                    first_name: selectedContact.first_name,
                    last_name: selectedContact.last_name,
                    role: selectedContact.role,
                    current_company: selectedContact.company_name,
                    location: selectedContact.location,
                    bio_summary: selectedContact.bio_summary,
                    how_i_can_help: selectedContact.how_i_can_help,
                    linkedin_url: selectedContact.linkedin_url,
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Select a contact to preview their profile and craft an
                    opener for them
                  </p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
        onSuccess={handleAddContactSuccess}
        onContactCreated={handleContactCreated}
      />
    </div>
  );
};

export default Studio;
