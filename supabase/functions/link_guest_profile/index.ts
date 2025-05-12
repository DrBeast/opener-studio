
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

    // Check if the guest profile exists
    const { data: guestProfile, error: guestProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_temporary", true)
      .maybeSingle();

    if (guestProfileError) {
      throw new Error(`Error checking guest profile: ${guestProfileError.message}`);
    }

    // Check if guest profile exists
    if (!guestProfile) {
      console.log("No guest profile found, checking if user already has a profile");
      
      // Check if user already has a profile
      const { data: existingUserProfile } = await supabaseClient
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (!existingUserProfile) {
        console.log("No guest profile or user profile found. Creating a new user profile.");
        
        // Create an empty profile for the user
        const { error: createError } = await supabaseClient
          .from("user_profiles")
          .insert({
            user_id: userId,
            is_temporary: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (createError) {
          throw new Error(`Failed to create new user profile: ${createError.message}`);
        }
        
        console.log("Created new user profile successfully");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No guest profile found for the provided session ID. User profile status checked." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if a user profile already exists for this user
    const { data: existingUserProfile, error: userProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (userProfileError && userProfileError.code !== "PGRST116") {
      throw new Error(`Error checking user profile: ${userProfileError.message}`);
    }

    // Begin transaction to handle profile linking
    if (existingUserProfile) {
      console.log("Found existing user profile, will merge data from guest profile");
      
      // Update existing user profile with guest data
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          linkedin_content: guestProfile.linkedin_content || existingUserProfile.linkedin_content,
          additional_details: guestProfile.additional_details || existingUserProfile.additional_details,
          cv_content: guestProfile.cv_content || existingUserProfile.cv_content,
          first_name: guestProfile.first_name || existingUserProfile.first_name,
          last_name: guestProfile.last_name || existingUserProfile.last_name,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }
      
      console.log("Successfully merged guest profile data into existing user profile");
      
      // Delete the guest profile
      const { error: deleteError } = await supabaseClient
        .from("user_profiles")
        .delete()
        .eq("session_id", sessionId)
        .eq("is_temporary", true);

      if (deleteError) {
        console.error(`Warning: Failed to delete guest profile: ${deleteError.message}`);
      } else {
        console.log("Successfully deleted guest profile after merging");
      }
    } else {
      console.log("No existing user profile found, converting guest profile to user profile");
      
      // Convert the guest profile to a user profile
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
      
      console.log("Successfully converted guest profile to user profile");
    }

    // Handle the user summary data
    const { data: guestSummary, error: guestSummaryError } = await supabaseClient
      .from("user_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (guestSummaryError && guestSummaryError.code !== "PGRST116") {
      throw new Error(`Error checking guest summary: ${guestSummaryError.message}`);
    }

    if (guestSummary) {
      console.log("Found guest summary, checking if user already has a summary");
      
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
        console.log("Found existing user summary, will update with guest summary data");
        
        // Update existing user summary with guest data
        const { error: updateSummaryError } = await supabaseClient
          .from("user_summaries")
          .update({
            experience: guestSummary.experience || userSummary.experience,
            education: guestSummary.education || userSummary.education,
            expertise: guestSummary.expertise || userSummary.expertise,
            achievements: guestSummary.achievements || userSummary.achievements,
            overall_blurb: guestSummary.overall_blurb || userSummary.overall_blurb,
            combined_experience_highlights: guestSummary.combined_experience_highlights || userSummary.combined_experience_highlights,
            combined_education_highlights: guestSummary.combined_education_highlights || userSummary.combined_education_highlights,
            key_skills: guestSummary.key_skills || userSummary.key_skills,
            domain_expertise: guestSummary.domain_expertise || userSummary.domain_expertise,
            technical_expertise: guestSummary.technical_expertise || userSummary.technical_expertise,
            value_proposition_summary: guestSummary.value_proposition_summary || userSummary.value_proposition_summary,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId);

        if (updateSummaryError) {
          throw new Error(`Failed to update user summary: ${updateSummaryError.message}`);
        }
        
        console.log("Successfully merged guest summary data into existing user summary");

        // Delete the guest summary
        const { error: deleteSummaryError } = await supabaseClient
          .from("user_summaries")
          .delete()
          .eq("session_id", sessionId);

        if (deleteSummaryError) {
          console.error(`Warning: Failed to delete guest summary: ${deleteSummaryError.message}`);
        } else {
          console.log("Successfully deleted guest summary after merging");
        }
      } else {
        console.log("No existing user summary found, converting guest summary to user summary");
        
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
          throw new Error(`Failed to convert guest summary to user summary: ${updateSummaryError.message}`);
        }
        
        console.log("Successfully converted guest summary to user summary");
      }
    } else {
      console.log("No guest summary found, checking if we need to generate one for the user");
      
      // Check if user already has a summary
      const { data: existingSummary } = await supabaseClient
        .from("user_summaries")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (!existingSummary) {
        console.log("No summary found for user, will trigger profile generation");
        
        try {
          // Make a call to generate_profile function to create a summary for the user
          const { data: generatedData, error: generateError } = await supabaseClient.functions.invoke("generate_profile", {
            body: {
              userId,
              userEmail: null // We don't have the email here, it's okay
            }
          });
          
          if (generateError) {
            console.error("Error generating profile:", generateError);
          } else {
            console.log("Successfully triggered profile generation for user");
          }
        } catch (genErr) {
          console.error("Failed to trigger profile generation:", genErr);
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
