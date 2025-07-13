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
          body: { contact_id: contactId },
        }
      );

      if (error) throw error;

      if (data?.overview) {
        setOverview(data.overview);
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
    if (contactId) {
      generateOverview();
    }
  }, [contactId, user]);

  return {
    overview,
    isLoading,
    error,
    regenerateOverview,
  };
};