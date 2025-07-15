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

// localStorage utilities (no changes)
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
  onContactCreated: (newContact: CreatedContact) => void;
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
}

interface CreatedContact extends GeneratedContact {
  contact_id: string;
  company_id?: string | null;
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

  // Load state from localStorage on mount
  useEffect(() => {
    if (!user) return;

    const storageKey = `${user.id}`;
    const savedLinkedinBio = loadFromStorage(`${storageKey}-linkedinBio`);
    const savedGeneratedContact = loadFromStorage(
      `${storageKey}-generatedContact`
    );

    if (savedLinkedinBio) {
      setLinkedinBio(savedLinkedinBio);
    }

    if (savedGeneratedContact) {
      console.log(
        "Loaded generatedContact from storage:",
        savedGeneratedContact
      );
      setGeneratedContact(savedGeneratedContact);
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
      console.log("Saving generatedContact to storage:", generatedContact);
      saveToStorage(`${storageKey}-generatedContact`, generatedContact);
    } else {
      clearStorage(`${storageKey}-generatedContact`);
    }
  }, [generatedContact, user]);

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
        setLinkedinBio("");
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
      return true;
    }
    return false;
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

  // --- REVISED ---
  // This function now only performs the database insert and returns the result.
  const performDatabaseInsert = async (
    companyId: string | null
  ): Promise<CreatedContact | null> => {
    if (!generatedContact || !user) {
      console.error("[DB Insert] Aborting: Missing generatedContact or user.");
      return null;
    }
    console.log(
      `[DB Insert] Inserting contact for user ${user.id} with companyId: ${companyId}`
    );
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

      console.log("[DB Insert] Successfully inserted. DB record:", data);
      return {
        ...generatedContact,
        contact_id: data.contact_id,
        company_id: companyId,
      };
    } catch (error) {
      console.error("Error during DB insert:", error);
      toast.error("Failed to save contact to database.");
      return null;
    }
  };

  // This is the main handler function. It orchestrates all checks and sets the state.
  const handleCreateContact = async () => {
    if (!generatedContact) return;
    setIsCreating(true);
    console.log(
      "[Handler] Starting contact creation flow. Preview data:",
      generatedContact
    );

    // Step 1: Check for contact duplicates first.
    const hasContactDuplicates = await checkForDuplicateContact(
      generatedContact.first_name,
      generatedContact.last_name,
      generatedContact.role
    );
    if (hasContactDuplicates.isDuplicate) {
      setPotentialContactDuplicates(hasContactDuplicates.potentialDuplicates);
      setShowContactDuplicateDialog(true);
      setIsCreating(false);
      return;
    }

    // Step 2: Determine the company ID.
    let finalCompanyId = selectedCompanyId;
    if (!finalCompanyId && generatedContact.current_company) {
      const companyCheck = await checkForDuplicateCompany(
        generatedContact.current_company
      );
      if (companyCheck.isDuplicate) {
        setPotentialDuplicates(companyCheck.potentialDuplicates);
        setShowDuplicateDialog(true);
        setIsCreating(false);
        return;
      }
      finalCompanyId = await createNewCompany(generatedContact.current_company);
    }

    // Step 3: Perform the database insert.
    const newContact = await performDatabaseInsert(finalCompanyId);

    // Step 4: If successful, pass to parent
    if (newContact) {
      console.log(
        "[Handler] DB insert successful. Calling onContactCreated with:",
        newContact
      );
      onContactCreated(newContact);
      toast.success("Contact created successfully!");
    }

    setIsCreating(false);
  };

  const handleUseExistingCompany = async (companyId: string) => {
    setShowDuplicateDialog(false);
    setIsCreating(true);
    const newContact = await performDatabaseInsert(companyId);
    if (newContact) {
      onContactCreated(newContact);
      toast.success("Contact created successfully with existing company!");
    }
    setIsCreating(false);
  };

  const handleCreateNewCompany = async () => {
    if (!generatedContact?.current_company) return;
    setShowDuplicateDialog(false);
    setIsCreating(true);
    try {
      const newCompanyId = await createNewCompany(
        generatedContact.current_company
      );
      const newContact = await performDatabaseInsert(newCompanyId);
      if (newContact) {
        onContactCreated(newContact);
        toast.success("Contact created successfully with new company!");
      }
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
    const newContact = await performDatabaseInsert(pendingCompanyId);
    if (newContact) {
      onContactCreated(newContact);
      toast.success("Contact created successfully!");
    }
    setIsCreating(false);
  };

  const resetWorkflow = () => {
    if (user) {
      const storageKey = `${user.id}`;
      clearStorage(`${storageKey}-linkedinBio`);
      clearStorage(`${storageKey}-generatedContact`);
    }

    setSelectedCompanyId("");
    setLinkedinBio("");
    setGeneratedContact(null);
    setShowDuplicateDialog(false);
    setPotentialDuplicates([]);
    setShowContactDuplicateDialog(false);
    setPotentialContactDuplicates([]);
    setPendingCompanyId(null);
  };

  const handleMessageSaved = () => {
    toast.success("Message saved and workflow completed!");
    resetWorkflow();
  };

  return (
    <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Creation Panel */}
        <div className="space-y-4 p-4 rounded-lg border-2 transition-all border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Add New Contact</h3>
          </div>

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
        </div>

        {/* Message Generation Panel */}
        <div className="space-y-4 p-4 rounded-lg border-2 transition-all border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Generate Outreach Message</h3>
          </div>

          <MessageGeneration
            contact={null}
            companyName={generatedContact?.current_company || ""}
            isOpen={true}
            onClose={() => {}}
            onMessageSaved={handleMessageSaved}
            embedded={true}
            disabled={true}
          />
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
    </div>
  );
};
