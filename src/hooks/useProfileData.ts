
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

// Helper function to convert third-person descriptions to second-person
const convertToSecondPerson = (text: string): string => {
  if (!text) return text;
  
  // Common patterns to replace
  const replacements = [
    { pattern: /The user is/gi, replacement: "You are" },
    { pattern: /The user has/gi, replacement: "You have" },
    { pattern: /The user brings/gi, replacement: "You bring" },
    { pattern: /The user specializes/gi, replacement: "You specialize" },
    { pattern: /The user works/gi, replacement: "You work" },
    { pattern: /The user's/gi, replacement: "Your" },
    { pattern: /\bHe is/gi, replacement: "You are" },
    { pattern: /\bShe is/gi, replacement: "You are" },
    { pattern: /\bHe has/gi, replacement: "You have" },
    { pattern: /\bShe has/gi, replacement: "You have" },
    { pattern: /\bHis /gi, replacement: "Your " },
    { pattern: /\bHer /gi, replacement: "Your " },
  ];
  
  let result = text;
  replacements.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });
  
  return result;
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
            experience: convertToSecondPerson(summaryData.experience),
            education: convertToSecondPerson(summaryData.education),
            expertise: convertToSecondPerson(summaryData.expertise),
            achievements: convertToSecondPerson(summaryData.achievements),
            overall_blurb: convertToSecondPerson(summaryData.overall_blurb),
            combined_experience_highlights: ensureStringArray(summaryData.combined_experience_highlights),
            combined_education_highlights: ensureStringArray(summaryData.combined_education_highlights),
            key_skills: ensureStringArray(summaryData.key_skills),
            domain_expertise: ensureStringArray(summaryData.domain_expertise),
            technical_expertise: ensureStringArray(summaryData.technical_expertise),
            value_proposition_summary: convertToSecondPerson(summaryData.value_proposition_summary)
          });
        } else {
          // Set dummy data if no summary was found
          setBackgroundSummary({
            experience: "You are a product leader with expertise in SaaS and technology companies.",
            education: "You have an MBA from a top business school with undergraduate degree in Computer Science.",
            expertise: "You specialize in product strategy, cross-functional leadership, and go-to-market execution.",
            achievements: "You have successfully launched multiple products driving significant revenue growth."
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

  // Function to save profile data - now handles the unified background_input field
  const saveUserProfile = async (userId: string, profileData: {
    background_input?: string;
    linkedin_content?: string;
    additional_details?: string;
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
            background_input: profileData.background_input || null,
            linkedin_content: profileData.linkedin_content || null,
            additional_details: profileData.additional_details || null,
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
            background_input: profileData.background_input || null,
            linkedin_content: profileData.linkedin_content || null,
            additional_details: profileData.additional_details || null
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
      console.log("Calling generate_profile function...");
      const { data, error } = await supabase.functions.invoke("generate_profile", {
        body: {
          userId: userId,
          userEmail: userEmail
        }
      });
      
      console.log("Edge function response:", { data, error });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Edge function error: ${error.message || "Unknown error"}`);
      }
      
      if (!data) {
        throw new Error("No data returned from edge function");
      }
      
      if (!data.success) {
        throw new Error(data.message || "Edge function returned failure status");
      }
      
      if (data && data.summary) {
        // Convert to second person before setting
        const convertedSummary = {
          ...data.summary,
          experience: convertToSecondPerson(data.summary.experience),
          education: convertToSecondPerson(data.summary.education),
          expertise: convertToSecondPerson(data.summary.expertise),
          achievements: convertToSecondPerson(data.summary.achievements),
          overall_blurb: convertToSecondPerson(data.summary.overall_blurb),
          value_proposition_summary: convertToSecondPerson(data.summary.value_proposition_summary)
        };
        
        setBackgroundSummary(convertedSummary);
        return convertedSummary;
      } else {
        throw new Error("No summary data in response");
      }
    } catch (error: any) {
      console.error("Error regenerating summary:", error);
      
      // Provide more specific error messaging
      let errorMessage = "Failed to regenerate summary";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
    setBackgroundSummary
  };
};
