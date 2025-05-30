
import { supabase } from "@/integrations/supabase/client";
import { Background } from "@/types/profile";

export const createDefaultTargetCriteria = async (userId: string, backgroundSummary: Background | null) => {
  try {
    // Extract location from background or use default
    const defaultLocation = backgroundSummary?.overall_blurb?.match(/(?:based in|located in|from)\s+([^,.]+)/i)?.[1] || "United States";
    
    // Infer industry from background
    let defaultIndustries = ["Technology"];
    if (backgroundSummary?.overall_blurb) {
      const blurb = backgroundSummary.overall_blurb.toLowerCase();
      if (blurb.includes("finance") || blurb.includes("banking")) {
        defaultIndustries = ["Financial Services"];
      } else if (blurb.includes("healthcare") || blurb.includes("medical")) {
        defaultIndustries = ["Healthcare"];
      } else if (blurb.includes("consulting")) {
        defaultIndustries = ["Consulting"];
      } else if (blurb.includes("biotech") || blurb.includes("pharmaceutical")) {
        defaultIndustries = ["Biotechnology"];
      }
    }
    
    // Infer functions from background
    let defaultFunctions = ["Product Management"];
    if (backgroundSummary?.key_skills) {
      const skills = JSON.stringify(backgroundSummary.key_skills).toLowerCase();
      if (skills.includes("engineer") || skills.includes("software") || skills.includes("technical")) {
        defaultFunctions = ["Engineering"];
      } else if (skills.includes("marketing") || skills.includes("growth")) {
        defaultFunctions = ["Marketing"];
      } else if (skills.includes("sales") || skills.includes("business development")) {
        defaultFunctions = ["Sales"];
      } else if (skills.includes("finance") || skills.includes("accounting")) {
        defaultFunctions = ["Finance"];
      }
    }

    const defaultCriteria = {
      user_id: userId,
      target_functions: defaultFunctions,
      target_locations: [defaultLocation],
      target_wfh_preference: ["Hybrid", "Remote"],
      free_form_role_and_company_description: `Looking for opportunities in ${defaultIndustries[0].toLowerCase()} companies that value innovation and growth.`,
      target_industries: defaultIndustries,
      target_sizes: ["201-1000", "1000+"],
      target_public_private: ["Public", "Private"],
      similar_companies: [],
      visa_sponsorship_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('target_criteria')
      .insert(defaultCriteria)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating default target criteria:', error);
    throw error;
  }
};
