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
  // State to track if contact was actually created in database
  const [createdContact, setCreatedContact] = useState<CreatedContact | null>(null);

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

  const handleProcessBio = async () => {
    if (!user || !linkedinBio.trim()) return;

    setIsGenerating(true);
    try {
      // Step 1: Generate contact from bio
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
        
        // Step 2: Automatically create the contact
        await handleAutoCreateContact(data.contact);
        
        setLinkedinBio("");
      } else {
        throw new Error("No contact data received");
      }
    } catch (error: any) {
      console.error("Error processing bio:", error);
      toast.error("Failed to process LinkedIn bio");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoCreateContact = async (contactData: GeneratedContact) => {
    if (!user) return;

    setIsCreating(true);
    console.log("[Auto Create] Starting contact creation flow. Preview data:", contactData);

    try {
      // Step 1: Check for contact duplicates FIRST
      const hasContactDuplicates = await checkForDuplicateContact(
        contactData.first_name,
        contactData.last_name,
        contactData.role
      );
      
      if (hasContactDuplicates.isDuplicate) {
        setPotentialContactDuplicates(hasContactDuplicates.potentialDuplicates);
        setShowContactDuplicateDialog(true);
        setIsCreating(false);
        return;
      }

      // Step 2: Only check for company duplicates if contact is new
      let finalCompanyId = selectedCompanyId;
      if (!finalCompanyId && contactData.current_company) {
        const companyCheck = await checkForDuplicateCompany(contactData.current_company);
        if (companyCheck.isDuplicate) {
          setPotentialDuplicates(companyCheck.potentialDuplicates);
          setShowDuplicateDialog(true);
          setIsCreating(false);
          return;
        }
        finalCompanyId = await createNewCompany(contactData.current_company);
      }

      // Step 3: Perform the database insert (contact is definitely new at this point)
      const newContact = await performDatabaseInsert(finalCompanyId);

      // Step 4: If successful, set created contact and pass to parent
      if (newContact) {
        console.log("[Auto Create] Success. Calling onContactCreated with:", newContact);
        setCreatedContact(newContact);
        onContactCreated(newContact);
        toast.success("Contact created successfully!");
      }
    } catch (error) {
      console.error("Error in auto create:", error);
      toast.error("Failed to create contact automatically");
    } finally {
      setIsCreating(false);
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
          linkedin_bio: linkedinBio, // Store the original LinkedIn bio
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

  const handleUseExistingCompany = async (companyId: string) => {
    setShowDuplicateDialog(false);
    setIsCreating(true);
    const newContact = await performDatabaseInsert(companyId);
    if (newContact) {
      setCreatedContact(newContact);
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
        setCreatedContact(newContact);
        onContactCreated(newContact);
        toast.success("Contact created successfully with new company!");
      }
    } catch (error) {
      console.error("Error creating new company:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExistingContact = async (contactId: string) => {
    setShowContactDuplicateDialog(false);
    setIsCreating(true);
    
    try {
      console.log("[Update Contact] Starting update for contact:", contactId);
      
      // Step 1: Regenerate the contact profile using the new LinkedIn bio
      console.log("[Update Contact] Calling add_contact_by_bio edge function");
      const { data, error } = await supabase.functions.invoke(
        "add_contact_by_bio",
        {
          body: {
            linkedin_bio: linkedinBio,
          },
        }
      );

      if (error) {
        console.error("[Update Contact] Edge function error:", error);
        throw error;
      }

      if (!data?.contact) {
        console.error("[Update Contact] No contact data received from edge function");
        throw new Error("No contact data received from edge function");
      }

      console.log("[Update Contact] Edge function response:", data.contact);

      // Step 2: Update the existing contact with the new information
      console.log("[Update Contact] Updating contact in database");
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: data.contact.first_name,
          last_name: data.contact.last_name,
          role: data.contact.role,
          location: data.contact.location,
          linkedin_bio: linkedinBio,
          bio_summary: data.contact.bio_summary,
          how_i_can_help: data.contact.how_i_can_help,
          recent_activity_summary: data.contact.recent_activity_summary,
          updated_at: new Date().toISOString(),
        })
        .eq('contact_id', contactId);

      if (updateError) {
        console.error("[Update Contact] Database update error:", updateError);
        throw updateError;
      }

      console.log("[Update Contact] Contact updated successfully");

      // Step 3: Fetch the updated contact data for message generation
      console.log("[Update Contact] Fetching updated contact data");
      const { data: updatedContact, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (fetchError) {
        console.error("[Update Contact] Fetch error:", fetchError);
        throw fetchError;
      }

      console.log("[Update Contact] Fetched updated contact:", updatedContact);

      if (updatedContact) {
        // Create a contact object that matches our CreatedContact interface
        const contactForGeneration: CreatedContact = {
          contact_id: updatedContact.contact_id,
          first_name: updatedContact.first_name || '',
          last_name: updatedContact.last_name || '',
          role: updatedContact.role || '',
          current_company: data.contact.current_company || '',
          location: updatedContact.location || '',
          bio_summary: updatedContact.bio_summary || '',
          how_i_can_help: updatedContact.how_i_can_help || '',
          recent_activity_summary: updatedContact.recent_activity_summary || '',
          company_id: updatedContact.company_id
        };

        // If there's a company_id, fetch the company name
        if (updatedContact.company_id) {
          console.log("[Update Contact] Fetching company name for:", updatedContact.company_id);
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('company_id', updatedContact.company_id)
            .single();
          
          if (company) {
            contactForGeneration.current_company = company.name;
            console.log("[Update Contact] Company name:", company.name);
          }
        }

        console.log("[Update Contact] Final contact object:", contactForGeneration);
        setCreatedContact(contactForGeneration);
        onContactCreated(contactForGeneration);
        toast.success("Contact profile updated with latest LinkedIn data!");
      }
    } catch (error) {
      console.error("[Update Contact] Full error details:", error);
      toast.error("Failed to update contact profile");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateNewContact = async () => {
    setShowContactDuplicateDialog(false);
    setIsCreating(true);
    
    try {
      // Step 1: Check for company duplicates if we have a company name but no company ID
      let finalCompanyId = selectedCompanyId;
      if (!finalCompanyId && generatedContact?.current_company) {
        const companyCheck = await checkForDuplicateCompany(generatedContact.current_company);
        if (companyCheck.isDuplicate) {
          setPotentialDuplicates(companyCheck.potentialDuplicates);
          setShowDuplicateDialog(true);
          setIsCreating(false);
          return;
        }
        finalCompanyId = await createNewCompany(generatedContact.current_company);
      }

      // Step 2: Create the contact with the final company ID
      const newContact = await performDatabaseInsert(finalCompanyId);
      if (newContact) {
        setCreatedContact(newContact);
        onContactCreated(newContact);
        toast.success("Contact created successfully!");
      }
    } catch (error) {
      console.error("Error creating new contact:", error);
      toast.error("Failed to create contact");
    } finally {
      setIsCreating(false);
    }
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
    setCreatedContact(null);
    setShowDuplicateDialog(false);
    setPotentialDuplicates([]);
    setShowContactDuplicateDialog(false);
    setPotentialContactDuplicates([]);
    setPendingCompanyId(null);
  };
  
  // Check if we have a created contact to determine the current phase
  const hasCreatedContact = createdContact && !isGenerating && !isCreating;
  
  return (
    <div className="space-y-4">
      {/* Phase 1: Bio Input */}
      {!hasCreatedContact && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Add New Contact</h3>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
               <p className="font-medium mb-1">Who should I contact?</p>
                      <p className="mb-1">
                        Whether you are looking for referrals or exploring
                        roles, the most relevant contacts are people you already
                        know: classmates, friends, ex-colleagues.
                      </p>
                      <p>
                        If you're expanding your network, consider reaching out
                        to people in the same function or recruiters. On
                        LinkedIn, try searching for [company name] [function].
                      </p>
              </div>
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-3">
            <Textarea
              value={linkedinBio}
              onChange={(e) => setLinkedinBio(e.target.value)}
              placeholder="Go the their LinkedIn profile, copy everything (Ctrl+A, Ctrl+C) and paste it here (Ctrl + V)"
              className="min-h-[120px] text-sm resize-none"
            />

            <PrimaryAction
              onClick={handleProcessBio}
              disabled={!linkedinBio.trim() || isGenerating || isCreating}
              className="w-full"
              size="default"
            >
              {isGenerating || isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Bio...
                </>
              ) : (
                "Process Bio"
              )}
            </PrimaryAction>
          </div>
        </div>
      )}

      {/* Phase 2: Contact Created */}
      {hasCreatedContact && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-800">Contact Created</h3>
          </div>

          {/* Compact Contact Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900">
                    {createdContact.first_name} {createdContact.last_name}
                  </h4>
                  <p className="text-sm text-green-700">
                    {createdContact.role} at {createdContact.current_company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetWorkflow}
            className="w-full"
          >
            Add Another Contact
          </Button>
        </div>
      )}

      {/* Duplicate Dialogs */}
      <CompanyDuplicateDialog
        isOpen={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        potentialDuplicates={potentialDuplicates}
        onUseExisting={handleUseExistingCompany}
        onCreateNew={handleCreateNewCompany}
        companyName={generatedContact?.current_company || ""}
      />

      <ContactDuplicateDialog
        isOpen={showContactDuplicateDialog}
        onClose={() => setShowContactDuplicateDialog(false)}
        potentialDuplicates={potentialContactDuplicates}
        onUseExisting={handleUseExistingContact}
        onCreateNew={handleCreateNewContact}
        newContactName={
          generatedContact
            ? `${generatedContact.first_name} ${generatedContact.last_name}`
            : ""
        }
      />
    </div>
  );
};