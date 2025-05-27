
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ContactInteractionOverview {
  overview: string;
  hasInteractions: boolean;
  interactionCount?: number;
  pastCount?: number;
  plannedCount?: number;
}

export const useContactInteractionOverview = (contactId: string) => {
  const [overview, setOverview] = useState<ContactInteractionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOverview = async () => {
    if (!contactId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Generating contact overview for contact ${contactId}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('generate_contact_interaction_overview', {
        body: { contactId }
      });
      
      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }
      
      console.log('Generated contact overview data:', data);
      
      setOverview({
        overview: data.overview,
        hasInteractions: data.hasInteractions,
        interactionCount: data.interactionCount,
        pastCount: data.pastCount,
        plannedCount: data.plannedCount
      });
    } catch (err: any) {
      console.error('Error generating contact interaction overview:', err);
      setError(err.message || 'Failed to generate overview');
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateOverview = async () => {
    await generateOverview();
  };

  useEffect(() => {
    if (contactId) {
      generateOverview();
    }
  }, [contactId]);

  return {
    overview,
    isLoading,
    error,
    regenerateOverview
  };
};
