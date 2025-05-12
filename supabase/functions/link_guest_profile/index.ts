
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const { sessionId, userId } = await req.json();

    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Attempting to link guest profile with sessionId: ${sessionId} to userId: ${userId}`);

    // 1. Check if user already has a profile
    const { data: existingUserProfile, error: profileCheckError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (profileCheckError) {
      throw new Error(`Error checking for existing user profile: ${profileCheckError.message}`);
    }

    // 2. Find the temporary profile
    const { data: tempProfile, error: tempProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .maybeSingle();
      
    if (tempProfileError) {
      throw new Error(`Error finding temporary profile: ${tempProfileError.message}`);
    }
    
    if (!tempProfile) {
      return new Response(
        JSON.stringify({ error: "No temporary profile found with the provided session ID" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Find any temporary profile summary
    const { data: tempSummary, error: tempSummaryError } = await supabaseClient
      .from("user_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .maybeSingle();
      
    if (tempSummaryError && tempSummaryError.code !== "PGRST116") { // Ignore "not found" errors
      throw new Error(`Error finding temporary summary: ${tempSummaryError.message}`);
    }

    // Begin transaction - we need to update both the profile and potentially the summary
    // Unfortunately, we can't use actual transactions with the JS client, but we can handle errors appropriately
    
    let result;
    
    if (existingUserProfile) {
      // 4A. If user already has a profile, update the profile with the temporary data
      const { error: updateProfileError } = await supabaseClient
        .from("user_profiles")
        .update({
          linkedin_content: tempProfile.linkedin_content || existingUserProfile.linkedin_content,
          additional_details: tempProfile.additional_details || existingUserProfile.additional_details,
          cv_content: tempProfile.cv_content || existingUserProfile.cv_content,
          updated_at: new Date().toISOString(),
          is_temporary: false,
          temp_created_at: null,
          session_id: null // Clear session ID as it's now a permanent profile
        })
        .eq("user_id", userId);
        
      if (updateProfileError) {
        throw new Error(`Error updating user profile: ${updateProfileError.message}`);
      }
      
      result = { action: "updated_existing_profile" };
    } else {
      // 4B. If user doesn't have a profile, convert the temporary profile to a permanent one
      const { error: updateProfileError } = await supabaseClient
        .from("user_profiles")
        .update({
          user_id: userId,
          is_temporary: false,
          temp_created_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("session_id", sessionId)
        .is("user_id", null);
        
      if (updateProfileError) {
        throw new Error(`Error converting temporary profile: ${updateProfileError.message}`);
      }
      
      result = { action: "converted_temp_profile" };
    }

    // 5. If there's a temporary summary, link it to the user
    if (tempSummary) {
      // Check if user already has a summary
      const { data: existingUserSummary, error: summaryCheckError } = await supabaseClient
        .from("user_summaries")
        .select("summary_id")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (summaryCheckError && summaryCheckError.code !== "PGRST116") {
        throw new Error(`Error checking for existing user summary: ${summaryCheckError.message}`);
      }
      
      if (existingUserSummary) {
        // Update existing summary with data from temporary summary
        const { error: updateSummaryError } = await supabaseClient
          .from("user_summaries")
          .update({
            experience: tempSummary.experience,
            education: tempSummary.education,
            expertise: tempSummary.expertise,
            achievements: tempSummary.achievements,
            overall_blurb: tempSummary.overall_blurb,
            combined_experience_highlights: tempSummary.combined_experience_highlights,
            combined_education_highlights: tempSummary.combined_education_highlights,
            key_skills: tempSummary.key_skills,
            domain_expertise: tempSummary.domain_expertise,
            technical_expertise: tempSummary.technical_expertise,
            value_proposition_summary: tempSummary.value_proposition_summary,
            updated_at: new Date().toISOString(),
            session_id: null // Clear session ID as it's now a permanent summary
          })
          .eq("summary_id", existingUserSummary.summary_id);
          
        if (updateSummaryError) {
          throw new Error(`Error updating user summary: ${updateSummaryError.message}`);
        }
        
        // Delete the temporary summary as it's now been merged with the existing one
        await supabaseClient
          .from("user_summaries")
          .delete()
          .eq("session_id", sessionId)
          .is("user_id", null);
          
        result.summary = "updated_existing_summary";
      } else {
        // Convert temporary summary to permanent one
        const { error: updateSummaryError } = await supabaseClient
          .from("user_summaries")
          .update({
            user_id: userId,
            session_id: null, // Clear session ID as it's now a permanent summary
            updated_at: new Date().toISOString()
          })
          .eq("session_id", sessionId)
          .is("user_id", null);
          
        if (updateSummaryError) {
          throw new Error(`Error converting temporary summary: ${updateSummaryError.message}`);
        }
        
        result.summary = "converted_temp_summary";
      }
    }

    // 6. Delete any other temporary data with the same session ID
    // (This shouldn't be necessary as we've updated existing records, but it's a safeguard)
    const { error: cleanupError } = await supabaseClient
      .from("user_profiles")
      .delete()
      .eq("session_id", sessionId)
      .is("user_id", null);
      
    if (cleanupError) {
      console.warn(`Warning: Error during cleanup of any remaining temporary profiles: ${cleanupError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully linked guest profile to user",
        result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error linking guest profile:", error);
    
    return new Response(
      JSON.stringify({
        error: `Failed to link guest profile: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
