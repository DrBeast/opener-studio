
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client with the Deno runtime
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
    const { userId, sessionId } = await req.json();

    if (!userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Linking guest profile (session: ${sessionId}) to user: ${userId}`);

    // Check if the user exists
    const { data: userData, error: userError } = await supabaseClient
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      throw new Error(`Error checking user: ${userError.message}`);
    }

    // Check if guest profile exists
    const { data: guestProfile, error: guestProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_temporary", true)
      .maybeSingle();

    if (guestProfileError && guestProfileError.code !== "PGRST116") {
      throw new Error(`Error checking guest profile: ${guestProfileError.message}`);
    }

    if (!guestProfile) {
      return new Response(
        JSON.stringify({ error: "Guest profile not found for the provided session ID" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Begin transaction
    // Note: Since EdgeRuntime doesn't support proper transactions yet,
    // we'll handle this as a sequence of operations
    
    // Step 1: If the user already has a profile, merge the data
    if (userData) {
      // Update the existing user profile with data from the guest profile
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          linkedin_content: guestProfile.linkedin_content || userData.linkedin_content,
          additional_details: guestProfile.additional_details || userData.additional_details,
          cv_content: guestProfile.cv_content || userData.cv_content,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }
      
      // Delete the guest profile
      const { error: deleteError } = await supabaseClient
        .from("user_profiles")
        .delete()
        .eq("session_id", sessionId)
        .eq("is_temporary", true);

      if (deleteError) {
        console.error(`Warning: Failed to delete guest profile: ${deleteError.message}`);
        // Continue without failing the request
      }
    } else {
      // If the user doesn't have a profile yet, convert the guest profile to a user profile
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          user_id: userId,
          is_temporary: false,
          session_id: null,
          temp_created_at: null,
          updated_at: new Date().toISOString()
        })
        .eq("session_id", sessionId)
        .eq("is_temporary", true);

      if (updateError) {
        throw new Error(`Failed to convert guest profile: ${updateError.message}`);
      }
    }

    // Step 2: Handle the summary data
    // Check if guest summary exists
    const { data: guestSummary, error: guestSummaryError } = await supabaseClient
      .from("user_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (guestSummaryError && guestSummaryError.code !== "PGRST116") {
      throw new Error(`Error checking guest summary: ${guestSummaryError.message}`);
    }

    if (guestSummary) {
      // Check if user already has a summary
      const { data: userSummary, error: userSummaryError } = await supabaseClient
        .from("user_summaries")
        .select("summary_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (userSummaryError && userSummaryError.code !== "PGRST116") {
        throw new Error(`Error checking user summary: ${userSummaryError.message}`);
      }

      if (userSummary) {
        // Update existing user summary with guest data
        const { error: updateSummaryError } = await supabaseClient
          .from("user_summaries")
          .update({
            experience: guestSummary.experience,
            education: guestSummary.education,
            expertise: guestSummary.expertise,
            achievements: guestSummary.achievements,
            overall_blurb: guestSummary.overall_blurb,
            combined_experience_highlights: guestSummary.combined_experience_highlights,
            combined_education_highlights: guestSummary.combined_education_highlights,
            key_skills: guestSummary.key_skills,
            domain_expertise: guestSummary.domain_expertise,
            technical_expertise: guestSummary.technical_expertise,
            value_proposition_summary: guestSummary.value_proposition_summary,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateSummaryError) {
          throw new Error(`Failed to update user summary: ${updateSummaryError.message}`);
        }

        // Delete the guest summary
        const { error: deleteSummaryError } = await supabaseClient
          .from("user_summaries")
          .delete()
          .eq("session_id", sessionId);

        if (deleteSummaryError) {
          console.error(`Warning: Failed to delete guest summary: ${deleteSummaryError.message}`);
          // Continue without failing the request
        }
      } else {
        // Convert guest summary to user summary
        const { error: updateSummaryError } = await supabaseClient
          .from("user_summaries")
          .update({
            user_id: userId,
            session_id: null,
            updated_at: new Date().toISOString()
          })
          .eq("session_id", sessionId);

        if (updateSummaryError) {
          throw new Error(`Failed to convert guest summary: ${updateSummaryError.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Guest profile successfully linked to user account"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error linking guest profile:", error);
    
    return new Response(
      JSON.stringify({
        error: `Error linking profile: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
