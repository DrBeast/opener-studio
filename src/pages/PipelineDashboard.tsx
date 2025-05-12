
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
  FileEdit,
  UserRound,
  Calendar,
  AlertCircle
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
  
  // Fetch companies from Supabase with related data
  const { data: companies, isLoading, error, refetch } = useQuery({
    queryKey: ['pipeline-companies'],
    queryFn: async () => {
      // Fetch companies with contacts count
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          contacts:contacts(
            contact_id,
            first_name,
            last_name
          )
        `)
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
    
    return (
      company.name.toLowerCase().includes(query) ||
      (company.industry || "").toLowerCase().includes(query) ||
      (company.hq_location || "").toLowerCase().includes(query) ||
      (company.user_priority || "").toLowerCase().includes(query)
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

  // Handle errors
  if (error) {
    toast.error("Failed to load pipeline data");
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
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
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
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
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]" onClick={() => handleSort('name')} role="button">
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
                      <TableHead>Latest Update</TableHead>
                      <TableHead>Next Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.company_id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.industry || 'N/A'}</TableCell>
                        <TableCell>{company.hq_location || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${company.user_priority === 'High' ? 'bg-red-100 text-red-800' : 
                              company.user_priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              company.user_priority === 'Low' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {company.user_priority || 'Maybe'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {company.contacts && company.contacts.length > 0 ? (
                            <div className="flex items-center">
                              <UserRound className="h-4 w-4 mr-1" />
                              {company.contacts.length}
                            </div>
                          ) : 'None'}
                        </TableCell>
                        <TableCell>
                          {company.last_interaction ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">
                                {new Date(company.last_interaction.interaction_date).toLocaleDateString()}
                              </span>
                              <span className="text-xs line-clamp-1">
                                {company.last_interaction.description}
                              </span>
                            </div>
                          ) : 'No interactions'}
                        </TableCell>
                        <TableCell>
                          {company.next_action ? (
                            <div className="flex flex-col">
                              <span className="text-xs flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(company.next_action.follow_up_due_date).toLocaleDateString()}
                              </span>
                              <span className="text-xs line-clamp-1">
                                {company.next_action.description}
                              </span>
                            </div>
                          ) : 'No follow-ups'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCompany(company)}
                          >
                            <FileEdit className="h-4 w-4 mr-1" />
                            Details
                          </Button>
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
    </div>
  );
};

export default PipelineDashboard;
