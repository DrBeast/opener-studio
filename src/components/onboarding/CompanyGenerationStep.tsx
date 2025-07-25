import { useState, useEffect, useRef } from "react";
import { Building, Users, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageGeneration } from "@/components/MessageGeneration";
import { AddContactModal } from "@/components/AddContactModal";
import { createDefaultTargetCriteria } from "@/utils/defaultCriteria";
import { Background } from "@/types/profile";

interface Company {
  company_id: string;
  name: string;
  ai_match_reasoning?: string;
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
    return value.map((item) => String(item));
  }
  return [];
};

export const CompanyGenerationStep = ({
  onMessageGenerated,
}: CompanyGenerationStepProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(
    null
  );
  const [defaultFunctions, setDefaultFunctions] = useState<string[]>([]);

  // Use ref to prevent multiple simultaneous calls
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    const loadBackgroundAndGenerate = async () => {
      const userId = user?.id;

      // Early return if no user, already generated, or currently generating
      if (!userId || hasGenerated || isGeneratingRef.current) {
        return;
      }

      // Set the ref to prevent concurrent calls
      isGeneratingRef.current = true;

      try {
        console.log("Starting onboarding generation for user:", userId);

        // Load user background summary
        const { data: summaryData } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (summaryData) {
          setBackgroundSummary({
            experience: summaryData.experience,
            education: summaryData.education,
            expertise: summaryData.expertise,
            achievements: summaryData.achievements,
            overall_blurb: summaryData.overall_blurb,
            combined_experience_highlights: ensureStringArray(
              summaryData.combined_experience_highlights
            ),
            combined_education_highlights: ensureStringArray(
              summaryData.combined_education_highlights
            ),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(
              summaryData.technical_expertise
            ),
            value_proposition_summary: summaryData.value_proposition_summary,
          });
        }

        // Generate companies and contacts
        await generateCompaniesAndContacts(summaryData, userId);
      } catch (error) {
        console.error("Error in initial load:", error);
      } finally {
        // Reset the ref after completion
        isGeneratingRef.current = false;
      }
    };

    loadBackgroundAndGenerate();
  }, [user?.id, hasGenerated]); // Stable dependency on user?.id

  useEffect(() => {
    const loadDefaultFunctions = async () => {
      if (!user?.id) return;

      try {
        const { data: criteria } = await supabase
          .from("target_criteria")
          .select("target_functions")
          .eq("user_id", user.id)
          .maybeSingle();

        if (criteria?.target_functions) {
          setDefaultFunctions(ensureStringArray(criteria.target_functions));
        }
      } catch (error) {
        console.error("Error loading default functions:", error);
      }
    };

    loadDefaultFunctions();
  }, [user?.id]);

  const generateCompaniesAndContacts = async (
    summaryData: any,
    userId: string
  ) => {
    // Additional safety check - if already generating or generated, return early
    if (isGenerating || hasGenerated) {
      console.log("Generation already in progress or completed, skipping...");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Starting company generation for user:", userId);

      // Check if user has target criteria, if not create default ones
      const { data: existingCriteria } = await supabase
        .from("target_criteria")
        .select("criteria_id")
        .eq("user_id", userId)
        .limit(1);

      if (!existingCriteria || existingCriteria.length === 0) {
        console.log("No target criteria found, creating default ones...");
        await createDefaultTargetCriteria(
          userId,
          summaryData
            ? {
                experience: summaryData.experience,
                education: summaryData.education,
                expertise: summaryData.expertise,
                achievements: summaryData.achievements,
                overall_blurb: summaryData.overall_blurb,
                combined_experience_highlights: ensureStringArray(
                  summaryData.combined_experience_highlights
                ),
                combined_education_highlights: ensureStringArray(
                  summaryData.combined_education_highlights
                ),
                key_skills: ensureStringArray(summaryData.key_skills),
                domain_expertise: ensureStringArray(
                  summaryData.domain_expertise
                ),
                technical_expertise: ensureStringArray(
                  summaryData.technical_expertise
                ),
                value_proposition_summary:
                  summaryData.value_proposition_summary,
              }
            : null
        );
      }

      // Generate companies (count is set to 5 in the edge function)
      console.log("Calling generate_companies function...");
      const { data: companiesData, error: companiesError } =
        await supabase.functions.invoke("generate_companies", {
          body: { userId: userId, count: 5 },
        });

      if (companiesError) {
        console.error("Error generating companies:", companiesError);
        throw companiesError;
      }

      console.log("Companies generation response:", companiesData);

      // Wait a moment for the data to be written
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch the generated companies
      const { data: fetchedCompanies, error: fetchError } = await supabase
        .from("companies")
        .select("company_id, name, ai_match_reasoning")
        .eq("user_id", userId)
        .order("added_at", { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error("Error fetching companies:", fetchError);
        throw fetchError;
      }

      console.log("Fetched companies:", fetchedCompanies);

      if (fetchedCompanies && fetchedCompanies.length > 0) {
        setCompanies(fetchedCompanies);

        // Generate contacts for each company
        for (const company of fetchedCompanies) {
          console.log("Generating contacts for company:", company.name);
          try {
            const { data: contactsData, error: contactsError } =
              await supabase.functions.invoke("generate_contacts", {
                body: {
                  company_id: company.company_id,
                },
              });

            if (contactsError) {
              console.error(
                "Error generating contacts for company:",
                company.name,
                contactsError
              );
            } else {
              console.log(
                "Contacts generation response for",
                company.name,
                ":",
                contactsData
              );

              // Add contacts to database if the response contains suggested contacts
              if (
                contactsData?.status === "success" &&
                contactsData?.contacts
              ) {
                for (const suggestedContact of contactsData.contacts) {
                  try {
                    const { error: insertError } = await supabase
                      .from("contacts")
                      .insert({
                        user_id: userId,
                        company_id: company.company_id,
                        first_name: suggestedContact.name.split(" ")[0] || "",
                        last_name:
                          suggestedContact.name.split(" ").slice(1).join(" ") ||
                          "",
                        role: suggestedContact.role,
                        location: suggestedContact.location,
                        linkedin_url: suggestedContact.linkedin_url,
                        email: suggestedContact.email,
                        bio_summary: suggestedContact.bio_summary,
                        how_i_can_help: suggestedContact.how_i_can_help,
                      });

                    if (insertError) {
                      console.error("Error inserting contact:", insertError);
                    }
                  } catch (insertError) {
                    console.error(
                      "Error inserting contact for",
                      suggestedContact.name,
                      ":",
                      insertError
                    );
                  }
                }
              }
            }
          } catch (contactError) {
            console.error(
              "Error in contact generation process for",
              company.name,
              ":",
              contactError
            );
          }
        }

        // Wait for contacts to be written
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch all generated contacts
        const { data: fetchedContacts, error: contactsFetchError } =
          await supabase
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
            .eq("user_id", userId)
            .order("added_at", { ascending: false });

        if (contactsFetchError) {
          console.error("Error fetching contacts:", contactsFetchError);
        } else {
          console.log("Fetched contacts:", fetchedContacts);

          if (fetchedContacts) {
            const contactsWithCompany = fetchedContacts.map((contact) => ({
              ...contact,
              company_name: contact.companies?.name,
            }));
            setContacts(contactsWithCompany);
          }
        }
      }

      setHasGenerated(true);
      console.log("Company and contact generation completed successfully");
    } catch (error) {
      console.error("Error generating companies and contacts:", error);
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

  const handleAddContactClick = (companyId: string, companyName: string) => {
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setIsContactModalOpen(true);
  };

  const handleContactModalClose = () => {
    setIsContactModalOpen(false);
    setSelectedCompanyId("");
    setSelectedCompanyName("");
  };

  const handleContactCreated = async () => {
    if (!user) return;

    // Refetch contacts after successful creation
    try {
      const { data: refreshedContacts, error } = await supabase
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
        .order("added_at", { ascending: false });

      if (error) {
        console.error("Error refreshing contacts:", error);
        return;
      }

      if (refreshedContacts) {
        const contactsWithCompany = refreshedContacts.map((contact) => ({
          ...contact,
          company_name: contact.companies?.name,
        }));
        setContacts(contactsWithCompany);
      }
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    }

    handleContactModalClose();
  };

  const getContactsForCompany = (companyId: string) => {
    // Get contacts for this company, limit to 1 for onboarding
    const companyContacts = contacts.filter(
      (contact) => contact.company_id === companyId
    );
    return companyContacts.slice(0, 1);
  };

  const getDefaultFunction = (companyName: string) => {
    if (defaultFunctions && defaultFunctions.length > 0) {
      return `${defaultFunctions[0]} Leader at ${companyName}`;
    }
    return `Team Leader at ${companyName}`;
  };

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Building className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Generating Your Network
          </h3>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="font-medium text-blue-800">
              Setting up your preferences and generating companies...
            </span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            We're creating your job search criteria and finding companies and
            contacts based on your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          Your Target Companies & Contacts
        </h3>
        <p className="text-muted-foreground">
          Here are 5 companies and key contacts we found for you.
        </p>
      </div>

      <div className="space-y-4">
        {companies.length > 0 ? (
          companies.map((company) => {
            const companyContacts = getContactsForCompany(company.company_id);
            return (
              <Card
                key={company.company_id}
                className="bg-green-50 border-green-200"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Company Header */}
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-green-600 mt-1" />
                      <div className="flex-1 space-y-2">
                        <h5 className="font-medium text-lg">{company.name}</h5>

                        {/* AI Match Reasoning */}
                        {company.ai_match_reasoning && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {company.ai_match_reasoning}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contacts Section */}
                    <div className="border-t pt-4">
                      <h6 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Key Contacts
                      </h6>
                      <div className="space-y-2">
                        {/* Generated Contact - exactly 1 */}
                        {companyContacts.map((contact) => (
                          <div
                            key={contact.contact_id}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {contact.first_name} {contact.last_name}
                              </p>
                              {contact.role && (
                                <p className="text-xs text-muted-foreground">
                                  {contact.role}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessageGeneration(contact)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Message
                            </Button>
                          </div>
                        ))}

                        {/* Add Your Own Contact Option */}
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-dashed">
                          <div>
                            <p className="font-medium text-sm">
                              Your Own Contact
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getDefaultFunction(company.name)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAddContactClick(
                                company.company_id,
                                company.name
                              )
                            }
                            className="flex items-center gap-1 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-muted-foreground text-center">
            No companies generated yet.
          </p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> We've auto-generated your job search criteria
          based on your profile. You can customize these preferences later in
          the Job Targets section. Click the message button next to any contact
          to generate a personalized outreach message.
        </p>
      </div>

      {selectedContact && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.company_name || "Unknown Company"}
          isOpen={isMessageModalOpen}
          onClose={handleMessageClose}
        />
      )}

      {selectedCompanyId && (
        <AddContactModal
          isOpen={isContactModalOpen}
          onClose={handleContactModalClose}
          companyId={selectedCompanyId}
          companyName={selectedCompanyName}
          onSuccess={handleContactCreated}
        />
      )}
    </div>
  );
};
