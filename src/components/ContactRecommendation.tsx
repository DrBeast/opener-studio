
import { useState } from "react";
import { Mail, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ContactRecommendationProps {
  companyId: string;
  companyName: string;
}

interface ContactData {
  name: string;
  role?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  how_i_can_help?: string;
}

export function ContactRecommendation({ companyId, companyName }: ContactRecommendationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current session for authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        throw new Error("No active session found");
      }

      // Make the call to our edge function
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
      
      setContacts(data.contacts);
      setIsOpen(true);
    } catch (err: any) {
      console.error("Error generating contacts:", err);
      setError(err.message || "Failed to generate contacts");
      toast.error("Failed to generate contacts: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveContact = async (contact: ContactData) => {
    try {
      // Get the user's ID
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("No active session");
      }
      
      // Prepare contact data for saving
      const contactData = {
        company_id: companyId,
        user_id: session.session.user.id,
        first_name: contact.name.split(' ')[0],
        last_name: contact.name.includes(' ') ? contact.name.split(' ').slice(1).join(' ') : '',
        role: contact.role,
        location: contact.location,
        linkedin_url: contact.linkedin_url,
        email: contact.email,
        bio_summary: contact.bio_summary,
        how_i_can_help: contact.how_i_can_help
      };
      
      const { error } = await supabase
        .from("contacts")
        .insert(contactData);
        
      if (error) throw error;
      
      toast.success("Contact saved successfully!");
    } catch (err: any) {
      console.error("Error saving contact:", err);
      toast.error("Failed to save contact: " + (err.message || "Unknown error"));
    }
  };
  
  return (
    <>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={generateContacts}
        disabled={isLoading}
      >
        <User className="mr-2 h-4 w-4" />
        {isLoading ? "Generating..." : "Generate Contacts"}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recommended Contacts at {companyName}</DialogTitle>
            <DialogDescription>
              Here are potential contacts who might be helpful for your networking efforts.
            </DialogDescription>
          </DialogHeader>
          
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contacts could be generated. Try again later.
            </div>
          ) : (
            <div className="grid gap-4 mt-4">
              {contacts.map((contact, index) => (
                <Card key={index} className="p-4 relative">
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                      </div>
                      
                      {contact.role && (
                        <p className="text-muted-foreground">{contact.role}</p>
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
                    
                    <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => saveContact(contact)}
                      >
                        Save Contact
                      </Button>
                    </div>
                  </div>
                  
                  {contact.bio_summary && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">Background Summary</h4>
                      <p className="text-sm">{contact.bio_summary}</p>
                    </div>
                  )}
                  
                  {contact.how_i_can_help && (
                    <div className="mt-4 bg-primary/5 p-3 rounded-md border border-primary/10">
                      <h4 className="text-sm font-medium mb-1 text-primary">How I Can Help</h4>
                      <p className="text-sm">{contact.how_i_can_help}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
