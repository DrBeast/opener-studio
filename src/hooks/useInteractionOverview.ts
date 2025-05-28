
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface InteractionOverview {
  overview: string;
  hasInteractions: boolean;
  interactionCount?: number;
  pastCount?: number;
  plannedCount?: number;
}

export const useInteractionOverview = (companyId: string) => {
  const [overview, setOverview] = useState<InteractionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerateOverview = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: functionError } = await supabase.functions.invoke('regenerate_interaction_summary', {
        body: { companyId }
      });
      
      if (functionError) throw functionError;
      
      setOverview({
        overview: data.summary,
        hasInteractions: data.hasInteractions,
        interactionCount: data.interactionCount,
        pastCount: data.pastCount,
        plannedCount: data.plannedCount
      });
    } catch (err: any) {
      console.error('Error regenerating interaction overview:', err);
      setError(err.message || 'Failed to regenerate overview');
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      // First try to get existing summary from companies table
      const fetchStoredSummary = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('interaction_summary')
            .eq('company_id', companyId)
            .single();
            
          if (companyError) throw companyError;
          
          if (company?.interaction_summary) {
            setOverview({
              overview: company.interaction_summary,
              hasInteractions: company.interaction_summary !== "No interactions yet with this company.",
            });
          } else {
            // No stored summary, generate one
            await regenerateOverview();
          }
        } catch (err: any) {
          console.error('Error fetching stored summary:', err);
          setError(err.message || 'Failed to load overview');
          setOverview(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchStoredSummary();
    }
  }, [companyId]);

  return {
    overview,
    isLoading,
    error,
    regenerateOverview
  };
};
