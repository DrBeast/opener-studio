
import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Sparkles } from "lucide-react";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useCompanies, type Company } from "@/hooks/useCompanies";
import { SearchAndFilters } from "@/components/pipeline/SearchAndFilters";
import { CompaniesTable } from "@/components/pipeline/CompaniesTable";
import { EmptyState } from "@/components/pipeline/EmptyState";

const PipelineDashboard = () => {
  const { user } = useAuth();
  const {
    companies,
    isLoading,
    fetchCompanies,
    handleSetPriority,
    handleBlacklist,
    newCompanyIds,
    highlightNew
  } = useCompanies();
  
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: [] as string[],
  });
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);

  // Filter companies based on search term and filters
  const filteredCompanies = companies.filter((company) => {
    // Search filter
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.hq_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.ai_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Priority filter
    const matchesPriority = filters.priority.length === 0 || 
                           (company.user_priority && filters.priority.includes(company.user_priority));
    
    return matchesSearch && matchesPriority;
  });

  const handlePriorityFilter = (priority: string) => {
    setFilters(prev => {
      if (prev.priority.includes(priority)) {
        return { ...prev, priority: prev.priority.filter(p => p !== priority) };
      } else {
        return { ...prev, priority: [...prev.priority, priority] };
      }
    });
  };

  const handleClearFilters = () => {
    setFilters({ ...filters, priority: [] });
  };

  const handleAddCompany = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleCompanyAdded = async (companyName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('add_company_by_name', {
        body: { companyName }
      });

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
        variant: "destructive"
      });
    }
  };

  const handleGenerateCompanies = async () => {
    if (!user) return;
    
    setIsGeneratingCompanies(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate_companies');
      
      if (error) throw error;
      
      if (data?.status === 'success') {
        await fetchCompanies();
        toast({
          title: "Success",
          description: `Generated ${data.companies?.length || 0} new companies successfully`,
        });
      } else if (data?.status === 'warning') {
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

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ProfileBreadcrumbs />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Company Pipeline</h1>
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

      <Card>
        <CardContent className="p-6">
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onPriorityFilter={handlePriorityFilter}
            onClearFilters={handleClearFilters}
          />

          {filteredCompanies.length === 0 ? (
            <EmptyState
              searchTerm={searchTerm}
              hasFilters={filters.priority.length > 0}
              onAddCompany={handleAddCompany}
              onGenerateCompanies={handleGenerateCompanies}
              isGeneratingCompanies={isGeneratingCompanies}
            />
          ) : (
            <CompaniesTable
              companies={filteredCompanies}
              onCompanyClick={handleCompanyClick}
              onSetPriority={handleSetPriority}
              onBlacklist={handleBlacklist}
              newCompanyIds={newCompanyIds}
              highlightNew={highlightNew}
            />
          )}
        </CardContent>
      </Card>

      {/* Company Add Modal */}
      <AddCompanyModal 
        isOpen={isAddCompanyModalOpen} 
        onClose={() => setIsAddCompanyModalOpen(false)}
        onAddCompany={handleCompanyAdded}
        isLoading={false}
      />
      
      {/* Company Detail View */}
      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          isOpen={!!selectedCompany}
          onClose={handleCompanyDetailClose}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
    </div>
  );
};

export default PipelineDashboard;
