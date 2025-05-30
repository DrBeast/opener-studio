
import { useState, useEffect } from "react";
import { Building, Users, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";

interface Company {
  company_id: string;
  name: string;
  industry?: string;
}

interface Contact {
  contact_id: string;
  first_name: string;
  last_name: string;
  role?: string;
  company_id: string;
  company_name?: string;
}

interface CompanyGenerationStepProps {
  onMessageGenerated: () => void;
}

export const CompanyGenerationStep = ({ onMessageGenerated }: CompanyGenerationStepProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!hasGenerated) {
      generateCompaniesAndContacts();
    }
  }, [hasGenerated]);

  const generateCompaniesAndContacts = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      // Generate companies
      const { data: companiesData, error: companiesError } = await supabase.functions.invoke('generate_companies', {
        body: { userId: user.id, count: 5 }
      });

      if (companiesError) throw companiesError;

      // Fetch the generated companies
      const { data: fetchedCompanies } = await supabase
        .from('companies')
        .select('company_id, name, industry')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
        .limit(5);

      if (fetchedCompanies) {
        setCompanies(fetchedCompanies);

        // Generate contacts for each company
        for (const company of fetchedCompanies) {
          await supabase.functions.invoke('generate_contacts', {
            body: { 
              userId: user.id, 
              companyId: company.company_id,
              companyName: company.name,
              count: 2 
            }
          });
        }

        // Fetch all generated contacts
        const { data: fetchedContacts } = await supabase
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
          .order('added_at', { ascending: false })
          .limit(10);

        if (fetchedContacts) {
          const contactsWithCompany = fetchedContacts.map(contact => ({
            ...contact,
            company_name: contact.companies?.name
          }));
          setContacts(contactsWithCompany);
        }
      }

      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating companies and contacts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMessageGeneration = (contact: Contact) => {
    setSelectedContact(contact);
    setIsMessageModalOpen(true);
  };

  const handleMessageClose = () => {
    setIsMessageModalOpen(false);
    setSelectedContact(null);
    onMessageGenerated();
  };

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Building className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Generating Your Network</h3>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="font-medium text-blue-800">Generating companies and contacts...</span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            We're finding companies based on your current role, industry, and location preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Your Target Companies & Contacts</h3>
        <p className="text-muted-foreground">
          Here are 5 companies and key contacts we found for you.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Companies Generated:</h4>
        {companies.map((company) => (
          <Card key={company.company_id} className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-green-600" />
                <div>
                  <h5 className="font-medium">{company.name}</h5>
                  {company.industry && (
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <h4 className="font-medium mt-6">Key Contacts:</h4>
        {contacts.map((contact) => (
          <Card key={contact.contact_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <h5 className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </h5>
                    {contact.role && (
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{contact.company_name}</p>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleMessageGeneration(contact)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Generate Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> You can change your search criteria and add companies/contacts manually later. 
          Click the message icon next to any contact to generate a personalized outreach message.
        </p>
      </div>

      {selectedContact && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.company_name || 'Unknown Company'}
          isOpen={isMessageModalOpen}
          onClose={handleMessageClose}
        />
      )}
    </div>
  );
};
