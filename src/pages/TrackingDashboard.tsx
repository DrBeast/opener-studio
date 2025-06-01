import { useState, useEffect } from "react";
import { AirtableCard, AirtableCardContent, AirtableCardDescription, AirtableCardHeader, AirtableCardTitle } from "@/components/ui/airtable-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MessageCircle, User, Search, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { ContactDetails } from "@/components/ContactDetails";
import { MessageGeneration } from "@/components/MessageGeneration";

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  location?: string;
  email?: string;
  linkedin_url?: string;
  user_notes?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  companies?: {
    name: string;
  };
}

const TrackingDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  
  // Fetch contacts from Supabase
  const { data: contacts, isLoading, error, refetch } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies (
            name
          )
        `)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      return data as ContactData[];
    }
  });
  
  // Filter contacts based on search query
  const filteredContacts = contacts?.filter(contact => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const companyName = contact.companies?.name?.toLowerCase() || '';
    const role = contact.role?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || 
           companyName.includes(query) || 
           role.includes(query);
  });
  
  const handleViewDetails = (contact: ContactData) => {
    setSelectedContact(contact);
    setIsDetailsOpen(true);
  };
  
  const handleGenerateMessage = (contact: ContactData) => {
    setSelectedContact(contact);
    setIsMessageOpen(true);
  };
  
  const handleContactUpdated = () => {
    refetch();
    setIsDetailsOpen(false);
  };
  
  if (error) {
    toast.error("Failed to load contacts");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-4xl">
        <ProfileBreadcrumbs />
        
        <div className="space-y-6">
          <AirtableCard>
            <AirtableCardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <AirtableCardTitle className="text-2xl font-bold">Contacts</AirtableCardTitle>
                <AirtableCardDescription>
                  View and manage your saved contacts
                </AirtableCardDescription>
              </div>
            </AirtableCardHeader>
            
            <AirtableCardContent>
              <div className="mb-6 flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-muted-foreground ml-3">Loading contacts...</p>
                </div>
              ) : filteredContacts && filteredContacts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.contact_id}>
                          <TableCell className="font-medium">
                            {contact.first_name || ''} {contact.last_name || ''}
                          </TableCell>
                          <TableCell>{contact.companies?.name || 'N/A'}</TableCell>
                          <TableCell>{contact.role || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EnhancedButton
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(contact)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Details
                              </EnhancedButton>
                              <EnhancedButton
                                size="sm"
                                variant="primary"
                                onClick={() => handleGenerateMessage(contact)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Message
                              </EnhancedButton>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium mb-1 text-gray-900">No contacts found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? "No contacts match your search criteria" : "You haven't saved any contacts yet"}
                  </p>
                </div>
              )}
            </AirtableCardContent>
          </AirtableCard>
        </div>
        
        {/* Contact Details Dialog */}
        {selectedContact && (
          <ContactDetails 
            contact={selectedContact}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            onContactUpdated={handleContactUpdated}
          />
        )}
        
        {/* Message Generation Dialog */}
        {selectedContact && selectedContact.companies && (
          <MessageGeneration
            contact={selectedContact}
            companyName={selectedContact.companies.name || ''}
            isOpen={isMessageOpen}
            onClose={() => setIsMessageOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TrackingDashboard;
