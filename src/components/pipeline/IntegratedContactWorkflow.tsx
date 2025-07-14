import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AirtableCard,
  AirtableCardContent,
} from "@/components/ui/airtable-card";
import {
  Info,
  Loader2,
  User,
  Building,
  ArrowRight,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { MessageGeneration } from "@/components/MessageGeneration";
import { PrimaryAction } from "@/components/ui/design-system";
import { CompanyDuplicateDialog } from "./CompanyDuplicateDialog";
import { ContactDuplicateDialog } from "./ContactDuplicateDialog";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";

// localStorage utilities
const STORAGE_KEY = "contact-workflow-state";

const saveToStorage = (key: string, value: any) => {
  try {
    const data = {
      value,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
};

const loadFromStorage = (key: string) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${key}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Clear data older than 24 hours
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_KEY}-${key}`);
      return null;
    }

    return parsed.value;
  } catch (error) {
    console.warn("Failed to load from localStorage:", error);
    return null;
  }
};

const clearStorage = (key: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY}-${key}`);
  } catch (error) {
    console.warn("Failed to clear localStorage:", error);
  }
};

interface IntegratedContactWorkflowProps {
  companies: Array<{ company_id: string; name: string }>;
  onContactCreated: () => void;
}

interface GeneratedContact {
  first_name: string;
  last_name: string;
  role: string;
  current_company: string;
  location: string;
  bio_summary: string;
  how_i_can_help: string;
  recent_activity_summary: string;
  email?: string;
  linkedin_url?: string;
  contact_id?: string;
  company_id?: string;
}

interface PotentialDuplicate {
  company_id: string;
  name: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface PotentialContactDuplicate {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name?: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export const IntegratedContactWorkflow = ({
  companies,
  onContactCreated,
}: IntegratedContactWorkflowProps) => {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [linkedinBio, setLinkedinBio] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedContact, setGeneratedContact] =
    useState<GeneratedContact | null>(null);
  const [createdContact, setCreatedContact] = useState<GeneratedContact | null>(
    null
  );
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<
    PotentialDuplicate[]
  >([]);
  const [showContactDuplicateDialog, setShowContactDuplicateDialog] =
    useState(false);
  const [potentialContactDuplicates, setPotentialContactDuplicates] = useState<
    PotentialContactDuplicate[]
  >([]);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!user) return;

    const storageKey = `${user.id}`;
    const savedLinkedinBio = loadFromStorage(`${storageKey}-linkedinBio`);
    const savedGeneratedContact = loadFromStorage(
      `${storageKey}-generatedContact`
    );
    const savedCreatedContact = loadFromStorage(
      `${storageKey}-createdContact`
    );

    if (savedLinkedinBio) {
      setLinkedinBio(savedLinkedinBio);
    }

    if (savedGeneratedContact) {
      setGeneratedContact(savedGeneratedContact);
    }

