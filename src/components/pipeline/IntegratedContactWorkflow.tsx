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
import { InfoBox, PrimaryAction } from "@/components/ui/design-system";
import {
  AirtableCard,
  AirtableCardContent,
} from "@/components/ui/airtable-card";
import { CompanyDuplicateDialog } from "./CompanyDuplicateDialog";
import { ContactDuplicateDialog } from "./ContactDuplicateDialog";
import { LucideTarget } from "lucide-react";

// --- Interface Definitions ---
// Represents the final, complete Contact object stored in your database
interface CreatedContact {
  contact_id: string;
  company_id?: string | null;
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

// Represents the temporary data parsed from a bio
interface ContactBioData {
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

interface IntegratedContactWorkflowProps {
  companies: Array<{ company_id: string; name: string }>;
  onContactCreated: (newContact: CreatedContact) => void;
  createdContact?: CreatedContact | null;
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
  createdContact,
}: IntegratedContactWorkflowProps) => {
  const { user } = useAuth();
  const [linkedinBio, setLinkedinBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for dialogs and pending data
  const [showCompanyDuplicateDialog, setShowCompanyDuplicateDialog] =
    useState(false);
  const [potentialCompanyDuplicates, setPotentialCompanyDuplicates] = useState<
    PotentialDuplicate[]
  >([]);
  const [showContactDuplicateDialog, setShowContactDuplicateDialog] =
    useState(false);
  const [potentialContactDuplicates, setPotentialContactDuplicates] = useState<
    PotentialContactDuplicate[]
  >([]);
  const [pendingContactData, setPendingContactData] =
    useState<ContactBioData | null>(null);

  // --- Main Handler for the "Process Bio" button ---
  const handleProcessBio = async () => {
    if (!user || !linkedinBio.trim()) return;

    setIsLoading(true);
    try {
      // Step 1: Process the bio to get contact data
      const { data: bioData, error: bioError } =
        await supabase.functions.invoke("add_contact_by_bio", {
          body: { linkedin_bio: linkedinBio.trim() },
        });
      if (bioError) throw bioError;
      if (!bioData?.contact)
        throw new Error("No contact data received from bio processing.");

      const contactData = bioData.contact as ContactBioData;
      setPendingContactData(contactData); // Temporarily store the parsed data

      // Step 2: Check for a duplicate contact FIRST, without a company context.
      const contactCheck = await checkForDuplicateContact(
        contactData.first_name,
        contactData.last_name,
        contactData.role,
        null
      );
      if (contactCheck.isDuplicate) {
        setPotentialContactDuplicates(contactCheck.potentialDuplicates);
        setShowContactDuplicateDialog(true);
        // The flow pauses here, waiting for the user to resolve the contact duplicate.
        return;
      }

      // Step 3: If the contact is new, proceed with the creation flow.
      await createNewContactFlow(contactData);
    } catch (error: any) {
      console.error("Error processing bio:", error);
      toast.error("Failed to process LinkedIn bio");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper function for creating a brand new contact ---
  const createNewContactFlow = async (contactData: ContactBioData) => {
    let finalCompanyId: string | null = null;

    // Check for company duplicates or create a new one.
    if (contactData.current_company) {
      const companyCheck = await checkForDuplicateCompany(
        contactData.current_company
      );
      if (companyCheck.isDuplicate) {
        setPotentialCompanyDuplicates(companyCheck.potentialDuplicates);
        setShowCompanyDuplicateDialog(true);
        // Flow pauses, waiting for user to select a company.
        return;
      }
      finalCompanyId = await createNewCompany(contactData.current_company);
    }

    // With the final company ID, insert the new contact.
    const newContact = await performDatabaseInsert(contactData, finalCompanyId);
    if (newContact) {
      onContactCreated(newContact);
      setLinkedinBio("");
      toast.success("Contact created successfully!");
    }
  };

  // --- Database Interaction Functions ---
  const checkForDuplicateCompany = async (companyName: string) => {
    const { data, error } = await supabase.functions.invoke(
      "check_company_duplicates",
      { body: { companyName } }
    );
    if (error) {
      console.error("Error checking for duplicate companies:", error);
      return { isDuplicate: false, potentialDuplicates: [] };
    }
    return data;
  };

  const checkForDuplicateContact = async (
    first_name: string,
    last_name: string,
    role: string,
    company_id: string | null
  ) => {
    const { data, error } = await supabase.functions.invoke(
      "check_contact_duplicates",
      { body: { first_name, last_name, role, company_id } }
    );
    if (error) {
      console.error("Error checking for duplicate contacts:", error);
      return { isDuplicate: false, potentialDuplicates: [] };
    }
    return data;
  };

  const createNewCompany = async (companyName: string) => {
    const { data, error } = await supabase.functions.invoke(
      "add_company_by_name",
      { body: { companyName } }
    );
    if (error) throw error;
    return data.company.company_id;
  };

  const performDatabaseInsert = async (
    contactData: ContactBioData,
    companyId: string | null
  ): Promise<CreatedContact | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        company_id: companyId,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        role: contactData.role,
        location: contactData.location,
        linkedin_bio: linkedinBio,
        bio_summary: contactData.bio_summary,
        how_i_can_help: contactData.how_i_can_help,
        recent_activity_summary: contactData.recent_activity_summary,
        added_at: new Date().toISOString(),
      })
      .select("*, companies(name)")
      .single();
    if (error) {
      toast.error("Failed to save contact.");
      return null;
    }
    return {
      contact_id: data.contact_id,
      company_id: companyId,
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      role: contactData.role,
      current_company: data.companies?.name || contactData.current_company,
      location: contactData.location,
      bio_summary: contactData.bio_summary,
      how_i_can_help: contactData.how_i_can_help,
      recent_activity_summary: contactData.recent_activity_summary,
    };
  };

  // --- Handlers for Dialogs ---

  const handleUseExistingCompany = async (companyId: string) => {
    setShowCompanyDuplicateDialog(false);
    if (!pendingContactData) return;
    setIsLoading(true);
    const newContact = await performDatabaseInsert(
      pendingContactData,
      companyId
    );
    if (newContact) {
      onContactCreated(newContact);
      setLinkedinBio("");
      toast.success("Contact created successfully!");
    }
    setIsLoading(false);
  };

  const handleCreateNewCompany = async () => {
    setShowCompanyDuplicateDialog(false);
    if (!pendingContactData?.current_company) return;
    setIsLoading(true);
    const newCompanyId = await createNewCompany(
      pendingContactData.current_company
    );
    const newContact = await performDatabaseInsert(
      pendingContactData,
      newCompanyId
    );
    if (newContact) {
      onContactCreated(newContact);
      setLinkedinBio("");
      toast.success("Contact created successfully!");
    }
    setIsLoading(false);
  };

  const handleUpdateExistingContact = async (contactId: string) => {
    setShowContactDuplicateDialog(false);
    if (!pendingContactData) return;
    setIsLoading(true);

    try {
      console.log(
        `[Update Contact] User chose to update existing contact: ${contactId}`
      );

      // Step 1: Update the existing contact in the database with the new parsed info.
      // We only update fields that come from the bio, preserving user_notes and interaction history.
      const { data: updatedContact, error: updateError } = await supabase
        .from("contacts")
        .update({
          role: pendingContactData.role,
          location: pendingContactData.location,
          linkedin_bio: linkedinBio, // Save the new bio
          bio_summary: pendingContactData.bio_summary,
          how_i_can_help: pendingContactData.how_i_can_help,
          updated_at: new Date().toISOString(),
        })
        .eq("contact_id", contactId)
        .select("*, companies(name)") // Fetch company name for the final object
        .single();

      if (updateError) throw updateError;

      // Step 2: After a successful update, create the final object to pass to the parent
      const finalContactObject: CreatedContact = {
        ...updatedContact,
        current_company:
          updatedContact.companies?.name || pendingContactData.current_company,
      };

      console.log(
        "[Update Contact] Notifying parent with:",
        finalContactObject
      );
      onContactCreated(finalContactObject); // Notify the parent
      setLinkedinBio("");
      toast.success("Contact profile updated successfully!");
    } catch (error) {
      console.error("Error updating existing contact:", error);
      toast.error("Failed to update contact.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewContactAnyway = async () => {
    setShowContactDuplicateDialog(false);
    if (!pendingContactData) return;
    setIsLoading(true);
    await createNewContactFlow(pendingContactData);
    setIsLoading(false);
  };

  const resetWorkflow = () => {
    setLinkedinBio("");
    setPendingContactData(null);
  };

  return (
    <div className="space-y-4">
      {!createdContact && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Add profile and create contact</h3>
          </div>

          <div className="space-y-3">
            <Textarea
              value={linkedinBio}
              onChange={(e) => setLinkedinBio(e.target.value)}
              placeholder="Copy all content on their LinkedIn profile page (CTRL/CMD + A, CTRL/CMD + C) and paste it here (CTRL/CMD + V)."
              className="min-h-[120px] text-sm resize-none"
            />
            <PrimaryAction
              onClick={handleProcessBio}
              disabled={!linkedinBio.trim() || isLoading}
              className="w-full"
              size="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  Bio...
                </>
              ) : (
                "Process Bio and Create Contact"
              )}
            </PrimaryAction>
          </div>

          <InfoBox
            title="Who should I contact?"
            description="Start with people you already know. For new contacts, try searching LinkedIn for [company name] [function]."
            icon={<LucideTarget className="h-4 w-4 text-blue-600" />}
          />
        </div>
      )}

      {createdContact && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-800">Contact added</h3>
          </div>

          <AirtableCard className="bg-green-50 border-green-200">
            <AirtableCardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {createdContact.first_name} {createdContact.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {createdContact.role}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {createdContact.current_company}
                    </span>
                  </div>

                  {createdContact.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        📍 {createdContact.location}
                      </span>
                    </div>
                  )}
                </div>

                {createdContact.bio_summary && (
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Bio Summary
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {createdContact.bio_summary}
                    </p>
                  </div>
                )}

                {createdContact.how_i_can_help && (
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      How I Can Help
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {createdContact.how_i_can_help}
                    </p>
                  </div>
                )}
              </div>
            </AirtableCardContent>
          </AirtableCard>
        </div>
      )}

      {/* --- DIALOGS --- */}
      <CompanyDuplicateDialog
        isOpen={showCompanyDuplicateDialog}
        onClose={() => setShowCompanyDuplicateDialog(false)}
        potentialDuplicates={potentialCompanyDuplicates}
        onUseExisting={handleUseExistingCompany}
        onCreateNew={handleCreateNewCompany}
        companyName={pendingContactData?.current_company || ""}
      />
      <ContactDuplicateDialog
        isOpen={showContactDuplicateDialog}
        onClose={() => setShowContactDuplicateDialog(false)}
        potentialDuplicates={potentialContactDuplicates}
        onUseExisting={handleUpdateExistingContact}
        onCreateNew={handleCreateNewContactAnyway}
        newContactName={
          pendingContactData
            ? `${pendingContactData.first_name} ${pendingContactData.last_name}`
            : ""
        }
      />
    </div>
  );
};
