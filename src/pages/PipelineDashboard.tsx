import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  Search, 
  Building2, 
  Plus, 
  MoreVertical, 
  Trash, 
  Edit, 
  Star, 
  CircleDashed, 
  CircleDot,
  Sparkles 
} from "lucide-react";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompanyDetails } from "@/components/CompanyDetails";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { cn } from "@/lib/utils";

// Using TypeScript interfaces for type safety - aligned with CompanyData from types/profile.ts
interface Company {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  ai_description?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe';
  is_blacklisted?: boolean;
  match_quality_score?: number;
}

// Highlight animation style for new companies
const highlightAnimation = `
  @keyframes highlightFade {
    0% { background-color: rgba(var(--primary-rgb), 0.3); }
    100% { background-color: transparent; }
  }
`;

const PipelineDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State variables
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priority: [] as string[],
  });
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);
  
  // Get any newly created companies from location state
  const newCompanies = location.state?.newCompanies || [];
  const highlightNew = location.state?.highlightNew || false;
  const newCompanyIds = newCompanies.map((company: any) => company.company_id);

  // Fetch companies from Supabase
  const fetchCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    let companiesData: Company[] = [];
    let successfullyFetched = false;
    
    try {
      // Try calling the get_companies_overview function first
      const { data: companiesOverview, error: functionError } = await supabase.functions.invoke('get_companies_overview');
      
      if (!functionError && companiesOverview && Array.isArray(companiesOverview)) {
        // Type the data properly to ensure user_priority is correctly typed
        companiesData = companiesOverview.map((company: any) => ({
          company_id: company.company_id,
          name: company.name,
          industry: company.industry,
          hq_location: company.hq_location,
          ai_description: company.ai_description,
          user_priority: company.user_priority as 'Top' | 'Medium' | 'Maybe',
          is_blacklisted: company.is_blacklisted,
          match_quality_score: company.match_quality_score
        }));
        successfullyFetched = true;
      }
    } catch (error) {
      console.log("Function call failed, trying fallback query:", error);
    }
    
    // If the function fails, fallback to direct query
    if (!successfullyFetched) {
      try {
        const { data, error: queryError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_blacklisted', false)
          .order('user_priority', { ascending: true })
          .order('name');
          
        if (queryError) throw queryError;
        
        // Type the fallback data properly
        companiesData = (data || []).map((company: any) => ({
          company_id: company.company_id,
          name: company.name,
          industry: company.industry,
          hq_location: company.hq_location,
          ai_description: company.ai_description,
          user_priority: company.user_priority as 'Top' | 'Medium' | 'Maybe',
          is_blacklisted: company.is_blacklisted,
          match_quality_score: company.match_quality_score
        }));
        successfullyFetched = true;
      } catch (fallbackError: any) {
        console.error("Both function and fallback query failed:", fallbackError);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    if (successfullyFetched) {
      setCompanies(companiesData);
    }
    
    setIsLoading(false);
    
    // Clear location state after loading to prevent highlighting on subsequent renders
    if (location.state?.highlightNew) {
      navigate(location.pathname, { replace: true });
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

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

  const handleSetPriority = async (companyId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ user_priority: priority })
        .eq('company_id', companyId);
        
      if (error) throw error;
      
      // Update local state with proper typing
      setCompanies(prev => prev.map(company => 
        company.company_id === companyId ? {...company, user_priority: priority as 'Top' | 'Medium' | 'Maybe'} : company
      ));
      
      toast({
        title: "Success",
        description: "Company priority updated",
      });
    } catch (error: any) {
      console.error("Error updating company priority:", error);
      toast({
        title: "Error",
        description: "Failed to update company priority",
        variant: "destructive"
      });
    }
  };

  const handleBlacklist = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_blacklisted: true })
        .eq('company_id', companyId);
        
      if (error) throw error;
      
      // Remove from local state
      setCompanies(prev => prev.filter(company => company.company_id !== companyId));
      
      toast({
        title: "Success",
        description: "Company added to blacklist",
      });
    } catch (error: any) {
      console.error("Error blacklisting company:", error);
      toast({
        title: "Error",
        description: "Failed to blacklist company",
        variant: "destructive"
      });
    }
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
      <style>{highlightAnimation}</style>
      
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
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handlePriorityFilter('Top')} className="flex items-center justify-between">
                  Top
                  {filters.priority.includes('Top') && <CircleDot className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityFilter('Medium')} className="flex items-center justify-between">
                  Medium
                  {filters.priority.includes('Medium') && <CircleDot className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityFilter('Maybe')} className="flex items-center justify-between">
                  Maybe
                  {filters.priority.includes('Maybe') && <CircleDot className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilters({ ...filters, priority: [] })}>
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No companies found</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || filters.priority.length > 0
                  ? "Try adjusting your search or filters"
                  : "Start by adding your target companies"}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={handleGenerateCompanies} disabled={isGeneratingCompanies} variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGeneratingCompanies ? "Generating..." : "Generate Companies"}
                </Button>
                <Button onClick={handleAddCompany}>
                  <Plus className="mr-2 h-4 w-4" /> Add Company
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Industry</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const isNewCompany = newCompanyIds.includes(company.company_id);
                    return (
                      <TableRow 
                        key={company.company_id} 
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          isNewCompany && highlightNew ? "animate-[highlightFade_3s_ease-out]" : ""
                        )}
                        onClick={() => handleCompanyClick(company)}
                      >
                        <TableCell>{company.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{company.industry || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{company.hq_location || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-xs truncate">{company.ai_description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {company.user_priority === "Top" && (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Top
                              </span>
                            )}
                            {company.user_priority === "Medium" && (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                Medium
                              </span>
                            )}
                            {company.user_priority === "Maybe" && (
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                Maybe
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleSetPriority(company.company_id, "Top");
                              }}>
                                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                                Mark as Top
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleSetPriority(company.company_id, "Medium");
                              }}>
                                <CircleDot className="mr-2 h-4 w-4 text-blue-500" />
                                Mark as Medium
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleSetPriority(company.company_id, "Maybe");
                              }}>
                                <CircleDashed className="mr-2 h-4 w-4 text-gray-500" />
                                Mark as Maybe
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleBlacklist(company.company_id);
                              }}>
                                <Trash className="mr-2 h-4 w-4 text-red-500" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
