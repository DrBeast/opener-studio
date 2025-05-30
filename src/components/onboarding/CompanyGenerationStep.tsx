
import { useState, useEffect } from "react";
import { Building, Users, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";
import { createDefaultTargetCriteria } from "@/utils/defaultCriteria";
import { Background } from "@/types/profile";

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

// Helper function to ensure we have a string array from Json type
const ensureStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
};

export const CompanyGenerationStep = ({ onMessageGenerated }: CompanyGenerationStepProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);

  useEffect(() => {
    const loadBackgroundAndGenerate = async () => {
      if (!user || hasGenerated) return;

      try {
        // Load user background summary
        const { data: summaryData } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (summaryData) {
          setBackgroundSummary({
            experience: summaryData.experience,
            education: summaryData.education,
            expertise: summaryData.expertise,
            achievements: summaryData.achievements,
            overall_blurb: summaryData.overall_blurb,
            combined_experience_highlights: ensureStringArray(summaryData.combined_experience_highlights),
            combined_education_highlights: ensureStringArray(summaryData.combined_education_highlights),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(summaryData.technical_expertise),
            value_proposition_summary: summaryData.value_proposition_summary
          });
        }

        // Generate companies and contacts
        await generateCompaniesAndContacts(summaryData);
      } catch (error) {
        console.error('Error in initial load:', error);
      }
    };

    loadBackgroundAndGenerate();
  }, [user, hasGenerated]);

  const generateCompaniesAndContacts = async (summaryData: any) => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      console.log('Starting company generation for user:', user.id);
      
      // Check if user has target criteria, if not create default ones
      const { data: existingCriteria } = await supabase
        .from('target_criteria')
        .select('criteria_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingCriteria || existingCriteria.length === 0) {
        console.log('No target criteria found, creating default ones...');
        await createDefaultTargetCriteria(user.id, summaryData ? {
          experience: summaryData.experience,
          education: summaryData.education,
          expertise: summaryData.expertise,
          achievements: summaryData.achievements,
          overall_blurb: summaryData.overall_blurb,
          combined_experience_highlights: ensureStringArray(summaryData.combined_experience_highlights),
          combined_education_highlights: ensureStringArray(summaryData.combined_education_highlights),
          key_skills: ensureStringArray(summaryData.key_skills),
          domain_expertise: ensureStringArray(summaryData.domain_expertise),
          technical_expertise: ensureStringArray(summaryData.technical_expertise),
          value_proposition_summary: summaryData.value_proposition_summary
        } : null);
      }
      
      // Generate companies
      const { data: companiesData, error: companiesError } = await supabase.functions.invoke('generate_companies', {
        body: { userId: user.id, count: 5 }
      });

      if (companiesError) {
        console.error('Error generating companies:', companiesError);
        throw companiesError;
      }

      console.log('Companies generation response:', companiesData);

      // Wait a moment for the data to be written
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fetch the generated companies
      const { data: fetchedCompanies, error: fetchError } = await supabase
        .from('companies')
        .select('company_id, name, industry')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error('Error fetching companies:', fetchError);
        throw fetchError;
      }

      console.log('Fetched companies:', fetchedCompanies);

      if (fetchedCompanies && fetchedCompanies.length > 0) {
        setCompanies(fetchedCompanies);

        // Generate contacts for each company
        for (const company of fetchedCompanies) {
          console.log('Generating contacts for company:', company.name);
          const { data: contactsData, error: contactsError } = await supabase.functions.invoke('generate_contacts', {
            body: { 
              userId: user.id, 
              companyId: company.company_id,
              companyName: company.name,
              count: 2 
            }
          });

          if (contactsError) {
            console.error('Error generating contacts for company:', company.name, contactsError);
          } else {
            console.log('Contacts generation response for', company.name, ':', contactsData);
          }
        }

        // Wait for contacts to be written
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch all generated contacts
        const { data: fetchedContacts, error: contactsFetchError } = await supabase
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

        if (contactsFetchError) {
          console.error('Error fetching contacts:', contactsFetchError);
        } else {
          console.log('Fetched contacts:', fetchedContacts);
          
          if (fetchedContacts) {
            const contactsWithCompany = fetchedContacts.map(contact => ({
              ...contact,
              company_name: contact.companies?.name
            }));
            setContacts(contactsWithCompany);
          }
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
            <span className="font-medium text-blue-800">Setting up your preferences and generating companies...</span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            We're creating your job search criteria and finding companies based on your profile.
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
        {companies.length > 0 ? (
          companies.map((company) => (
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
          ))
        ) : (
          <p className="text-muted-foreground text-center">No companies generated yet.</p>
        )}

        <h4 className="font-medium mt-6">Key Contacts:</h4>
        {contacts.length > 0 ? (
          contacts.map((contact) => (
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
          ))
        ) : (
          <p className="text-muted-foreground text-center">No contacts generated yet.</p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> We've auto-generated your job search criteria based on your profile. 
          You can customize these preferences later in the Job Targets section. 
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
