import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ContactInteractionOverview {
  overview: string;
  hasInteractions: boolean;
  interactionCount?: number;
  pastCount?: number;
  plannedCount?: number;
}

export const useContactInteractionOverview = (contactId: string) => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<ContactInteractionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOverview = async () => {
    if (!user || !contactId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate_contact_interaction_overview",
        {
          body: { contactId: contactId },
        }
      );

      if (error) throw error;

      if (data?.overview) {
        setOverview(data);
      } else {
        setOverview({
          overview: "No interactions yet",
          hasInteractions: false,
        });
      }
    } catch (error: any) {
      console.error("Error generating contact interaction overview:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateOverview = () => {
    generateOverview();
  };

  useEffect(() => {
    if (contactId && user) {
      // First try to get existing summary from contacts table
      const fetchStoredSummary = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log(`Fetching stored summary for contact ${contactId}`);
          
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('interaction_summary')
            .eq('contact_id', contactId)
            .eq('user_id', user.id)
            .single();
            
          if (contactError) {
            console.error('Error fetching contact:', contactError);
            throw contactError;
          }
          
          console.log('Stored summary:', contact?.interaction_summary);
          
          if (contact?.interaction_summary && contact.interaction_summary !== "No interactions yet with this contact.") {
            setOverview({
              overview: contact.interaction_summary,
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
  }, [contactId, user]);

  return {
    overview,
    isLoading,
    error,
    regenerateOverview,
  };
};