
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ProfileBreadcrumbs } from "@/components/ProfileBreadcrumbs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, 
  Filter, 
  Plus, 
  X, 
  FileText,
  UserRound,
  Calendar,
  AlertCircle,
  Pencil,
  Check,
  MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyDetails } from "@/components/CompanyDetails";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InteractionForm } from "@/components/InteractionForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  user_priority?: 'High' | 'Medium' | 'Low' | 'Maybe';
  user_notes?: string;
  ai_description?: string;
  updated_at?: string;
  contacts?: {
    contact_id: string;
    first_name?: string;
    last_name?: string;
  }[];
  last_interaction?: {
    interaction_date: string;
    description: string;
  };
  next_action?: {
    follow_up_due_date: string;
    description: string;
  };
}

const PipelineDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddInteractionOpen, setIsAddInteractionOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{[key: string]: string}>({});
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  
  // Fetch companies from Supabase with related data
  const { data: companies, isLoading, error, refetch } = useQuery({
    queryKey: ['pipeline-companies', sortField, sortDirection, filterPriority],
    queryFn: async () => {
      // Create query
      let query = supabase
        .from('companies')
        .select(`
          *,
          contacts(
            contact_id,
            first_name,
            last_name
          )
        `);
      
      // Apply priority filter if set
      if (filterPriority) {
        query = query.eq('user_priority', filterPriority);
      }
      
      // Apply sorting
      const { data: companiesData, error: companiesError } = await query
        .order(sortField, { ascending: sortDirection === 'asc' });
        
      if (companiesError) throw companiesError;
      
      // Fetch the latest interaction for each company
      const companiesWithInteractions = await Promise.all(
        companiesData.map(async (company) => {
          // Get latest interaction
          const { data: latestInteraction } = await supabase
            .from('interactions')
            .select('interaction_date, description')
            .eq('company_id', company.company_id)
            .order('interaction_date', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          // Get next follow-up action
          const { data: nextAction } = await supabase
            .from('interactions')
            .select('follow_up_due_date, description')
            .eq('company_id', company.company_id)
            .eq('follow_up_completed', false)
            .not('follow_up_due_date', 'is', null)
            .order('follow_up_due_date', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          return {
            ...company,
            last_interaction: latestInteraction || null,
            next_action: nextAction || null
          };
        })
      );
      
      return companiesWithInteractions as CompanyData[];
    }
  });
  
  // Filter companies based on search query
  const filteredCompanies = companies?.filter(company => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const contactNames = company.contacts?.map(c => 
      `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    ).join(' ') || '';
    
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

  // Open company details
  const handleViewCompany = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };
  
  // Handle company updates
  const handleCompanyUpdated = () => {
    refetch();
    setIsDetailsOpen(false);
  };

  // Start editing a company field inline
  const startEditing = (companyId: string, field: string, value: string) => {
    setEditingCompanyId(companyId);
    setEditData({ ...editData, [field]: value || '' });
  };

  // Save edited company field
  const saveEditing = async (companyId: string, field: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ [field]: editData[field], updated_at: new Date().toISOString() })
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      setEditingCompanyId(null);
      setEditData({});
      refetch();
      toast.success("Updated successfully");
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update");
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCompanyId(null);
    setEditData({});
  };

  // Format a date nicely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format contact name with initial
  const formatContactName = (contact: { first_name?: string, last_name?: string }) => {
    const firstName = contact.first_name || '';
    const lastInitial = contact.last_name ? `${contact.last_name.charAt(0)}` : '';
    return firstName + (lastInitial ? ` ${lastInitial}` : '');
  };

  // Open interaction form for planning a new interaction
  const handlePlanInteraction = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsAddInteractionOpen(true);
  };

  // Handle errors
  if (error) {
    toast.error("Failed to load pipeline data");
  }

  return (
    <div className="container mx-auto py-8 max-w-full">
      <ProfileBreadcrumbs />
      
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Pipeline Overview</CardTitle>
              <CardDescription>
                Track your job search progress across companies
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters {filterPriority && <Badge className="ml-1">{filterPriority}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    <h4 className="font-medium">Priority</h4>
                    <Select
                      value={filterPriority || ""}
                      onValueChange={(value) => setFilterPriority(value || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All priorities</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFilterPriority(null)}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4"
                />
              </div>
            </div>
            
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
                      <TableHead className="w-[180px]" onClick={() => handleSort('name')} role="button">
                        Company Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('industry')} role="button">
                        Industry
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('hq_location')} role="button">
                        Location
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead onClick={() => handleSort('user_priority')} role="button">
                        Priority
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead className="w-[220px]">Latest Update</TableHead>
                      <TableHead className="w-[220px]">Next Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.company_id}>
                        <TableCell>
                          {editingCompanyId === company.company_id && editData.hasOwnProperty('name') ? (
                            <div className="flex items-center space-x-1">
                              <Input 
                                value={editData.name} 
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                                className="h-8 py-1"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => saveEditing(company.company_id, 'name')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <div className="font-medium">{company.name}</div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" 
                                onClick={() => startEditing(company.company_id, 'name', company.name)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {editingCompanyId === company.company_id && editData.hasOwnProperty('industry') ? (
                            <div className="flex items-center space-x-1">
                              <Input 
                                value={editData.industry} 
                                onChange={(e) => setEditData({...editData, industry: e.target.value})}
                                className="h-8 py-1"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => saveEditing(company.company_id, 'industry')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <div>{company.industry || 'N/A'}</div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" 
                                onClick={() => startEditing(company.company_id, 'industry', company.industry || '')}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {editingCompanyId === company.company_id && editData.hasOwnProperty('hq_location') ? (
                            <div className="flex items-center space-x-1">
                              <Input 
                                value={editData.hq_location} 
                                onChange={(e) => setEditData({...editData, hq_location: e.target.value})}
                                className="h-8 py-1"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={() => saveEditing(company.company_id, 'hq_location')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0" 
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <div>{company.hq_location || 'N/A'}</div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" 
                                onClick={() => startEditing(company.company_id, 'hq_location', company.hq_location || '')}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {editingCompanyId === company.company_id && editData.hasOwnProperty('user_priority') ? (
                            <div className="flex items-center space-x-1">
                              <Select 
                                value={editData.user_priority} 
                                onValueChange={(value) => {
                                  setEditData({...editData, user_priority: value});
                                  saveEditing(company.company_id, 'user_priority');
                                }}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Maybe">Maybe</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 group">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                ${company.user_priority === 'High' ? 'bg-red-100 text-red-800' : 
                                  company.user_priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  company.user_priority === 'Low' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'}`}
                                onClick={() => startEditing(company.company_id, 'user_priority', company.user_priority || 'Maybe')}
                              >
                                {company.user_priority || 'Maybe'}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {company.contacts && company.contacts.length > 0 ? (
                            <div className="flex flex-col space-y-1">
                              {company.contacts.slice(0, 3).map((contact) => (
                                <div key={contact.contact_id} className="text-sm hover:underline cursor-pointer" onClick={() => handleViewCompany(company)}>
                                  {formatContactName(contact)}
                                </div>
                              ))}
                              {company.contacts.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{company.contacts.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No contacts</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {company.last_interaction ? (
                            <div className="flex flex-col">
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.last_interaction.interaction_date)}
                              </div>
                              <div className="text-sm">
                                {company.last_interaction.description}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No interactions</div>
                          )}
                        </TableCell>

                        <TableCell>
                          {company.next_action ? (
                            <div className="flex flex-col">
                              <div className="text-xs flex items-center font-medium">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(company.next_action.follow_up_due_date)}
                              </div>
                              <div className="text-sm">
                                {company.next_action.description}
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
                  {searchQuery ? "No companies match your search criteria" : "You haven't added any companies to your pipeline yet"}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
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

      {/* Interaction Form Dialog for Planning */}
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
    </div>
  );
};

export default PipelineDashboard;
