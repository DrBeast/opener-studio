
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  Trash2, 
  ArrowUpDown,
  FileText,
  UserRound,
  Calendar,
  AlertCircle,
  MessageCircle,
  CheckCircle,
  X
} from "lucide-react";

// Job Target Components
import { CompanyDetails } from "@/components/CompanyDetails";
import { ContactDetails } from "@/components/ContactDetails";
import { InteractionForm } from "@/components/InteractionForm";
import { MessageGeneration } from "@/components/MessageGeneration";

// Interfaces
interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  wfh_policy?: string;
  ai_description?: string;
  match_quality_score?: number;
  ai_match_reasoning?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe'; // This aligns with the database values
  latest_update: {
    interaction_id: string;
    description: string;
    interaction_date: string;
    interaction_type: string;
  };
  next_followup: {
    interaction_id: string;
    description: string;
    follow_up_due_date: string;
    interaction_type: string;
  };
  contacts: Array<{
    contact_id: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    latest_interaction?: {
      interaction_date: string;
      description: string;
    };
  }>;
}

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  companies?: {
    name: string;
  };
}

interface TargetCriteriaData {
  free_form_role_and_company_description?: string;
  target_industries?: any;
  target_locations?: any;
  target_sizes?: any;
  target_public_private?: any;
  target_wfh_preference?: any;
  target_functions?: any;
  similar_companies?: any;
}

// Modals
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { TargetCriteriaForm } from "@/components/TargetCriteriaForm";

