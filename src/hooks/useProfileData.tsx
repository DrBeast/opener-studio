import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfileData = (userId: string | undefined) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    // FIX: Do not run if userId is not yet available.
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          user_summaries (*)
        `
        )
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no row was found
        throw error;
      }

      if (data) {
        // The summary is nested, so we flatten it for easier access
        const flattenedProfile = {
          ...data,
          ...data.user_summaries,
        };
        delete flattenedProfile.user_summaries;
        setProfile(flattenedProfile);
      } else {
        setProfile(null);
      }
    } catch (error: any) {
      console.error("Error fetching profile data:", error.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // FIX: Only fetch if userId is present.
    if (userId) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [userId, fetchProfile]);

  const regenerateAISummary = async (
    userId: string,
    backgroundInput: string
  ) => {
    if (!userId) {
      throw new Error("User ID is required to regenerate summary.");
    }
    const { data, error } = await supabase.functions.invoke(
      "generate_profile",
      {
        body: { userId, backgroundInput },
      }
    );

    if (error) {
      return { fnError: error };
    }
    return { summary: data.summary, extractedProfile: data.extractedProfile };
  };

  return { profile, loading, fetchProfile, regenerateAISummary };
};
