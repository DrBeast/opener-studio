
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Background } from "@/types/profile";
import { toast } from "@/hooks/use-toast";

// Helper function to ensure we have a string array from Json type
const ensureStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
};

export const useProfileData = (userId: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [backgroundSummary, setBackgroundSummary] = useState<Background | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        return;
      }
      
      try {
        setIsLoading(true);

        // Fetch profile from user_profiles
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
          
        if (error && error.code !== "PGRST116") {
          throw error;
        }
        
        if (data) {
          setProfile(data);
        }

        // Fetch summary data from the user_summaries table
        const { data: summaryData, error: summaryError } = await supabase
          .from("user_summaries")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
          
        if (summaryError && summaryError.code !== "PGRST116") {
          console.error("Error fetching summary data:", summaryError);
        }
        
        if (summaryData) {
          setBackgroundSummary({
            experience: summaryData.experience,
            education: summaryData.education,
            expertise: summaryData.expertise,
            achievements: summaryData.achievements,
            overall_blurb: summaryData.overall_blurb,
            combined_experience_highlights: ensureStringArray(summaryData.combined_experience_highlights),
            combined_education_highlights: ensureStringArray(summaryData.combined_education_highlights),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(summaryData.technical_expertise),
            value_proposition_summary: summaryData.value_proposition_summary
          });
        } else {
          // Set dummy data if no summary was found
          setBackgroundSummary({
            experience: "Product leader with expertise in SaaS and technology companies.",
            education: "MBA from a top business school with undergraduate degree in Computer Science.",
            expertise: "Product strategy, cross-functional leadership, and go-to-market execution.",
            achievements: "Successfully launched multiple products driving significant revenue growth."
          });
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error.message);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);

  // Function to save profile data
  const saveUserProfile = async (userId: string, profileData: {
    linkedin_content?: string;
    additional_details?: string;
    cv_content?: string;
  }) => {
    if (!userId) return;
    
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      let upsertError;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("user_profiles")
          .update({
            linkedin_content: profileData.linkedin_content || null,
            additional_details: profileData.additional_details || null,
            cv_content: profileData.cv_content || null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);
          
        upsertError = error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: userId,
            linkedin_content: profileData.linkedin_content || null,
            additional_details: profileData.additional_details || null,
            cv_content: profileData.cv_content || null
          });
          
        upsertError = error;
      }
      
      if (upsertError) throw upsertError;
    } catch (error: any) {
      console.error(`Error saving profile data:`, error.message);
      toast({
        title: "Error",
        description: `Failed to save profile data: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Function to save summary data
  const saveSummaryData = async (userId: string, summaryData: Background) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("user_summaries")
        .upsert({
          user_id: userId,
          experience: summaryData.experience,
          education: summaryData.education,
          expertise: summaryData.expertise,
          achievements: summaryData.achievements,
          overall_blurb: summaryData.overall_blurb,
          combined_experience_highlights: summaryData.combined_experience_highlights,
          combined_education_highlights: summaryData.combined_education_highlights,
          key_skills: summaryData.key_skills,
          domain_expertise: summaryData.domain_expertise,
          technical_expertise: summaryData.technical_expertise,
          value_proposition_summary: summaryData.value_proposition_summary,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });
        
      if (error) {
        throw new Error(`Error updating summary: ${error.message}`);
      }
    } catch (error: any) {
      console.error(`Error saving summary data:`, error.message);
      toast({
        title: "Error",
        description: `Failed to save summary data: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Function to regenerate the AI summary
  const regenerateAISummary = async (userId: string, userEmail: string) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("generate_profile", {
        body: {
          userId: userId,
          userEmail: userEmail
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.summary) {
        setBackgroundSummary(data.summary);
        return data.summary;
      }
      
      return null;
    } catch (error: any) {
      console.error("Error regenerating summary:", error.message);
      toast({
        title: "Error",
        description: `Failed to regenerate summary: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Function to reset user data
  const resetUserData = async (userId: string) => {
    if (!userId) return;
    
    try {
      // Delete user profile data
      const { error: profileError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("user_id", userId);
      if (profileError) throw profileError;

      // Delete user summary data
      const { error: summaryError } = await supabase
        .from("user_summaries")
        .delete()
        .eq("user_id", userId);
      if (summaryError) throw summaryError;

      // Delete user target criteria
      const { error: targetError } = await supabase
        .from("target_criteria")
        .delete()
        .eq("user_id", userId);
      if (targetError) throw targetError;
      
      // Clear state
      setProfile(null);
      setBackgroundSummary(null);
      
      return true;
    } catch (error: any) {
      console.error("Error resetting user data:", error.message);
      toast({
        title: "Error",
        description: `Failed to reset user data: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    profile,
    backgroundSummary,
    isLoading,
    saveUserProfile,
    saveSummaryData,
    regenerateAISummary,
    resetUserData,
    setBackgroundSummary
  };
};
