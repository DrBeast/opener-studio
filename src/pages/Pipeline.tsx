
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Edit, Plus, Sparkles, UserPlus } from "lucide-react";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { SearchAndFilters } from "@/components/pipeline/SearchAndFilters";
import { EnhancedCompaniesTable } from "@/components/pipeline/EnhancedCompaniesTable";
import { EmptyState } from "@/components/pipeline/EmptyState";
import { EnhancedContactModal } from "@/components/pipeline/EnhancedContactModal";
import { TargetsModal } from "@/components/TargetsModal";
import { GenerateContactsModal } from "@/components/GenerateContactsModal";

// Design System Imports
import {
  Card,
  CardContent,
  PrimaryAction,
  OutlineAction,
  PageTitle,
  PageDescription,
  InfoBox,
} from "@/components/ui/design-system";

const PipelineDashboard = () => {
  const { user } = useAuth();
  const {
    companies,
    isLoading,
    fetchCompanies,
    handleSetPriority,
    handleBlacklist,
    handleBulkBlacklist,
    newCompanyIds,
    highlightNew,
    selectedCompanies,
    handleSelectCompany,
    handleSelectAll,
    sortField,
    sortDirection,
    handleSort,
  } = useCompanies();

  // State variables
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
    if (!sortField) return 0;
    let aValue: any = "";
    let bValue: any = "";
    switch (sortField) {
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
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
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
  };

  const handleBulkRemove = async () => {
    if (selectedCompanies.size === 0) return;
    await handleBulkBlacklist(Array.from(selectedCompanies));
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

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto py-8 ">
        <ProfileBreadcrumbs />

        {/* Top Section (Like Profile Page) */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid gap-8">
            <div className="space-y-8">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <PageTitle>Company Targets and Contacts</PageTitle>
                  <PageDescription>
                    Manage your target companies and track your networking
                    progress
                  </PageDescription>
                </div>
              </div>

              <InfoBox
                title="💡 Pipeline Overview"
                description="Click the icons under Contacts to Generate Contacts and Add them manually. AI-powered contact identification can only leverage publicly available information such as company websites - it cannot access LinkedIn profiles yet. For best results, we strongly recommend manually adding contacts from your existing network or new contacts you discover through LinkedIn research. This ensures you connect with the most relevant people at your target companies. Once you have contacts, use the Message icon to craft the messages. When you Save Messages, the will be summarized in the Interactions column. Full history can be viewed by clicking a company row under Company details."
                icon={<UserPlus className="h-6 w-6 text-blue-600" />}
              />
            </div>
          </div>
        </div>

        {/* Placeholder Targets Modal */}
        {isTargetsModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium text-gray-800">
                Edit Targets (Placeholder)
              </h3>
              <p>This is a placeholder for the Targets modal.</p>
              <button
                onClick={() => setIsTargetsModalOpen(false)}
                className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Full-Width Card with Table */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mx-auto w-[95%]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between gap-4 ">
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCount={selectedCompanies.size}
                onBulkRemove={handleBulkRemove}
              />
              <div className="flex items-center gap-3 mb-6">
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
              </div>
            </div>

            {filteredCompanies.length === 0 ? (
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
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
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
            )}
          </CardContent>
        </Card>

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

        <EnhancedContactModal
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
          onClose={() => setGenerateContactsModal({
            isOpen: false,
            companyId: "",
            companyName: "",
          })}
          companyId={generateContactsModal.companyId}
          companyName={generateContactsModal.companyName}
          onSuccess={handleCompanyUpdated}
        />
      </div>
    </div>
  );
};

export default PipelineDashboard;