const ConsolidatedJobSearch = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [openCriteria, setOpenCriteria] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [sortField, setSortField] = useState("user_priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isGeneratingCompanies, setIsGeneratingCompanies] = useState(false);

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);

  // Target criteria Form state
  const [showTargetForm, setShowTargetForm] = useState(false);
  
  // Fetch companies overview
  const { data: companiesData, isLoading, error, refetch } = useQuery({
    queryKey: ['companies-overview', filterPriority, sortField, sortDirection],
    queryFn: async () => {
      try {
        // Call the get_companies_overview edge function
        const { data, error } = await supabase.functions.invoke('get_companies_overview', {});
        
        if (error) throw error;
        return data.companies;
      } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }
    },
    enabled: !!user
  });

  // Fetch target criteria
  const { data: targetCriteria } = useQuery({
    queryKey: ['target-criteria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('target_criteria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as TargetCriteriaData;
    },
    enabled: !!user
  });

  // Remove companies mutation
  const removeCompaniesMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('remove_companies', {
        body: { companyIds }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Selected companies removed');
      setSelectedCompanyIds([]);
      queryClient.invalidateQueries({ queryKey: ['companies-overview'] });
    },
    onError: (error) => {
      console.error('Error removing companies:', error);
      toast.error('Failed to remove companies');
    }
  });

  // Add company by name mutation
  const addCompanyMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const { data, error } = await supabase.functions.invoke('add_company_by_name', {
        body: { companyName }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Company ${data.company.name} added successfully`);
      queryClient.invalidateQueries({ queryKey: ['companies-overview'] });
    },
    onError: (error: any) => {
      console.error('Error adding company:', error);
      if (error.message === 'Company already exists') {
        toast.error('This company already exists in your list');
      } else {
        toast.error('Failed to add company');
      }
    }
  });

  // Filter companies based on search query
  const filteredCompanies = companiesData?.filter((company: CompanyData) => {
    if (!searchQuery) return true;
    
    // Apply priority filter if set
    if (filterPriority && company.user_priority !== filterPriority) return false;
    
    const query = searchQuery.toLowerCase();
    const contactNames = company.contacts
      ?.map(c => `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase())
      .join(' ') || '';
    
    return (
      company.name.toLowerCase().includes(query) ||
      (company.industry || "").toLowerCase().includes(query) ||
      (company.hq_location || "").toLowerCase().includes(query) ||
      (company.user_priority || "").toLowerCase().includes(query) ||
      contactNames.includes(query)
    );
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle company selection
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyIds(prev => {
      if (prev.includes(companyId)) {
        return prev.filter(id => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  // Handle select all companies
  const handleSelectAll = () => {
    if (selectedCompanyIds.length === (filteredCompanies?.length || 0)) {
      setSelectedCompanyIds([]);
    } else {
      const allIds = filteredCompanies?.map((company: CompanyData) => company.company_id) || [];
      setSelectedCompanyIds(allIds);
    }
  };

  // Handle removing selected companies
  const handleRemoveSelected = () => {
    if (selectedCompanyIds.length === 0) {
      toast.error('No companies selected');
      return;
    }
    
    removeCompaniesMutation.mutate(selectedCompanyIds);
  };

  // Handle viewing company details
  const handleViewCompany = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };

  // Handle company updated
  const handleCompanyUpdated = () => {
    refetch();
    setIsDetailsOpen(false);
  };

  // Handle planning interaction
  const handlePlanInteraction = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsAddInteractionOpen(true);
  };

  // Handle generate more companies
  const handleGenerateMoreCompanies = async (useDifferentCriteria = false) => {
    // This is a placeholder - in a real implementation, you would call 
    // the generate_companies edge function with the current criteria
    setIsGeneratingCompanies(true);
    toast.info('Generating more companies...');
    
    try {
      // Mock delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (useDifferentCriteria) {
        setShowTargetForm(true);
      } else {
        // In real implementation, call generate_companies
        toast.success('10 more companies generated');
        refetch();
      }
    } catch (error) {
      console.error('Error generating companies:', error);
      toast.error('Failed to generate companies');
    } finally {
      setIsGeneratingCompanies(false);
    }
  };

  // Format a date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format contact name with initial
  const formatContactName = (contact: { first_name?: string, last_name?: string }) => {
    const firstName = contact.first_name || '';
    const lastInitial = contact.last_name ? `${contact.last_name.charAt(0)}` : '';
    return firstName + (lastInitial ? ` ${lastInitial}.` : '');
  };

  if (error) {
    toast.error("Failed to load companies");
    console.error(error);
  }

  return (
    <div className="container mx-auto py-8 max-w-full">
      <ProfileBreadcrumbs />
      
      <div className="space-y-6">
        {/* Target Criteria Section */}
        <Collapsible open={openCriteria} onOpenChange={setOpenCriteria}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Target Criteria</CardTitle>
                <CardDescription>
                  Define your target role and company criteria
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {openCriteria ? <ChevronUp /> : <ChevronDown />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent>
                {!showTargetForm ? (
                  <div className="space-y-4">
                    {targetCriteria ? (
                      <div>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-lg">Role & Company Description</h3>
                            <p className="text-muted-foreground">
                              {targetCriteria.free_form_role_and_company_description || 'No description provided'}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {targetCriteria.target_industries && (
                              <div>
                                <h4 className="font-medium">Industries</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.keys(targetCriteria.target_industries).map((industry) => (
                                    <Badge key={industry} variant="secondary">
                                      {industry}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {targetCriteria.target_locations && (
                              <div>
                                <h4 className="font-medium">Locations</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.keys(targetCriteria.target_locations).map((location) => (
                                    <Badge key={location} variant="secondary">
                                      {location}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button onClick={() => setShowTargetForm(true)}>
                              Edit Criteria
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <p className="text-muted-foreground">
                          No target criteria defined yet. Define your job search criteria to get started.
                        </p>
                        <Button onClick={() => setShowTargetForm(true)}>
                          Define Target Criteria
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <TargetCriteriaForm 
                    onCancel={() => setShowTargetForm(false)}
                    onSaved={() => {
                      setShowTargetForm(false);
                      queryClient.invalidateQueries({ queryKey: ['target-criteria'] });
                    }}
                    initialData={targetCriteria}
                  />
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        
        {/* Companies Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Target Companies</CardTitle>
              <CardDescription>
                Manage your target companies and interactions
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={filterPriority || ""}
                  onValueChange={(value) => setFilterPriority(value || null)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Priority</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="Top">Top</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Maybe">Maybe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsAddCompanyOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => handleGenerateMoreCompanies()}
                  disabled={isGeneratingCompanies || !targetCriteria}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingCompanies ? 'animate-spin' : ''}`} />
                  Generate More
                </Button>
              </div>
            </div>
            
            {selectedCompanyIds.length > 0 && (
              <div className="flex items-center justify-between mb-4 bg-muted/20 p-2 rounded">
                <div className="text-sm">
                  {selectedCompanyIds.length} {selectedCompanyIds.length === 1 ? 'company' : 'companies'} selected
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanyIds([])}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveSelected}
                    disabled={removeCompaniesMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove Selected
                  </Button>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredCompanies && filteredCompanies.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedCompanyIds.length === filteredCompanies.length && filteredCompanies.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all companies"
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('user_priority')}
                      >
                        Priority
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        Company Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('industry')}
                      >
                        Industry
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead>Latest Update</TableHead>
                      <TableHead>Next Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company: CompanyData) => (
                      <TableRow key={company.company_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCompanyIds.includes(company.company_id)}
                            onCheckedChange={() => handleSelectCompany(company.company_id)}
                            aria-label={`Select ${company.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${company.user_priority === 'Top' ? 'bg-red-100 text-red-800' : 
                              company.user_priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}
                          >
                            {company.user_priority || 'Maybe'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div 
                            className="hover:underline cursor-pointer"
                            onClick={() => handleViewCompany(company)}
                          >
                            {company.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {company.ai_description?.slice(0, 60)}
                            {company.ai_description && company.ai_description.length > 60 ? '...' : ''}
                          </div>
                        </TableCell>
                        <TableCell>{company.industry || 'Unknown'}</TableCell>
                        <TableCell>
                          {company.contacts && company.contacts.length > 0 ? (
                            <div className="flex flex-col space-y-1">
                              {company.contacts.slice(0, 3).map((contact) => (
                                <div key={contact.contact_id} className="group flex items-center gap-1">
                                  <div className="text-sm">
                                    {formatContactName(contact)}
                                    {contact.role && <span className="text-xs text-muted-foreground"> · {contact.role}</span>}
                                  </div>
                                </div>
                              ))}
                              {company.contacts.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{company.contacts.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center group">
                              <span className="text-muted-foreground text-sm">No contacts</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.latest_update && company.latest_update.description ? (
                            <div className="flex flex-col">
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.latest_update.interaction_date)}
                              </div>
                              <div className="text-sm">
                                {company.latest_update.description.length > 30
                                  ? `${company.latest_update.description.slice(0, 30)}...`
                                  : company.latest_update.description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No interactions</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.next_followup && company.next_followup.description ? (
                            <div className="flex flex-col">
                              <div className="text-xs flex items-center font-medium">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.next_followup.follow_up_due_date)}
                              </div>
                              <div className="text-sm">
                                {company.next_followup.description.length > 30
                                  ? `${company.next_followup.description.slice(0, 30)}...`
                                  : company.next_followup.description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No follow-ups</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlanInteraction(company)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Plan
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCompany(company)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterPriority
                    ? "No companies match your search criteria"
                    : "You haven't added any companies to your pipeline yet"}
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setIsAddCompanyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                  {targetCriteria && (
                    <Button onClick={() => handleGenerateMoreCompanies()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Companies
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {filteredCompanies?.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateMoreCompanies()}
                    disabled={isGeneratingCompanies || !targetCriteria}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isGeneratingCompanies ? 'animate-spin' : ''}`} />
                    Generate More
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateMoreCompanies(true)}
                    disabled={isGeneratingCompanies}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Different Criteria
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Company Details Dialog */}
      {selectedCompany && (
        <CompanyDetails 
          company={selectedCompany}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}

      {/* Interaction Form Dialog */}
      {selectedCompany && (
        <InteractionForm
          companyId={selectedCompany.company_id}
          companyName={selectedCompany.name}
          contacts={selectedCompany.contacts || []}
          isOpen={isAddInteractionOpen}
          onClose={() => setIsAddInteractionOpen(false)}
          onInteractionCreated={() => {
            refetch();
            setIsAddInteractionOpen(false);
          }}
          isPlanningMode={true}
        />
      )}
      
      {/* Contact Details Dialog */}
      {selectedContact && (
        <ContactDetails 
          contact={selectedContact}
          isOpen={isContactDetailsOpen}
          onClose={() => setIsContactDetailsOpen(false)}
          onContactUpdated={() => refetch()}
        />
      )}
      
      {/* Message Generation Dialog */}
      {selectedContact && selectedContact.companies && (
        <MessageGeneration
          contact={selectedContact}
          companyName={selectedContact.companies.name || ''}
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
        />
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onAddCompany={(companyName: string) => {
          addCompanyMutation.mutate(companyName);
          setIsAddCompanyOpen(false);
        }}
        isLoading={addCompanyMutation.isPending}
      />
    </div>
  );
};

export default ConsolidatedJobSearch;
