
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

  const generateOverview = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Generating overview for company ${companyId}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('generate_interaction_overview', {
        body: { companyId }
      });
      
      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }
      
      console.log('Generated overview data:', data);
      
      setOverview({
        overview: data.overview,
        hasInteractions: data.hasInteractions,
        interactionCount: data.interactionCount,
        pastCount: data.pastCount,
        plannedCount: data.plannedCount
      });
    } catch (err: any) {
      console.error('Error generating interaction overview:', err);
      setError(err.message || 'Failed to generate overview');
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateOverview = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Regenerating overview for company ${companyId}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('regenerate_interaction_summary', {
        body: { companyId }
      });
      
      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }
      
      console.log('Regenerated summary data:', data);
      
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
          console.log(`Fetching stored summary for company ${companyId}`);
          
          const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('interaction_summary')
          .eq('company_id', companyId)
          .eq('user_id', user.id)  // Add this line
          .single();
            
          if (companyError) {
            console.error('Error fetching company:', companyError);
            throw companyError;
          }
          
          console.log('Stored summary:', company?.interaction_summary);
          
          if (company?.interaction_summary && company.interaction_summary !== "No interactions yet with this company.") {
            setOverview({
              overview: company.interaction_summary,
              hasInteractions: true,
            });
          } else {
            // No stored summary or placeholder text, generate one
            console.log('No valid stored summary found, generating new one');
            await generateOverview();
          }
        } catch (err: any) {
          console.error('Error fetching stored summary:', err);
          // If fetching fails, try to generate a new summary
          await generateOverview();
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
