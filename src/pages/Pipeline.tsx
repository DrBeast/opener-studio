import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/use-toast";

// Icons Imports
import {
  Edit,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  Building2,
  Eye,
  EyeOff,
  MessageCircle,
  LucideTarget,
} from "lucide-react";

// Design System Imports
import {
  Card,
  CardContent,
  PrimaryCard,
  PrimaryAction,
  OutlineAction,
  CollapsibleWide,
  InfoBox,
  CardTitle,
} from "@/components/ui/design-system";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/airtable-ds/collapsible";

import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { SearchAndFilters } from "@/components/pipeline/SearchAndFilters";
import { EnhancedCompaniesTable } from "@/components/pipeline/EnhancedCompaniesTable";
import { ContactsTable } from "@/components/pipeline/ContactsTable";
import { EmptyState } from "@/components/pipeline/EmptyState";
import { AddContactModal } from "../components/AddContactModal";
import { TargetsModal } from "@/components/TargetsModal";
import { GenerateContactsModal } from "@/components/GenerateContactsModal";
import { AddContact } from "@/components/AddContact";
import { MessageGeneration } from "@/components/MessageGeneration";

import { Button } from "@/components/ui/airtable-ds/button";

const PipelineDashboard = () => {
  const { user } = useAuth();
  const {
    companies,
    isLoading: companiesLoading,
    fetchCompanies,
    handleSetPriority,
    handleBlacklist,
    handleBulkBlacklist,
    newCompanyIds,
    highlightNew,
    selectedCompanies,
    handleSelectCompany,
    handleSelectAll,
    sortField: companySortField,
    sortDirection: companySortDirection,
    handleSort: handleCompanySort,
    showInactive: showInactiveCompanies,
    setShowInactive: setShowInactiveCompanies,
    toggleCompanyStatus,
  } = useCompanies();

  const {
    contacts,
    isLoading: contactsLoading,
    fetchContacts,
    selectedContacts,
    handleSelectContact: handleContactSelect,
    handleSelectAll: handleContactSelectAll,
    sortField: contactSortField,
    sortDirection: contactSortDirection,
    handleSort: handleContactSort,
    showInactive: showInactiveContacts,
    setShowInactive: setShowInactiveContacts,
    toggleContactStatus,
  } = useContacts();

  // State variables
  const [currentView, setCurrentView] = useState<"companies" | "contacts">(
    "companies"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
  });
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [contactDetailsTab, setContactDetailsTab] = useState<string>("details");
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [contactForMessage, setContactForMessage] = useState<any>(null);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(true);

  // Generate Contacts Modal state
  const [generateContactsModal, setGenerateContactsModal] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
  });

  // Sort companies based on selected field and direction
  const sortedCompanies = [...companies].sort((a, b) => {
    if (!companySortField) return 0;
    let aValue: any = "";
    let bValue: any = "";
    switch (companySortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "priority":
        const priorityOrder = {
          Top: 1,
          Medium: 2,
          Maybe: 3,
        };
        aValue =
          priorityOrder[a.user_priority as keyof typeof priorityOrder] || 4;
        bValue =
          priorityOrder[b.user_priority as keyof typeof priorityOrder] || 4;
        break;
      case "latest_update":
        aValue = a.latest_update?.interaction_date
          ? new Date(a.latest_update.interaction_date).getTime()
          : 0;
        bValue = b.latest_update?.interaction_date
          ? new Date(b.latest_update.interaction_date).getTime()
          : 0;
        break;
      case "next_followup":
        aValue = a.next_followup?.follow_up_due_date
          ? new Date(a.next_followup.follow_up_due_date).getTime()
          : 0;
        bValue = b.next_followup?.follow_up_due_date
          ? new Date(b.next_followup.follow_up_due_date).getTime()
          : 0;
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return companySortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return companySortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Sort contacts based on selected field and direction
  const sortedContacts = [...contacts].sort((a, b) => {
    if (!contactSortField) return 0;
    let aValue: any = "";
    let bValue: any = "";
    switch (contactSortField) {
      case "name":
        aValue = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        bValue = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
        break;
      case "role":
        aValue = (a.role || "").toLowerCase();
        bValue = (b.role || "").toLowerCase();
        break;
      case "company":
        aValue = (a.company_name || "").toLowerCase();
        bValue = (b.company_name || "").toLowerCase();
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return contactSortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return contactSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Filter companies based on search term only
  const filteredCompanies = sortedCompanies.filter((company) => {
    // Search filter
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.hq_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.ai_description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Filter contacts based on search term only
  const filteredContacts = sortedContacts.filter((contact) => {
    const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`;
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.bio_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleAddCompany = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleCompanyAdded = async (companyName: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke(
        "add_company_by_name",
        {
          body: {
            companyName,
          },
        }
      );
      if (error) throw error;
      await fetchCompanies();
      setIsAddCompanyModalOpen(false);
      toast({
        title: "Success",
        description: "Company added successfully",
      });
    } catch (error: any) {
      console.error("Error adding company:", error);
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;
    setIsGeneratingCompanies(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_companies"
      );
      if (error) throw error;
      if (data?.status === "success") {
        await fetchCompanies();
        toast({
          title: "Success",
          description: `Generated ${
            data.companies?.length || 0
          } new companies successfully`,
        });
      } else if (data?.status === "warning") {
        toast({
          title: "Notice",
          description: data.message,
        });
      }
    } catch (error: any) {
      console.error("Error generating companies:", error);
      toast({
        title: "Error",
        description: "Failed to generate companies",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCompanies(false);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleCompanyDetailClose = () => {
    setSelectedCompany(null);
  };

  const handleCompanyUpdated = async () => {
    await fetchCompanies();
    await fetchContacts();
  };

  const handleBulkRemove = async () => {
    if (currentView === "companies") {
      if (selectedCompanies.size === 0) return;
      await handleBulkBlacklist(Array.from(selectedCompanies));
    } else {
      if (selectedContacts.size === 0) return;
      await handleBulkRemoveContacts(Array.from(selectedContacts));
    }
  };

  const handleBulkRemoveContacts = async (contactIds: string[]) => {
    if (!user) return;

    try {
      // Delete associated interactions first
      const { error: interactionsError } = await supabase
        .from("interactions")
        .delete()
        .in("contact_id", contactIds);

      if (interactionsError) throw interactionsError;

      // Delete associated saved message versions
      const { error: messagesError } = await supabase
        .from("saved_message_versions")
        .delete()
        .in("contact_id", contactIds);

      if (messagesError) throw messagesError;

      // Delete the contacts
      const { error: contactsError } = await supabase
        .from("contacts")
        .delete()
        .in("contact_id", contactIds);

      if (contactsError) throw contactsError;

      // Refresh the data
      await fetchContacts();

      toast({
        title: "Success",
        description: `Removed ${contactIds.length} contact(s) and their associated data`,
      });
    } catch (error: any) {
      console.error("Error removing contacts:", error);
      toast({
        title: "Error",
        description: "Failed to remove selected contacts",
        variant: "destructive",
      });
    }
  };

  const handleCreateContact = (companyId: string, companyName: string) => {
    setContactModal({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  const handleContactClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailsTab("details");
    setIsContactDetailsOpen(true);
  };

  const handleGenerateMessage = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailsTab("messages");
    setIsContactDetailsOpen(true);
  };

  const handleContactDetailClose = () => {
    setIsContactDetailsOpen(false);
    setSelectedContactId(null);
    setContactDetailsTab("details");
  };

  const handleOpenTargetsModal = () => {
    setIsTargetsModalOpen(true);
  };

  // Handler to receive contact from workflow
  const handleContactCreated = (newContact: any) => {
    console.log("Parent received new contact:", newContact);

    // Ensure the contact object has the correct structure for MessageGeneration
    const contactForGeneration = {
      contact_id: newContact.contact_id,
      first_name: newContact.first_name,
      last_name: newContact.last_name,
      role: newContact.role,
      company_id: newContact.company_id,
      current_company: newContact.current_company,
      location: newContact.location,
      bio_summary: newContact.bio_summary,
      how_i_can_help: newContact.how_i_can_help,
      recent_activity_summary: newContact.recent_activity_summary,
    };

    console.log(
      "Contact prepared for message generation:",
      contactForGeneration
    );
    setContactForMessage(contactForGeneration);
    fetchContacts();
  };

  // Updated function to open the unified generate contacts modal
  const handleOpenContactRecommendation = (
    companyId: string,
    companyName: string
  ) => {
    setGenerateContactsModal({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  const isLoading = companiesLoading || contactsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-100 min-h-screen space-y-2 ">
      {/* Collapsible Section for Integrated Flow */}
      <div className="w-[95%] mx-auto">
        <Collapsible
          open={isWorkflowExpanded}
          onOpenChange={setIsWorkflowExpanded}
          className=" mx-auto w-full"
        >
          <CollapsibleTrigger className="w-full pt-4 pb-4 text-center">
            <CollapsibleWide
              className="hover:bg-primary-muted"
              expanded={isWorkflowExpanded}
              icon={<UserPlus className="h-6 w-6" />}
            >
              Expand your network
            </CollapsibleWide>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-0 pb-4">
              {/* Left Panel - Contact Creation*/}
              {!contactForMessage ? (
                <PrimaryCard
                  className={`space-y-4 h-full p-4 rounded-lg border-2 transition-all ${
                    !contactForMessage
                      ? "border-primary" // Active styles
                      : "border-border " // Inactive styles
                  }`}
                >
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <UserPlus
                        className={`h-5 w-5 ${
                          !contactForMessage
                            ? "text-primary" // Active styles
                            : "text-foreground" // Inactive styles
                        }`}
                      />
                      <CardTitle
                        className={`font-medium text-lg ${
                          !contactForMessage
                            ? "text-primary" // Active styles
                            : "text-foreground" // Inactive styles
                        }`}
                      >
                        {"Add profile and create contact"}
                      </CardTitle>
                    </div>

                    <AddContact
                      companies={companies}
                      onContactCreated={handleContactCreated}
                      createdContact={contactForMessage}
                    />
                    {!contactForMessage && (
                      <InfoBox
                        className="text-sm mt-4 mb-0"
                        title="Who should I contact?"
                        description="Start with people you already know. For new contacts, think of companies you are interested in, then try searching LinkedIn for [company name] [function]."
                        icon={<LucideTarget className="h-4 w-4" />}
                      />
                    )}
                  </CardContent>
                </PrimaryCard>
              ) : (
                // When a contact exists, replace the parent card entirely
                <div className="space-y-4 h-full">
                  <AddContact
                    companies={companies}
                    onContactCreated={handleContactCreated}
                    createdContact={contactForMessage}
                  />
                </div>
              )}

              {/* Right Panel - Message Generation*/}
              <PrimaryCard
                className={`h-full p-4 rounded-lg border-2 transition-all relative ${
                  !contactForMessage
                    ? "border-border" // Inactive styles
                    : "border-primary" // Active styles
                }`}
              >
                <CardContent>
                  {/* Conditional overlay --- */}
                  {!contactForMessage && (
                    <div className="absolute inset-0 bg-gray-200/40 rounded-lg z-10"></div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle
                      className={`h-5 w-5 ${
                        !contactForMessage
                          ? "text-foreground" // Inactive styles
                          : "text-primary" // Active styles
                      }`}
                    />
                    <CardTitle
                      className={`font-medium text-lg ${
                        !contactForMessage
                          ? "text-foreground" // Inactive styles
                          : "text-primary" // Active styles
                      }`}
                    >
                      {contactForMessage
                        ? `Generate message for ${contactForMessage.first_name} ${contactForMessage.last_name}`
                        : "Generate message: create contact first"}
                    </CardTitle>
                  </div>

                  {/* The MessageGeneration component is always rendered */}
                  <div
                    className={`mt-4 ${
                      !contactForMessage ? "pointer-events-none" : ""
                    }`}
                  >
                    <MessageGeneration
                      contact={contactForMessage}
                      companyName={
                        contactForMessage?.company_id
                          ? companies.find(
                              (c) =>
                                c.company_id === contactForMessage.company_id
                            )?.name || ""
                          : contactForMessage?.current_company || ""
                      }
                      isOpen={true}
                      onClose={() => {}}
                      onMessageSaved={() => {
                        toast({
                          title: "Success",
                          description: "Message copied and saved to history!",
                        });
                        setContactForMessage(null);
                      }}
                      embedded={true}
                      disabled={!contactForMessage}
                    />
                  </div>
                </CardContent>
              </PrimaryCard>

              <div></div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Full-Width Card with Table */}
      <PrimaryCard className="mx-auto w-[95%] ">
        <CardContent className="p-8 ">
          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={currentView === "companies" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("companies")}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Companies ({companies.length})
                </Button>
                <Button
                  variant={currentView === "contacts" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentView("contacts")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Contacts ({contacts.length})
                </Button>
              </div>

              {/* Show/Hide Inactive Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentView === "companies") {
                      setShowInactiveCompanies(!showInactiveCompanies);
                    } else {
                      setShowInactiveContacts(!showInactiveContacts);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  {(
                    currentView === "companies"
                      ? showInactiveCompanies
                      : showInactiveContacts
                  ) ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide Inactive
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Show Inactive
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCount={
                  currentView === "companies"
                    ? selectedCompanies.size
                    : selectedContacts.size
                }
                onBulkRemove={handleBulkRemove}
              />
              <div className="flex items-center gap-3">
                {currentView === "companies" && (
                  <>
                    <OutlineAction onClick={handleOpenTargetsModal}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Targets
                    </OutlineAction>
                    <PrimaryAction
                      onClick={handleGenerateCompanies}
                      disabled={isGeneratingCompanies}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isGeneratingCompanies
                        ? "Generating..."
                        : "Generate More Companies"}
                    </PrimaryAction>
                    <PrimaryAction onClick={handleAddCompany}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Company
                    </PrimaryAction>
                  </>
                )}
              </div>
            </div>
          </div>

          {currentView === "companies" ? (
            filteredCompanies.length === 0 ? (
              <EmptyState
                searchTerm={searchTerm}
                hasFilters={false}
                onAddCompany={handleAddCompany}
                onGenerateCompanies={handleGenerateCompanies}
                isGeneratingCompanies={isGeneratingCompanies}
              />
            ) : (
              <EnhancedCompaniesTable
                companies={filteredCompanies}
                onCompanyClick={handleCompanyClick}
                onSetPriority={handleSetPriority}
                onBlacklist={handleBlacklist}
                newCompanyIds={newCompanyIds}
                highlightNew={highlightNew}
                selectedCompanies={selectedCompanies}
                onSelectCompany={handleSelectCompany}
                onSelectAll={handleSelectAll}
                sortField={companySortField}
                sortDirection={companySortDirection}
                onSort={handleCompanySort}
                onCreateContact={(companyId, companyName) => {
                  const company = filteredCompanies.find(
                    (c) => c.company_id === companyId
                  );
                  handleCreateContact(companyId, company?.name || "");
                }}
                onContactClick={handleContactClick}
                onGenerateMessage={handleGenerateMessage}
                onOpenContactRecommendation={handleOpenContactRecommendation}
              />
            )
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No contacts found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search term."
                  : "Start by adding contacts to your companies."}
              </p>
            </div>
          ) : (
            <ContactsTable
              contacts={filteredContacts}
              onContactClick={handleContactClick}
              onGenerateMessage={handleGenerateMessage}
              selectedContacts={selectedContacts}
              onSelectContact={handleContactSelect}
              onSelectAll={handleContactSelectAll}
              sortField={contactSortField}
              sortDirection={contactSortDirection}
              onSort={handleContactSort}
              onToggleStatus={toggleContactStatus}
            />
          )}
        </CardContent>
      </PrimaryCard>
      {/* Modals */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onAddCompany={handleCompanyAdded}
        isLoading={false}
      />
      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          isOpen={!!selectedCompany}
          onClose={handleCompanyDetailClose}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
      <AddContactModal
        isOpen={contactModal.isOpen}
        onClose={() =>
          setContactModal({
            isOpen: false,
            companyId: "",
            companyName: "",
          })
        }
        companyId={contactModal.companyId}
        companyName={contactModal.companyName}
        onSuccess={handleCompanyUpdated}
      />
      {/* Enhanced Contact Details Modal */}
      {selectedContactId && (
        <EnhancedContactDetails
          contactId={selectedContactId}
          isOpen={isContactDetailsOpen}
          onClose={handleContactDetailClose}
          onContactUpdated={handleCompanyUpdated}
          defaultTab={contactDetailsTab}
        />
      )}
      <TargetsModal
        isOpen={isTargetsModalOpen}
        onClose={() => setIsTargetsModalOpen(false)}
      />
      {/* Unified Generate Contacts Modal */}
      <GenerateContactsModal
        isOpen={generateContactsModal.isOpen}
        onClose={() =>
          setGenerateContactsModal({
            isOpen: false,
            companyId: "",
            companyName: "",
          })
        }
        companyId={generateContactsModal.companyId}
        companyName={generateContactsModal.companyName}
        onSuccess={handleCompanyUpdated}
      />
    </div>
  );
};

export default PipelineDashboard;
