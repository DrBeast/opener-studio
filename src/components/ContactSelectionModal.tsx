
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building, MessageCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";

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

export const ContactSelectionModal = ({ isOpen, onClose }: ContactSelectionModalProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchContacts();
    }
  }, [isOpen, user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          role,
          company_id,
          companies!inner(name)
        `)
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;

      const contactsWithCompany = data?.map(contact => ({
        ...contact,
        company_name: contact.companies?.name
      })) || [];

      setContacts(contactsWithCompany);
    } catch (error) {
      console.error('Error fetching contacts:', error);
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
              <Button onClick={() => {
                onClose();
                window.location.href = '/pipeline';
              }}>
                Add Contacts
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact.contact_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleContactSelect(contact)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          {contact.role && (
                            <p className="text-sm text-muted-foreground">{contact.role}</p>
                          )}
                          {contact.company_name && (
                            <div className="flex items-center gap-1 mt-1">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button size="sm">
                        Generate Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedContact && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.company_name || 'Unknown Company'}
          isOpen={isMessageModalOpen}
          onClose={handleCloseMessageModal}
        />
      )}
    </>
  );
};
