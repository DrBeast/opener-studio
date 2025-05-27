
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
      const { data, error: functionError } = await supabase.functions.invoke('generate_interaction_overview', {
        body: { companyId }
      });
      
      if (functionError) throw functionError;
      
      setOverview(data);
    } catch (err: any) {
      console.error('Error generating interaction overview:', err);
      setError(err.message || 'Failed to generate overview');
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      generateOverview();
    }
  }, [companyId]);

  return {
    overview,
    isLoading,
    error,
    regenerateOverview: generateOverview
  };
};
