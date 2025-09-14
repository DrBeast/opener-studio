import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/use-toast";

// Icons Imports
import { Users, Search, Trash2 } from "lucide-react";

// Design System Imports
import { PrimaryCard, CardContent } from "@/components/ui/design-system";

import { CompanyDetails } from "@/components/CompanyDetails";
import { ContactDetails } from "@/components/ContactDetails";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { CompaniesTable } from "@/components/CompaniesTable";
import { ContactsTable } from "@/components/ContactsTable";
import { EmptyState } from "@/components/EmptyState";
import { AddContactModal } from "../components/AddContactModal";

import { Button } from "@/components/ui/airtable-ds/button";
import { Input } from "@/components/ui/airtable-ds/input";

const MessageHistory = () => {
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
    "contacts"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
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
      case "latest_interaction":
        // Simple date comparison
        aValue = a.last_interaction_date
          ? new Date(a.last_interaction_date).getTime()
          : 0;
        bValue = b.last_interaction_date
          ? new Date(b.last_interaction_date).getTime()
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
      case "latest_interaction":
        // Simple date comparison
        aValue = a.last_interaction_date
          ? new Date(a.last_interaction_date).getTime()
          : 0;
        bValue = b.last_interaction_date
          ? new Date(b.last_interaction_date).getTime()
          : 0;
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

  const isLoading = companiesLoading || contactsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-100 min-h-screen space-y-2">
      {/* Full-Width Card with Table */}
      <PrimaryCard className="max-w-6xl mx-auto w-full mt-8">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Card Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Message History
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your companies and contacts, view interaction history,
                and track your outreach progress.
              </p>
            </div>
            {/* View Toggle - Above Table */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView("contacts")}
                  className={`font-semibold text-lg transition-colors cursor-pointer ${
                    currentView === "contacts"
                      ? "text-primary"
                      : "text-secondary-foreground hover:text-primary"
                  }`}
                >
                  Contacts
                </button>
                <div className="text-secondary-foreground">|</div>
                <button
                  onClick={() => setCurrentView("companies")}
                  className={`font-semibold text-lg transition-colors cursor-pointer ${
                    currentView === "companies"
                      ? "text-primary"
                      : "text-secondary-foreground hover:text-primary"
                  }`}
                >
                  Companies
                </button>
              </div>

              {/* Search Bar - Right Aligned */}
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 bg-secondary border-border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {(currentView === "companies"
              ? selectedCompanies.size
              : selectedContacts.size) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentView === "companies"
                    ? selectedCompanies.size
                    : selectedContacts.size}{" "}
                  selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkRemove}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Selected
                </Button>
              </div>
            )}
          </div>

          {/* Table with top padding */}
          <div className="pt-6">
            {currentView === "companies" ? (
              filteredCompanies.length === 0 ? (
                <EmptyState searchTerm={searchTerm} hasFilters={false} />
              ) : (
                <CompaniesTable
                  companies={filteredCompanies}
                  onCompanyClick={handleCompanyClick}
                  onBlacklist={handleBlacklist}
                  newCompanyIds={newCompanyIds}
                  highlightNew={highlightNew}
                  selectedCompanies={selectedCompanies}
                  onSelectCompany={handleSelectCompany}
                  onSelectAll={handleSelectAll}
                  sortField={companySortField}
                  sortDirection={companySortDirection}
                  onSort={handleCompanySort}
                  onContactClick={handleContactClick}
                  onGenerateMessage={handleGenerateMessage}
                />
              )
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                  No contacts - yet!
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search term."
                    : "Start by adding contacts and their profiles above."}
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
          </div>
        </CardContent>
      </PrimaryCard>

      {/* Bottom padding */}
      <div className="h-8"></div>

      {/* Modals */}
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
        <ContactDetails
          contactId={selectedContactId}
          isOpen={isContactDetailsOpen}
          onClose={handleContactDetailClose}
          onContactUpdated={handleCompanyUpdated}
          defaultTab={contactDetailsTab}
        />
      )}
    </div>
  );
};

export default MessageHistory;
