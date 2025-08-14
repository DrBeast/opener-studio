import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/airtable-ds/dialog";
import { Button } from "@/components/ui/airtable-ds/button";
import { Card, CardContent } from "@/components/ui/airtable-ds/card";
import { User, Building, MessageCircle, Users, Contact } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";
import { CompanySelectionModal } from "@/components/CompanySelectionModal";
import {
  Chipcard,
  OutlineAction,
  PrimaryAction,
} from "@/components/ui/design-system";

interface Contact {
  contact_id: string;
  first_name: string;
  last_name: string;
  role?: string;
  company_id: string;
  company_name?: string;
}

interface ContactSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSelectionModal = ({
  isOpen,
  onClose,
}: ContactSelectionModalProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isCompanySelectionOpen, setIsCompanySelectionOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchContacts();
    }
  }, [isOpen, user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select(
          `
          contact_id,
          first_name,
          last_name,
          role,
          company_id,
          companies!inner(name)
        `
        )
        .eq("user_id", user.id)
        .order("first_name");

      if (error) throw error;

      const contactsWithCompany =
        data?.map((contact) => ({
          ...contact,
          company_name: contact.companies?.name,
        })) || [];

      setContacts(contactsWithCompany);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setIsMessageModalOpen(true);
    onClose();
  };

  const handleCloseMessageModal = () => {
    setIsMessageModalOpen(false);
    setSelectedContact(null);
  };

  const handleAddContacts = () => {
    setIsCompanySelectionOpen(true);
    onClose();
  };

  const handleCloseCompanySelection = () => {
    setIsCompanySelectionOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Generate Message - Select Contact
            </DialogTitle>
            <DialogDescription>
              Choose a contact to generate a personalized message for
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Contacts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add some contacts first to generate personalized messages
              </p>
              <Button onClick={handleAddContacts}>Add Contacts</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Chipcard
                  key={contact.contact_id}
                  title={`${contact.first_name} ${contact.last_name}`}
                  subtitle={contact.role}
                  description={contact.company_name}
                  icon={<Contact />}
                  icon2={<Building className="h-4 w-4" />}
                >
                  <PrimaryAction
                    size="sm"
                    onClick={() => handleContactSelect(contact)}
                    className="flex items-center gap-1"
                  >
                    Generate Message
                  </PrimaryAction>
                </Chipcard>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedContact && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.company_name || "Unknown Company"}
          isOpen={isMessageModalOpen}
          onClose={handleCloseMessageModal}
        />
      )}

      <CompanySelectionModal
        isOpen={isCompanySelectionOpen}
        onClose={handleCloseCompanySelection}
      />
    </>
  );
};
