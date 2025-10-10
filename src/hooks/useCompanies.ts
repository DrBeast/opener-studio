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
  last_interaction_date?: string;
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
    try {
      const { data, error } = await supabase.rpc("get_companies_overview", {
        user_id_param: user.id,
      });

      if (error) throw error;

      const companiesData = data.map((company: any) => ({
        ...company,
        user_priority:
          company.user_priority || calculatePriority(company.match_quality_score),
        contacts: company.contacts || [],
      }));

      setCompanies(companiesData);
    } catch (error: any) {
      console.error("Error fetching companies overview:", error);
      toast({
        title: "Error",
        description: "Failed to load companies. Please try again.",
        variant: "destructive",
      });
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