    if (savedCreatedContact) {
      setCreatedContact(savedCreatedContact);
    }
  }, [user]);

  // Save linkedinBio to localStorage with debouncing
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(() => {
      const storageKey = `${user.id}`;
      if (linkedinBio.trim()) {
        saveToStorage(`${storageKey}-linkedinBio`, linkedinBio);
      } else {
        clearStorage(`${storageKey}-linkedinBio`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [linkedinBio, user]);

  // Save generatedContact to localStorage
  useEffect(() => {
    if (!user) return;

    const storageKey = `${user.id}`;
    if (generatedContact) {
      saveToStorage(`${storageKey}-generatedContact`, generatedContact);
    } else {
      clearStorage(`${storageKey}-generatedContact`);
    }
  }, [generatedContact, user]);

  // Save createdContact to localStorage
  useEffect(() => {
    if (!user) return;

    const storageKey = `${user.id}`;
    if (createdContact) {
      saveToStorage(`${storageKey}-createdContact`, createdContact);
    } else {
      clearStorage(`${storageKey}-createdContact`);
    }
  }, [createdContact, user]);

  const selectedCompany = companies.find(
    (c) => c.company_id === selectedCompanyId
  );

  const handleGenerateContact = async () => {
    if (!user || !linkedinBio.trim()) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            linkedin_bio: linkedinBio.trim(),
          },
        }
      );

      if (error) throw error;

      if (data?.contact) {
        setGeneratedContact(data.contact);
        setLinkedinBio(""); // Clear the input field after successful generation
      } else {
        throw new Error("No contact data received");
      }
    } catch (error: any) {
      console.error("Error generating contact:", error);
      toast.error("Failed to generate contact information");
    } finally {
      setIsGenerating(false);
    }
  };

  const checkForDuplicateCompany = async (companyName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "check_company_duplicates",
        {
          body: { companyName },
        }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error checking for duplicate companies:", error);
      return { isDuplicate: false, potentialDuplicates: [] };
    }
  };

  const checkForDuplicateContact = async (
    first_name: string,
    last_name: string,
    role: string,
    company_id: string | null = null
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "check_contact_duplicates",
        {
          body: { first_name, last_name, role, company_id },
        }
      );

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error checking for duplicate contacts:", error);
      return { isDuplicate: false, potentialDuplicates: [] };
    }
  };

  const checkAndHandleContactDuplicates = async (
    companyId: string | null = null
  ) => {
    if (!generatedContact) return false;

    const contactDuplicateCheck = await checkForDuplicateContact(
      generatedContact.first_name,
      generatedContact.last_name,
      generatedContact.role,
      companyId
    );

    if (
      contactDuplicateCheck.isDuplicate &&
      contactDuplicateCheck.potentialDuplicates.length > 0
    ) {
      setPotentialContactDuplicates(contactDuplicateCheck.potentialDuplicates);
      setShowContactDuplicateDialog(true);
      setPendingCompanyId(companyId);
      return true; // Duplicates found
    }

    return false; // No duplicates
  };

  const createNewCompany = async (companyName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_company_by_name",
        {
          body: { companyName },
        }
      );

      if (error) throw error;
      return data.company.company_id;
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  };

  const handleCreateContact = async () => {
    if (!generatedContact || !user) return;

    setIsCreating(true);
    try {
      // First check for contact duplicates without any company context
      const hasContactDuplicates = await checkAndHandleContactDuplicates();
      if (hasContactDuplicates) {
        setIsCreating(false);
        return;
      }

      let finalCompanyId = selectedCompanyId;

      // If no company is selected but we have a company name from the generated contact
      if (!finalCompanyId && generatedContact.current_company) {
        const duplicateCheck = await checkForDuplicateCompany(
          generatedContact.current_company
        );

        if (
          duplicateCheck.isDuplicate &&
          duplicateCheck.potentialDuplicates.length > 0
        ) {
          // Show duplicate dialog
          setPotentialDuplicates(duplicateCheck.potentialDuplicates);
          setShowDuplicateDialog(true);
          setIsCreating(false);
          return;
        } else {
          // Create new company
          finalCompanyId = await createNewCompany(
            generatedContact.current_company
          );
        }
      }

      await createContactWithCompany(finalCompanyId);
    } catch (error) {
      console.error("Error in contact creation flow:", error);
      toast.error("Failed to create contact");
      setIsCreating(false);
    }
  };

  const createContactWithCompany = async (companyId: string | null) => {
    if (!generatedContact || !user) return;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          company_id: companyId,
          first_name: generatedContact.first_name,
          last_name: generatedContact.last_name,
          role: generatedContact.role,
          location: generatedContact.location,
          email: generatedContact.email,
          linkedin_url: generatedContact.linkedin_url,
          bio_summary: generatedContact.bio_summary,
          how_i_can_help: generatedContact.how_i_can_help,
          recent_activity_summary: generatedContact.recent_activity_summary,
          added_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Store the created contact with the contact_id and company_id
      const contactWithId = { 
        ...generatedContact, 
        contact_id: data.contact_id,
        company_id: data.company_id
      };
      setCreatedContact(contactWithId);
      onContactCreated();
      toast.success("Contact created successfully!");
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExistingCompany = async (companyId: string) => {
    setShowDuplicateDialog(false);
    setIsCreating(true);

    // Check for contact duplicates with the specific company
    const hasContactDuplicates = await checkAndHandleContactDuplicates(
      companyId
    );
    if (hasContactDuplicates) {
      setIsCreating(false);
      return;
    }

    await createContactWithCompany(companyId);
  };

  const handleCreateNewCompany = async () => {
    if (!generatedContact?.current_company) return;

    setShowDuplicateDialog(false);
    setIsCreating(true);

    try {
      const newCompanyId = await createNewCompany(
        generatedContact.current_company
      );

      // Check for contact duplicates with the new company
      const hasContactDuplicates = await checkAndHandleContactDuplicates(
        newCompanyId
      );
      if (hasContactDuplicates) {
        setIsCreating(false);
        return;
      }

      await createContactWithCompany(newCompanyId);
    } catch (error) {
      console.error("Error creating new company:", error);
      toast.error("Failed to create contact");
      setIsCreating(false);
    }
  };

  const handleUseExistingContact = async (contactId: string) => {
    setShowContactDuplicateDialog(false);
    toast.success("Contact already exists in your pipeline!");
    resetWorkflow();
  };

  const handleCreateNewContact = async () => {
    setShowContactDuplicateDialog(false);
    setIsCreating(true);
    await createContactWithCompany(pendingCompanyId);
  };

  const resetWorkflow = () => {
    if (user) {
      const storageKey = `${user.id}`;
      clearStorage(`${storageKey}-linkedinBio`);
      clearStorage(`${storageKey}-generatedContact`);
      clearStorage(`${storageKey}-createdContact`);
    }

    setSelectedCompanyId("");
    setLinkedinBio("");
    setGeneratedContact(null);
    setCreatedContact(null);
    setShowDuplicateDialog(false);
    setPotentialDuplicates([]);
    setShowContactDuplicateDialog(false);
    setPotentialContactDuplicates([]);
    setPendingCompanyId(null);
    setShowContactDetails(false);
  };

  const handleMessageSaved = () => {
    toast.success("Message saved!");
    // Open the contact details modal on the Messages tab
    if (createdContact?.contact_id) {
      setShowContactDetails(true);
    }
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Creation Panel */}
        <div
          className={`space-y-4 p-4 rounded-lg border-2 transition-all ${
            !createdContact
              ? "border-primary/20 bg-primary/5"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Add New Contact</h3>
            {createdContact && (
              <div className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                ✓ Complete
              </div>
            )}
          </div>

          {!createdContact ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column - LinkedIn Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={linkedinBio}
                    onChange={(e) => setLinkedinBio(e.target.value)}
                    placeholder="Paste their LinkedIn profile: copy everything (Ctrl+A, Ctrl+C) and paste it here (Ctrl + V)"
                    className="min-h-[120px] text-sm"
                  />
                </div>

                <PrimaryAction
                  onClick={handleGenerateContact}
                  disabled={!linkedinBio.trim() || isGenerating}
                  className="w-full"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Contact...
                    </>
                  ) : (
                    "Generate Contact"
                  )}
                </PrimaryAction>
              </div>

              {/* Right Column - Contact Preview or Info Box */}
              <div className="space-y-4">
                {generatedContact ? (
                  <AirtableCard className="border-green-200 bg-green-50">
                    <AirtableCardContent className="p-4">
                      <h4 className="font-medium mb-3 text-green-800 text-sm">
                        Contact Preview
                      </h4>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-green-700 font-semibold text-sm">
                              {generatedContact.first_name?.[0]}
                              {generatedContact.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate text-green-800">
                              {generatedContact.first_name}{" "}
                              {generatedContact.last_name}
                            </h5>
                            {generatedContact.role && (
                              <p className="text-xs text-green-700">
                                {generatedContact.role}
                              </p>
                            )}
                            {generatedContact.current_company && (
                              <p className="text-xs text-green-600">
                                {generatedContact.current_company}
                              </p>
                            )}
                            {generatedContact.location && (
                              <p className="text-xs text-green-600">
                                {generatedContact.location}
                              </p>
                            )}
                          </div>
                        </div>

                        {generatedContact.bio_summary && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">
                              Background
                            </p>
                            <p className="text-xs text-green-700 leading-relaxed">
                              {generatedContact.bio_summary}
                            </p>
                          </div>
                        )}

                        {generatedContact.how_i_can_help && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">
                              How I Can Help
                            </p>
                            <p className="text-xs text-green-700 leading-relaxed">
                              {generatedContact.how_i_can_help}
                            </p>
                          </div>
                        )}

                        {generatedContact.email && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">
                              Email
                            </p>
                            <p className="text-xs text-green-600">
                              {generatedContact.email}
                            </p>
                          </div>
                        )}

                        {generatedContact.linkedin_url && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-green-800">
                              LinkedIn
                            </p>
                            <a
                              href={generatedContact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        )}

                        <PrimaryAction
                          onClick={handleCreateContact}
                          disabled={isCreating}
                          className="w-full mt-4"
                          size="sm"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Contact"
                          )}
                        </PrimaryAction>
                      </div>
                    </AirtableCardContent>
                  </AirtableCard>
                ) : (
                  <AirtableCard className="bg-blue-50 border-blue-200">
                    <AirtableCardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">
                            Who should I contact?
                          </p>
                          <p className="mb-1">
                            Whether you are looking for referrals or exploring
                            roles, the most relevant contacts are people you
                            already know: classmates, friends, ex-colleagues.
                          </p>
                          <p>
                            If you're expanding your network, consider reaching
                            out to people in the same function or recruiters. On
                            LinkedIn, try searching for [company name]
                            [function].
                          </p>
                        </div>
                      </div>
                    </AirtableCardContent>
                  </AirtableCard>
                )}
              </div>
            </div>
          ) : (
            /* Contact Created State */
            <AirtableCard className="border-green-200 bg-green-50">
              <AirtableCardContent className="p-3">
                <div className="text-center space-y-2">
                  <div className="text-green-600">✓</div>
                  <h4 className="font-medium text-green-800 text-sm">
                    Contact Created
                  </h4>
                  <p className="text-sm text-green-700">
                    {createdContact.first_name} {createdContact.last_name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWorkflow}
                    className="text-xs"
                  >
                    Create Another Contact
                  </Button>
                </div>
              </AirtableCardContent>
            </AirtableCard>
          )}
        </div>

        {/* Message Generation Panel */}
        <div
          className={`space-y-4 p-4 rounded-lg border-2 transition-all ${
            createdContact
              ? "border-primary/20 bg-primary/5"
              : "border-gray-200 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Generate Message</h3>
            {!createdContact && (
              <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Waiting for contact
              </div>
            )}
          </div>

          {createdContact ? (
            <div className="space-y-4">
              <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-medium text-blue-800 mb-1">
                  Generating message for:
                </p>
                <p className="text-blue-700">
                  {createdContact.first_name} {createdContact.last_name}
                </p>
              </div>

              <MessageGeneration
                contact={{
                  contact_id: createdContact.contact_id || "",
                  first_name: createdContact.first_name,
                  last_name: createdContact.last_name,
                  role: createdContact.role,
                  company_id: createdContact.company_id || "",
                }}
                companyName={
                  selectedCompany?.name || createdContact.current_company
                }
                isOpen={true}
                onClose={() => {}}
                onMessageSaved={handleMessageSaved}
                embedded={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Create a contact first to generate a message
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CompanyDuplicateDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        companyName={generatedContact?.current_company || ""}
        potentialDuplicates={potentialDuplicates}
        onCreateNew={handleCreateNewCompany}
        onUseExisting={handleUseExistingCompany}
      />

      <ContactDuplicateDialog
        isOpen={showContactDuplicateDialog}
        onClose={() => setShowContactDuplicateDialog(false)}
        onUseExisting={handleUseExistingContact}
        onCreateNew={handleCreateNewContact}
        potentialDuplicates={potentialContactDuplicates}
        newContactName={
          generatedContact
            ? `${generatedContact.first_name} ${generatedContact.last_name}`
            : ""
        }
      />

      {/* Contact Details Modal for Messages */}
      {showContactDetails && createdContact?.contact_id && (
        <EnhancedContactDetails
          contactId={createdContact.contact_id}
          isOpen={showContactDetails}
          onClose={() => setShowContactDetails(false)}
          onContactUpdated={() => {}}
          defaultTab="messages"
        />
      )}
    </div>
  );
};
