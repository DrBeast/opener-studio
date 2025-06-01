
import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Plus, Sparkles, Users, Building, Target, MessageCircle, ArrowRight } from "lucide-react";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { EnhancedContactDetails } from "@/components/EnhancedContactDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { SearchAndFilters } from "@/components/pipeline/SearchAndFilters";
import { EnhancedCompaniesTable } from "@/components/pipeline/EnhancedCompaniesTable";
import { EmptyState } from "@/components/pipeline/EmptyState";
import { InteractionModal } from "@/components/pipeline/InteractionModal";
import { ContactModal } from "@/components/pipeline/ContactModal";
import { ContactInfoBox } from "@/components/pipeline/ContactInfoBox";
import { EnhancedContactModal } from "@/components/pipeline/EnhancedContactModal";

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

  const handleCreateContact = (companyId: string, companyName: string) => {
    setContactModal({
      isOpen: true,
      companyId,
      companyName
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading your pipeline</h3>
            <p className="text-sm text-gray-600">Preparing your networking data...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalContacts = companies.reduce((sum, company) => sum + (company.contacts?.length || 0), 0);
  const totalMessages = companies.reduce((sum, company) => 
    sum + (company.contacts?.reduce((msgSum, contact) => 
      msgSum + (contact.saved_message_versions?.length || 0), 0) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <ProfileBreadcrumbs />

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Networking Pipeline
          </h1>
          <p className="text-lg text-gray-600">
            Manage your target companies and build meaningful connections
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Target Companies</p>
                  <p className="text-3xl font-bold">{companies.length}</p>
                </div>
                <Building className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Key Contacts</p>
                  <p className="text-3xl font-bold">{totalContacts}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Messages Crafted</p>
                  <p className="text-3xl font-bold">{totalMessages}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">
                    {totalContacts > 0 ? Math.round((totalMessages / totalContacts) * 100) : 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-primary-foreground/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Targets and Contacts</h2>
            <p className="text-gray-600">Track your networking progress and manage relationships</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateCompanies} 
              disabled={isGeneratingCompanies} 
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingCompanies ? "Generating..." : "Generate More"}
            </Button>
            <Button 
              onClick={handleAddCompany} 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" /> 
              Add Company
            </Button>
          </div>
        </div>

        <ContactInfoBox />

        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
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
                onCreateContact={(companyId) => {
                  const company = filteredCompanies.find(c => c.company_id === companyId);
                  handleCreateContact(companyId, company?.name || '');
                }}
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
          onSuccess={handleCompanyUpdated} 
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
      </div>
    </div>
  );
};

export default PipelineDashboard;
