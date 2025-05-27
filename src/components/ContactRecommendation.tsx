
import { useState } from "react";
import { User, MessageCircle, UserPlus, Users, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { MessageGeneration } from "@/components/MessageGeneration";

interface ContactRecommendationProps {
  companyId: string;
  companyName: string;
}

interface ContactData {
  contact_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  company_id?: string;
  isSelected?: boolean;
}

export function ContactRecommendation({ companyId, companyName }: ContactRecommendationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageContact, setMessageContact] = useState<ContactData | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

  const generateContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        throw new Error("No active session found");
      }

      const { data, error: fnError } = await supabase.functions.invoke("generate_contacts", {
        body: { company_id: companyId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (fnError) throw fnError;
      
      if (!data || !data.contacts || !Array.isArray(data.contacts)) {
        throw new Error("Invalid response from generate_contacts function");
      }
      
      const contactsWithIds = data.contacts.map((contact: Omit<ContactData, 'contact_id'>) => ({
        ...contact,
        contact_id: crypto.randomUUID(),
        first_name: contact.name.split(' ')[0],
        last_name: contact.name.includes(' ') ? contact.name.split(' ').slice(1).join(' ') : '',
        company_id: companyId,
        isSelected: true // Default to selected
      }));
      
      setContacts(contactsWithIds);
      setIsOpen(true);
    } catch (err: any) {
      console.error("Error generating contacts:", err);
      setError(err.message || "Failed to generate contacts");
      toast.error("Failed to generate contacts: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.contact_id === contactId 
          ? { ...contact, isSelected: !contact.isSelected }
          : contact
      )
    );
  };

  const selectAll = () => {
    setContacts(prev => prev.map(contact => ({ ...contact, isSelected: true })));
  };

  const deselectAll = () => {
    setContacts(prev => prev.map(contact => ({ ...contact, isSelected: false })));
  };
  
  const saveSelectedContacts = async () => {
    const selectedContacts = contacts.filter(contact => contact.isSelected);
    
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to save");
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("No active session");
      }
      
      const contactsToSave = selectedContacts.map(contact => ({
        company_id: companyId,
        user_id: session.session.user.id,
        first_name: contact.first_name || contact.name.split(' ')[0],
        last_name: contact.last_name || (contact.name.includes(' ') ? contact.name.split(' ').slice(1).join(' ') : ''),
        role: contact.role,
        location: contact.location,
        linkedin_url: contact.linkedin_url,
        email: contact.email,
        bio_summary: contact.bio_summary,
        how_i_can_help: contact.how_i_can_help
      }));
      
      const { error } = await supabase
        .from("contacts")
        .insert(contactsToSave);
        
      if (error) throw error;
      
      toast.success(`${selectedContacts.length} contact(s) saved successfully!`);
      setIsOpen(false);
      
      // Refresh the page data
      window.location.reload();
      
    } catch (err: any) {
      console.error("Error saving contacts:", err);
      toast.error("Failed to save contacts: " + (err.message || "Unknown error"));
    }
  };

  const handleGenerateMessage = (contact: ContactData) => {
    setMessageContact(contact);
    setIsMessageDialogOpen(true);
  };
  
  const handleCloseMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setMessageContact(null);
  };
  
  return (
    <>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-6 w-6 p-0 shrink-0"
        onClick={generateContacts}
        disabled={isLoading}
      >
        <Users className="h-3 w-3" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Generate Contacts at {companyName}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>AI has identified key individuals who can potentially facilitate your application, provide insights into opportunities, or influence hiring decisions.</p>
              <p className="text-sm text-primary">
                <strong>How AI helps:</strong> Contacts are selected based on your specific background and skills in relation to this company's needs, not just title matching. The AI considers your experience and identifies decision-makers and influencers who would be most relevant to your career goals.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts could be generated. Try again later.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {contacts.filter(c => c.isSelected).length} of {contacts.length} selected
                </div>
              </div>

              <div className="grid gap-4">
                {contacts.map((contact, index) => (
                  <Card key={index} className={`p-4 transition-all ${contact.isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Button
                          variant={contact.isSelected ? "default" : "outline"}
                          size="sm"
                          className="mt-1"
                          onClick={() => toggleContactSelection(contact.contact_id)}
                        >
                          {contact.isSelected ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                        
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{contact.name}</h3>
                            {contact.isSelected && <Badge variant="default">Selected</Badge>}
                          </div>
                          
                          {contact.role && (
                            <p className="text-muted-foreground font-medium">{contact.role}</p>
                          )}
                          
                          {contact.location && (
                            <p className="text-sm text-muted-foreground">{contact.location}</p>
                          )}
                          
                          {contact.linkedin_url && (
                            <a 
                              href={contact.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              LinkedIn Profile
                            </a>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleGenerateMessage(contact)}
                          >
                            <MessageCircle className="mr-1 h-4 w-4" />
                            Generate Message
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {contact.bio_summary && (
                      <div className="mt-4 pl-11">
                        <h4 className="text-sm font-medium mb-2">Background Summary</h4>
                        <p className="text-sm text-muted-foreground">{contact.bio_summary}</p>
                      </div>
                    )}
                    
                    {contact.how_i_can_help && (
                      <div className="mt-4 pl-11 bg-primary/5 p-3 rounded-md border border-primary/10">
                        <h4 className="text-sm font-medium mb-2 text-primary">How I Can Help</h4>
                        <p className="text-sm">{contact.how_i_can_help}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveSelectedContacts}>
                  Save Selected Contacts ({contacts.filter(c => c.isSelected).length})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {messageContact && (
        <MessageGeneration
          contact={messageContact}
          companyName={companyName}
          isOpen={isMessageDialogOpen}
          onClose={handleCloseMessageDialog}
        />
      )}
    </>
  );
}
