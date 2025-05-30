
import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Sparkles } from "lucide-react";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { SearchAndFilters } from "@/components/pipeline/SearchAndFilters";
import { EnhancedCompaniesTable } from "@/components/pipeline/EnhancedCompaniesTable";
import { EmptyState } from "@/components/pipeline/EmptyState";
import { ContactInfoBox } from "@/components/pipeline/ContactInfoBox";
import { EnhancedContactModal } from "@/components/pipeline/EnhancedContactModal";
import { GenerateContactsModal } from "@/components/GenerateContactsModal";

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
    handleSort
  } = useCompanies();

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: '',
    companyName: ''
  });
  const [generateContactsModal, setGenerateContactsModal] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: '',
    companyName: ''
  });
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [contactDetailsTab, setContactDetailsTab] = useState<string>('details');

  // Sort companies based on selected field and direction
  const sortedCompanies = [...companies].sort((a, b) => {
    if (!sortField) return 0;
    let aValue: any = '';
    let bValue: any = '';
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'priority':
        const priorityOrder = {
          'Top': 1,
          'Medium': 2,
          'Maybe': 3
        };
        aValue = priorityOrder[a.user_priority as keyof typeof priorityOrder] || 4;
        bValue = priorityOrder[b.user_priority as keyof typeof priorityOrder] || 4;
        break;
      case 'latest_update':
        aValue = a.latest_update?.interaction_date ? new Date(a.latest_update.interaction_date).getTime() : 0;
        bValue = b.latest_update?.interaction_date ? new Date(b.latest_update.interaction_date).getTime() : 0;
        break;
      case 'next_followup':
        aValue = a.next_followup?.follow_up_due_date ? new Date(a.next_followup.follow_up_due_date).getTime() : 0;
        bValue = b.next_followup?.follow_up_due_date ? new Date(b.next_followup.follow_up_due_date).getTime() : 0;
        break;
      default:
        return 0;
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter companies based on search term only
  const filteredCompanies = sortedCompanies.filter(company => {
    // Search filter
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
      const {
        data,
        error
      } = await supabase.functions.invoke('add_company_by_name', {
        body: {
          companyName
        }
      });
      if (error) throw error;
      await fetchCompanies();
      setIsAddCompanyModalOpen(false);
      toast({
        title: "Success",
        description: "Company added successfully"
      });
    } catch (error: any) {
      console.error("Error adding company:", error);
      toast({
        title: "Error",
        description: "Failed to add company",
        variant: "destructive"
      });
    }
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;
    setIsGeneratingCompanies(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate_companies');
      if (error) throw error;
      if (data?.status === 'success') {
        await fetchCompanies();
        toast({
          title: "Success",
          description: `Generated ${data.companies?.length || 0} new companies successfully`
        });
      } else if (data?.status === 'warning') {
        toast({
          title: "Notice",
          description: data.message
        });
      }
    } catch (error: any) {
      console.error("Error generating companies:", error);
      toast({
        title: "Error",
        description: "Failed to generate companies",
        variant: "destructive"
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

  const handleCreateContact = (companyId: string) => {
    const company = filteredCompanies.find(c => c.company_id === companyId);
    
    // Check if this is from the Generate button or Add button
    // For now, we'll use the Enhanced Contact Modal for "Add" button
    setContactModal({
      isOpen: true,
      companyId,
      companyName: company?.name || ''
    });
  };

  const handleGenerateContacts = (companyId: string) => {
    const company = filteredCompanies.find(c => c.company_id === companyId);
    setGenerateContactsModal({
      isOpen: true,
      companyId,
      companyName: company?.name || ''
    });
  };

  const handleContactClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailsTab('details');
    setIsContactDetailsOpen(true);
  };
  
  const handleGenerateMessage = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailsTab('messages');
    setIsContactDetailsOpen(true);
  };
  
  const handleContactDetailClose = () => {
    setIsContactDetailsOpen(false);
    setSelectedContactId(null);
    setContactDetailsTab('details');
  };
  
  const handleContactUpdated = async () => {
    await fetchCompanies();
  };

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }

  return <div className="container mx-auto px-4 py-8 max-w-full">
      <ProfileBreadcrumbs />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Company Targets and Contacts</h1>
        <div className="flex gap-2">
          <Button onClick={handleGenerateCompanies} disabled={isGeneratingCompanies} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {isGeneratingCompanies ? "Generating..." : "Generate More Companies"}
          </Button>
          <Button onClick={handleAddCompany} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>
      </div>

      <ContactInfoBox />

      <Card>
        <CardContent className="p-6">
          <SearchAndFilters 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            selectedCount={selectedCompanies.size} 
            onBulkRemove={handleBulkRemove} 
          />

          {filteredCompanies.length === 0 ? 
            <EmptyState 
              searchTerm={searchTerm} 
              hasFilters={false} 
              onAddCompany={handleAddCompany} 
              onGenerateCompanies={handleGenerateCompanies} 
              isGeneratingCompanies={isGeneratingCompanies} 
            /> : 
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
              onCreateContact={handleGenerateContacts}
              onContactClick={handleContactClick}
              onGenerateMessage={handleGenerateMessage}
            />
          }
        </CardContent>
      </Card>

      {/* Modals */}
      <AddCompanyModal 
        isOpen={isAddCompanyModalOpen} 
        onClose={() => setIsAddCompanyModalOpen(false)} 
        onAddCompany={handleCompanyAdded} 
        isLoading={false} 
      />
      
      {selectedCompany && 
        <CompanyDetails 
          company={selectedCompany} 
          isOpen={!!selectedCompany} 
          onClose={handleCompanyDetailClose} 
          onCompanyUpdated={handleCompanyUpdated} 
        />
      }

      <EnhancedContactModal 
        isOpen={contactModal.isOpen} 
        onClose={() => setContactModal({
          isOpen: false,
          companyId: '',
          companyName: ''
        })} 
        companyId={contactModal.companyId}
        companyName={contactModal.companyName}
        onSuccess={handleContactUpdated} 
      />

      <GenerateContactsModal 
        isOpen={generateContactsModal.isOpen} 
        onClose={() => setGenerateContactsModal({
          isOpen: false,
          companyId: '',
          companyName: ''
        })} 
        companyId={generateContactsModal.companyId}
        companyName={generateContactsModal.companyName}
        onSuccess={handleContactUpdated} 
      />

      {/* Enhanced Contact Details Modal */}
      {selectedContactId && (
        <EnhancedContactDetails
          contactId={selectedContactId}
          isOpen={isContactDetailsOpen}
          onClose={handleContactDetailClose}
          onContactUpdated={handleContactUpdated}
          defaultTab={contactDetailsTab}
        />
      )}
    </div>;
};

export default PipelineDashboard;
