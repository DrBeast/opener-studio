
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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

export const useCompanies = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get any newly created companies from location state
  const newCompanies = location.state?.newCompanies || [];
  const highlightNew = location.state?.highlightNew || false;
  const newCompanyIds = newCompanies.map((company: any) => company.company_id);

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

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  return {
    companies,
    isLoading,
    fetchCompanies,
    handleSetPriority,
    handleBlacklist,
    newCompanyIds,
    highlightNew
  };
};

export type { Company };
