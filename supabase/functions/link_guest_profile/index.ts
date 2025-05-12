
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
    const requestBody = await req.json();
    const { userId, sessionId } = requestBody;

    if (!userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[LINK PROFILE] Starting - userId: ${userId}, sessionId: ${sessionId}`);

    // Check if the guest profile exists
    const { data: guestProfile, error: guestProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_temporary", true)
      .maybeSingle();

    if (guestProfileError) {
      console.error(`[LINK PROFILE] Error checking guest profile: ${JSON.stringify(guestProfileError)}`);
      throw new Error(`Error checking guest profile: ${guestProfileError.message}`);
    }

    // Check if user already has a profile
    const { data: existingUserProfile, error: userProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (userProfileError && userProfileError.code !== "PGRST116") {
      console.error(`[LINK PROFILE] Error checking user profile: ${JSON.stringify(userProfileError)}`);
      throw new Error(`Error checking user profile: ${userProfileError.message}`);
    }
    
    console.log(`[LINK PROFILE] Guest profile found: ${!!guestProfile}, User profile found: ${!!existingUserProfile}`);

    // Handle the case where no guest profile exists
    if (!guestProfile) {
      console.log(`[LINK PROFILE] No guest profile found with session ID: ${sessionId}`);
      
      // Check if user already has a profile
      if (!existingUserProfile) {
        console.log("[LINK PROFILE] No user profile found. Creating a new user profile.");
        
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
          console.error(`[LINK PROFILE] Failed to create new user profile: ${JSON.stringify(createError)}`);
          throw new Error(`Failed to create new user profile: ${createError.message}`);
        }
        
        console.log("[LINK PROFILE] Created new user profile successfully");
      } else {
        console.log("[LINK PROFILE] User already has a profile, no need to create a new one");
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No guest profile found. User profile status checked." 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Begin transaction to handle profile linking
    if (existingUserProfile) {
      console.log("[LINK PROFILE] Found existing user profile, will merge data from guest profile");
      
      // Update existing user profile with guest data, only if guest data exists
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only merge fields if they exist in the guest profile and are empty in the user profile
      if (guestProfile.linkedin_content && !existingUserProfile.linkedin_content) {
        updateData.linkedin_content = guestProfile.linkedin_content;
        console.log("[LINK PROFILE] Merging linkedin_content from guest to user profile");
      }
      
      if (guestProfile.additional_details && !existingUserProfile.additional_details) {
        updateData.additional_details = guestProfile.additional_details;
        console.log("[LINK PROFILE] Merging additional_details from guest to user profile");
      }
      
      if (guestProfile.cv_content && !existingUserProfile.cv_content) {
        updateData.cv_content = guestProfile.cv_content;
        console.log("[LINK PROFILE] Merging cv_content from guest to user profile");
      }
      
      if (guestProfile.first_name && !existingUserProfile.first_name) {
        updateData.first_name = guestProfile.first_name;
        console.log("[LINK PROFILE] Merging first_name from guest to user profile");
      }
      
      if (guestProfile.last_name && !existingUserProfile.last_name) {
        updateData.last_name = guestProfile.last_name;
        console.log("[LINK PROFILE] Merging last_name from guest to user profile");
      }
      
      // Only update if there's actual data to update
      if (Object.keys(updateData).length > 1) {
        console.log(`[LINK PROFILE] Updating user profile with data: ${JSON.stringify(updateData)}`);
        const { error: updateError } = await supabaseClient
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId);
  
        if (updateError) {
          console.error(`[LINK PROFILE] Failed to update user profile: ${JSON.stringify(updateError)}`);
          throw new Error(`Failed to update user profile: ${updateError.message}`);
        }
        
        console.log("[LINK PROFILE] Successfully merged guest profile data into existing user profile");
      } else {
        console.log("[LINK PROFILE] No new data to merge from guest profile");
      }
      
      // Delete the guest profile after successful merging
      const { error: deleteError } = await supabaseClient
        .from("user_profiles")
        .delete()
        .eq("session_id", sessionId)
        .eq("is_temporary", true);

      if (deleteError) {
        console.error(`[LINK PROFILE] Warning: Failed to delete guest profile: ${JSON.stringify(deleteError)}`);
      } else {
        console.log("[LINK PROFILE] Successfully deleted guest profile after merging");
      }
    } else {
      console.log("[LINK PROFILE] No existing user profile found, converting guest profile to user profile");
      
      try {
        // Convert the guest profile to a user profile
        console.log(`[LINK PROFILE] Converting guest profile with session_id ${sessionId} to user profile with user_id ${userId}`);
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
          console.error(`[LINK PROFILE] Failed to convert guest profile: ${JSON.stringify(updateError)}`);
          throw new Error(`Failed to convert guest profile: ${updateError.message}`);
        }
        
        console.log("[LINK PROFILE] Successfully converted guest profile to user profile");
      } catch (conversionError) {
        console.error(`[LINK PROFILE] Error during profile conversion: ${conversionError}`);
        
        // Fallback: If conversion fails, create a new profile for the user with the guest data
        console.log("[LINK PROFILE] Attempting fallback: Creating new user profile with guest data");
        
        const newUserProfile = {
          user_id: userId,
          is_temporary: false,
          linkedin_content: guestProfile.linkedin_content,
          additional_details: guestProfile.additional_details,
          cv_content: guestProfile.cv_content,
          first_name: guestProfile.first_name,
          last_name: guestProfile.last_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabaseClient
          .from("user_profiles")
          .insert(newUserProfile);
          
        if (insertError) {
          console.error(`[LINK PROFILE] Fallback failed - could not create new user profile: ${JSON.stringify(insertError)}`);
          throw new Error(`Fallback failed - could not create new user profile: ${insertError.message}`);
        }
        
        console.log("[LINK PROFILE] Successfully created new user profile from guest data");
        
        // Try to delete the guest profile
        try {
          await supabaseClient
            .from("user_profiles")
            .delete()
            .eq("session_id", sessionId)
            .eq("is_temporary", true);
            
          console.log("[LINK PROFILE] Successfully deleted original guest profile after fallback");
        } catch (deleteError) {
          console.error(`[LINK PROFILE] Warning: Could not delete original guest profile: ${deleteError}`);
        }
      }
    }

    // Handle the user summary data
    const { data: guestSummary, error: guestSummaryError } = await supabaseClient
      .from("user_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (guestSummaryError && guestSummaryError.code !== "PGRST116") {
      console.error(`[LINK PROFILE] Error checking guest summary: ${JSON.stringify(guestSummaryError)}`);
      throw new Error(`Error checking guest summary: ${guestSummaryError.message}`);
    }

    if (guestSummary) {
      console.log("[LINK PROFILE] Found guest summary, checking if user already has a summary");
      
      // Check if user already has a summary
      const { data: userSummary, error: userSummaryError } = await supabaseClient
        .from("user_summaries")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (userSummaryError && userSummaryError.code !== "PGRST116") {
        console.error(`[LINK PROFILE] Error checking user summary: ${JSON.stringify(userSummaryError)}`);
        throw new Error(`Error checking user summary: ${userSummaryError.message}`);
      }

      if (userSummary) {
        console.log("[LINK PROFILE] Found existing user summary, will merge only missing data from guest summary");
        
        // Update existing user summary with guest data only if fields are empty
        const summaryUpdateData: any = {
          updated_at: new Date().toISOString()
        };
        
        // Only update fields that are empty in user summary but exist in guest summary
        if (guestSummary.experience && !userSummary.experience) {
          summaryUpdateData.experience = guestSummary.experience;
          console.log("[LINK PROFILE] Merging experience from guest to user summary");
        }
        
        if (guestSummary.education && !userSummary.education) {
          summaryUpdateData.education = guestSummary.education;
          console.log("[LINK PROFILE] Merging education from guest to user summary");
        }
        
        if (guestSummary.expertise && !userSummary.expertise) {
          summaryUpdateData.expertise = guestSummary.expertise;
          console.log("[LINK PROFILE] Merging expertise from guest to user summary");
        }
        
        if (guestSummary.achievements && !userSummary.achievements) {
          summaryUpdateData.achievements = guestSummary.achievements;
          console.log("[LINK PROFILE] Merging achievements from guest to user summary");
        }
        
        if (guestSummary.overall_blurb && !userSummary.overall_blurb) {
          summaryUpdateData.overall_blurb = guestSummary.overall_blurb;
          console.log("[LINK PROFILE] Merging overall_blurb from guest to user summary");
        }
        
        if (guestSummary.combined_experience_highlights && !userSummary.combined_experience_highlights) {
          summaryUpdateData.combined_experience_highlights = guestSummary.combined_experience_highlights;
          console.log("[LINK PROFILE] Merging combined_experience_highlights from guest to user summary");
        }
        
        if (guestSummary.combined_education_highlights && !userSummary.combined_education_highlights) {
          summaryUpdateData.combined_education_highlights = guestSummary.combined_education_highlights;
          console.log("[LINK PROFILE] Merging combined_education_highlights from guest to user summary");
        }
        
        if (guestSummary.key_skills && !userSummary.key_skills) {
          summaryUpdateData.key_skills = guestSummary.key_skills;
          console.log("[LINK PROFILE] Merging key_skills from guest to user summary");
        }
        
        if (guestSummary.domain_expertise && !userSummary.domain_expertise) {
          summaryUpdateData.domain_expertise = guestSummary.domain_expertise;
          console.log("[LINK PROFILE] Merging domain_expertise from guest to user summary");
        }
        
        if (guestSummary.technical_expertise && !userSummary.technical_expertise) {
          summaryUpdateData.technical_expertise = guestSummary.technical_expertise;
          console.log("[LINK PROFILE] Merging technical_expertise from guest to user summary");
        }
        
        if (guestSummary.value_proposition_summary && !userSummary.value_proposition_summary) {
          summaryUpdateData.value_proposition_summary = guestSummary.value_proposition_summary;
          console.log("[LINK PROFILE] Merging value_proposition_summary from guest to user summary");
        }

        // Only update if there are actual changes
        if (Object.keys(summaryUpdateData).length > 1) {
          console.log(`[LINK PROFILE] Updating user summary with data: ${JSON.stringify(summaryUpdateData)}`);
          const { error: updateSummaryError } = await supabaseClient
            .from("user_summaries")
            .update(summaryUpdateData)
            .eq("user_id", userId);
  
          if (updateSummaryError) {
            console.error(`[LINK PROFILE] Failed to update user summary: ${JSON.stringify(updateSummaryError)}`);
            throw new Error(`Failed to update user summary: ${updateSummaryError.message}`);
          }
          
          console.log("[LINK PROFILE] Successfully merged guest summary data into existing user summary");
        } else {
          console.log("[LINK PROFILE] No new summary data to merge");
        }

        // Delete the guest summary
        const { error: deleteSummaryError } = await supabaseClient
          .from("user_summaries")
          .delete()
          .eq("session_id", sessionId);

        if (deleteSummaryError) {
          console.error(`[LINK PROFILE] Warning: Failed to delete guest summary: ${JSON.stringify(deleteSummaryError)}`);
        } else {
          console.log("[LINK PROFILE] Successfully deleted guest summary after merging");
        }
      } else {
        console.log("[LINK PROFILE] No existing user summary found, converting guest summary to user summary");
        
        try {
          // Convert guest summary to user summary
          console.log(`[LINK PROFILE] Converting guest summary with session_id ${sessionId} to user summary with user_id ${userId}`);
          const { error: updateSummaryError } = await supabaseClient
            .from("user_summaries")
            .update({
              user_id: userId,
              session_id: null,
              updated_at: new Date().toISOString()
            })
            .eq("session_id", sessionId);
  
          if (updateSummaryError) {
            console.error(`[LINK PROFILE] Failed to convert guest summary to user summary: ${JSON.stringify(updateSummaryError)}`);
            throw new Error(`Failed to convert guest summary to user summary: ${updateSummaryError.message}`);
          }
          
          console.log("[LINK PROFILE] Successfully converted guest summary to user summary");
        } catch (conversionError) {
          console.error(`[LINK PROFILE] Error during summary conversion: ${conversionError}`);
          
          // Fallback: If conversion fails, create a new summary for the user with the guest data
          console.log("[LINK PROFILE] Attempting fallback: Creating new user summary with guest data");
          
          const newUserSummary = {
            user_id: userId,
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
            updated_at: new Date().toISOString(),
            generated_at: new Date().toISOString()
          };
          
          const { error: insertSummaryError } = await supabaseClient
            .from("user_summaries")
            .insert(newUserSummary);
            
          if (insertSummaryError) {
            console.error(`[LINK PROFILE] Fallback failed - could not create new user summary: ${JSON.stringify(insertSummaryError)}`);
            throw new Error(`Fallback failed - could not create new user summary: ${insertSummaryError.message}`);
          }
          
          console.log("[LINK PROFILE] Successfully created new user summary from guest data");
          
          // Try to delete the guest summary
          try {
            await supabaseClient
              .from("user_summaries")
              .delete()
              .eq("session_id", sessionId);
              
            console.log("[LINK PROFILE] Successfully deleted original guest summary after fallback");
          } catch (deleteError) {
            console.error(`[LINK PROFILE] Warning: Could not delete original guest summary: ${deleteError}`);
          }
        }
      }
    } else {
      console.log("[LINK PROFILE] No guest summary found, checking if we need to generate one for the user");
      
      // Check if user already has a summary
      const { data: existingSummary } = await supabaseClient
        .from("user_summaries")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
        
      if (!existingSummary) {
        console.log("[LINK PROFILE] No summary found for user, will trigger profile generation");
        
        try {
          // Make a call to generate_profile function to create a summary for the user
          const { data: generatedData, error: generateError } = await supabaseClient.functions.invoke("generate_profile", {
            body: {
              userId,
              userEmail: null // We don't have the email here, it's okay
            }
          });
          
          if (generateError) {
            console.error(`[LINK PROFILE] Error generating profile: ${JSON.stringify(generateError)}`);
          } else {
            console.log("[LINK PROFILE] Successfully triggered profile generation for user");
          }
        } catch (genErr) {
          console.error(`[LINK PROFILE] Failed to trigger profile generation: ${genErr}`);
        }
      }
    }

    // Verify profile linking was successful
    const { data: finalProfileCheck } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    console.log(`[LINK PROFILE] Final verification - User profile exists: ${!!finalProfileCheck}`);
    if (finalProfileCheck) {
      console.log(`[LINK PROFILE] Profile data: ${JSON.stringify({
        has_linkedin: !!finalProfileCheck.linkedin_content,
        has_cv: !!finalProfileCheck.cv_content,
        has_details: !!finalProfileCheck.additional_details,
        first_name: finalProfileCheck.first_name,
        last_name: finalProfileCheck.last_name
      })}`);
    }

    // Create a record in localStorage to track that this session has been linked
    const linkResult = {
      success: true,
      message: "Guest profile successfully linked to user account",
      linkedAt: new Date().toISOString(),
      sessionId,
      userId,
      profileExists: !!finalProfileCheck
    };

    console.log(`[LINK PROFILE] Success - Profile linking completed for user ${userId} with session ${sessionId}`);

    return new Response(
      JSON.stringify(linkResult),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[LINK PROFILE] Error linking guest profile: ${error}`);
    
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
