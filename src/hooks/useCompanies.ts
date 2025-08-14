import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/airtable-ds/use-toast";

interface Contact {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  latest_interaction_date?: string;
}

interface Interaction {
  interaction_id: string;
  description: string;
  interaction_date: string;
  interaction_type: string;
  follow_up_due_date?: string;
}

export interface Company {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  wfh_policy?: string;
  ai_description?: string;
  ai_match_reasoning?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe';
  is_blacklisted?: boolean;
  status?: 'active' | 'inactive';
  match_quality_score?: number;
  interaction_summary?: string;
  contacts?: Contact[];
  latest_update?: Interaction;
  next_followup?: Interaction;
}

export const useCompanies = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);

  // Get any newly created companies from location state
  const newCompanies = location.state?.newCompanies || [];
  const highlightNew = location.state?.highlightNew || false;
  const newCompanyIds = newCompanies.map((company: any) => company.company_id);

  const calculatePriority = (score?: number): 'Top' | 'Medium' | 'Maybe' => {
    if (!score) return 'Maybe';
    if (score >= 80) return 'Top';
    if (score >= 60) return 'Medium';
    return 'Maybe';
  };

  const fetchCompanies = async () => {
    if (!user) return;
    
    setIsLoading(true);
    let companiesData: Company[] = [];
    let successfullyFetched = false;
    
    try {
      // Try calling the get_companies_overview function first
      const { data: response, error: functionError } = await supabase.functions.invoke('get_companies_overview');
      
      if (!functionError && response && response.companies && Array.isArray(response.companies)) {
        companiesData = response.companies.map((company: any) => ({
          company_id: company.company_id,
          name: company.name,
          industry: company.industry,
          hq_location: company.hq_location,
          wfh_policy: company.wfh_policy,
          ai_description: company.ai_description,
          ai_match_reasoning: company.ai_match_reasoning,
          user_priority: company.user_priority || calculatePriority(company.match_quality_score),
          is_blacklisted: company.is_blacklisted,
          match_quality_score: company.match_quality_score,
          interaction_summary: company.interaction_summary,
          contacts: company.contacts || [],
          latest_update: company.latest_update?.interaction_id ? company.latest_update : undefined,
          next_followup: company.next_followup?.interaction_id ? company.next_followup : undefined
        }));
        successfullyFetched = true;
      }
    } catch (error) {
      console.log("Function call failed, trying fallback query:", error);
    }
    
    // If the function fails, fallback to direct query with contacts
    if (!successfullyFetched) {
      try {
        // First get companies
        const { data: companiesOnly, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_blacklisted', false)
          .order('user_priority', { ascending: true })
          .order('name');
          
        if (companiesError) throw companiesError;
        
        // Then get contacts for each company
        const companyIds = (companiesOnly || []).map(c => c.company_id);
        let contactsData: any[] = [];
        
        if (companyIds.length > 0) {
          const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select(`
              contact_id,
              company_id,
              first_name,
              last_name,
              role,
              added_at
            `)
            .eq('user_id', user.id)
            .in('company_id', companyIds);
            
          if (!contactsError) {
            contactsData = contacts || [];
          }
        }
        
        // Combine companies with their contacts
        companiesData = (companiesOnly || []).map((company: any) => {
          const companyContacts = contactsData
            .filter(contact => contact.company_id === company.company_id)
            .map(contact => ({
              contact_id: contact.contact_id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              role: contact.role,
              latest_interaction_date: contact.added_at // Use added_at as fallback
            }));
            
          return {
            company_id: company.company_id,
            name: company.name,
            industry: company.industry,
            hq_location: company.hq_location,
            wfh_policy: company.wfh_policy,
            ai_description: company.ai_description,
            ai_match_reasoning: company.ai_match_reasoning,
            user_priority: company.user_priority || calculatePriority(company.match_quality_score),
            is_blacklisted: company.is_blacklisted,
            match_quality_score: company.match_quality_score,
            interaction_summary: company.interaction_summary,
            contacts: companyContacts,
            latest_update: undefined,
            next_followup: undefined
          };
        });
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

  const handleSetPriority = async (companyId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ user_priority: priority })
        .eq('company_id', companyId);
        
      if (error) throw error;
      
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
      
      setCompanies(prev => prev.filter(company => company.company_id !== companyId));
      
      toast({
        title: "Success",
        description: "Company blacklisted. Contacts and interactions remain accessible.",
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

  const handleBulkBlacklist = async (companyIds: string[]) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_blacklisted: true })
        .in('company_id', companyIds);
        
      if (error) throw error;
      
      setCompanies(prev => prev.filter(company => !companyIds.includes(company.company_id)));
      setSelectedCompanies(new Set());
      
      toast({
        title: "Success",
        description: `${companyIds.length} companies blacklisted. Contacts and interactions remain accessible.`,
      });
    } catch (error: any) {
      console.error("Error bulk blacklisting companies:", error);
      toast({
        title: "Error",
        description: "Failed to blacklist companies",
        variant: "destructive"
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.company_id)));
    }
  };

  const toggleCompanyStatus = async (companyId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('company_id', companyId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchCompanies();
      toast({
        title: "Success",
        description: `Company marked as ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Error updating company status:", error);
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive"
      });
    }
  };

  // Filter companies based on showInactive toggle
  const filteredCompanies = showInactive 
    ? companies 
    : companies.filter(company => company.status !== 'inactive');

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  return {
    companies: filteredCompanies,
    allCompanies: companies,
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
    showInactive,
    setShowInactive,
    toggleCompanyStatus,
  };
};
