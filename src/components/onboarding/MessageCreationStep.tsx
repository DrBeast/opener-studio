import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageGeneration } from "@/components/MessageGeneration";

interface Contact {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name?: string;
}

interface MessageCreationStepProps {
  onMessageCreated: () => void;
}

const MessageCreationStep = ({ onMessageCreated }: MessageCreationStepProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(`
            contact_id,
            first_name,
            last_name,
            role,
            companies:company_id (
              name
            )
          `)
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });

        if (error) throw error;

        const formattedContacts = data?.map(contact => ({
          contact_id: contact.contact_id,
          first_name: contact.first_name || "",
          last_name: contact.last_name || "",
          role: contact.role || "",
          company_name: (contact.companies as any)?.name || "",
        })) || [];

        setContacts(formattedContacts);
        if (formattedContacts.length > 0) {
          setSelectedContact(formattedContacts[0]);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  const handleMessageSaved = () => {
    toast.success("Message saved successfully!");
    onMessageCreated();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            No contacts found
          </h3>
          <p className="text-orange-800">
            Please go back and create a contact first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <MessageCircle className="h-5 w-5" />
            Generate Your First Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800">
            Create a personalized outreach message for your contact using AI assistance.
          </p>
        </CardContent>
      </Card>

      {/* Contact Selection */}
      {contacts.length > 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Select a contact:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.map((contact) => (
              <Button
                key={contact.contact_id}
                variant={selectedContact?.contact_id === contact.contact_id ? "default" : "outline"}
                onClick={() => setSelectedContact(contact)}
                className="justify-start p-4 h-auto"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {(contact.role || contact.company_name) && (
                      <div className="text-sm opacity-70">
                        {contact.role} {contact.company_name && `at ${contact.company_name}`}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Generation */}
      {selectedContact && (
        <div className="mt-6">
          <MessageGeneration
            contact={{
              contact_id: selectedContact.contact_id,
              first_name: selectedContact.first_name,
              last_name: selectedContact.last_name,
              role: selectedContact.role
            }}
            companyName={selectedContact.company_name || ""}
            isOpen={true}
            onClose={() => {}}
            onMessageSaved={handleMessageSaved}
            embedded={true}
          />
        </div>
      )}
    </div>
  );
};

export default MessageCreationStep;