
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

    // Check if user already has a profile
    const { data: existingUserProfile, error: userProfileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    if (userProfileError && userProfileError.code !== "PGRST116") {
      throw new Error(`Error checking user profile: ${userProfileError.message}`);
    }

    // Handle the case where no guest profile exists
    if (!guestProfile) {
      console.log("No guest profile found with session ID:", sessionId);
      
      // Check if user already has a profile
      if (!existingUserProfile) {
        console.log("No user profile found. Creating a new user profile.");
        
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
      } else {
        console.log("User already has a profile, no need to create a new one");
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
      console.log("Found existing user profile, will merge data from guest profile");
      
      // Update existing user profile with guest data, only if guest data exists
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only merge fields if they exist in the guest profile and are empty in the user profile
      if (guestProfile.linkedin_content && !existingUserProfile.linkedin_content) {
        updateData.linkedin_content = guestProfile.linkedin_content;
      }
      
      if (guestProfile.additional_details && !existingUserProfile.additional_details) {
        updateData.additional_details = guestProfile.additional_details;
      }
      
      if (guestProfile.cv_content && !existingUserProfile.cv_content) {
        updateData.cv_content = guestProfile.cv_content;
      }
      
      if (guestProfile.first_name && !existingUserProfile.first_name) {
        updateData.first_name = guestProfile.first_name;
      }
      
      if (guestProfile.last_name && !existingUserProfile.last_name) {
        updateData.last_name = guestProfile.last_name;
      }
      
      // Only update if there's actual data to update
      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabaseClient
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId);
  
        if (updateError) {
          throw new Error(`Failed to update user profile: ${updateError.message}`);
        }
        
        console.log("Successfully merged guest profile data into existing user profile");
      } else {
        console.log("No new data to merge from guest profile");
      }
      
      // Delete the guest profile after successful merging
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
      
      try {
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
      } catch (conversionError) {
        console.error("Error during profile conversion:", conversionError);
        
        // Fallback: If conversion fails, create a new profile for the user with the guest data
        console.log("Attempting fallback: Creating new user profile with guest data");
        
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
          throw new Error(`Fallback failed - could not create new user profile: ${insertError.message}`);
        }
        
        console.log("Successfully created new user profile from guest data");
        
        // Try to delete the guest profile
        try {
          await supabaseClient
            .from("user_profiles")
            .delete()
            .eq("session_id", sessionId)
            .eq("is_temporary", true);
            
          console.log("Successfully deleted original guest profile after fallback");
        } catch (deleteError) {
          console.error("Warning: Could not delete original guest profile:", deleteError);
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
      throw new Error(`Error checking guest summary: ${guestSummaryError.message}`);
    }

    if (guestSummary) {
      console.log("Found guest summary, checking if user already has a summary");
      
      // Check if user already has a summary
      const { data: userSummary, error: userSummaryError } = await supabaseClient
        .from("user_summaries")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (userSummaryError && userSummaryError.code !== "PGRST116") {
        throw new Error(`Error checking user summary: ${userSummaryError.message}`);
      }

      if (userSummary) {
        console.log("Found existing user summary, will merge only missing data from guest summary");
        
        // Update existing user summary with guest data only if fields are empty
        const summaryUpdateData: any = {
          updated_at: new Date().toISOString()
        };
        
        // Only update fields that are empty in user summary but exist in guest summary
        if (guestSummary.experience && !userSummary.experience) {
          summaryUpdateData.experience = guestSummary.experience;
        }
        
        if (guestSummary.education && !userSummary.education) {
          summaryUpdateData.education = guestSummary.education;
        }
        
        if (guestSummary.expertise && !userSummary.expertise) {
          summaryUpdateData.expertise = guestSummary.expertise;
        }
        
        if (guestSummary.achievements && !userSummary.achievements) {
          summaryUpdateData.achievements = guestSummary.achievements;
        }
        
        if (guestSummary.overall_blurb && !userSummary.overall_blurb) {
          summaryUpdateData.overall_blurb = guestSummary.overall_blurb;
        }
        
        if (guestSummary.combined_experience_highlights && !userSummary.combined_experience_highlights) {
          summaryUpdateData.combined_experience_highlights = guestSummary.combined_experience_highlights;
        }
        
        if (guestSummary.combined_education_highlights && !userSummary.combined_education_highlights) {
          summaryUpdateData.combined_education_highlights = guestSummary.combined_education_highlights;
        }
        
        if (guestSummary.key_skills && !userSummary.key_skills) {
          summaryUpdateData.key_skills = guestSummary.key_skills;
        }
        
        if (guestSummary.domain_expertise && !userSummary.domain_expertise) {
          summaryUpdateData.domain_expertise = guestSummary.domain_expertise;
        }
        
        if (guestSummary.technical_expertise && !userSummary.technical_expertise) {
          summaryUpdateData.technical_expertise = guestSummary.technical_expertise;
        }
        
        if (guestSummary.value_proposition_summary && !userSummary.value_proposition_summary) {
          summaryUpdateData.value_proposition_summary = guestSummary.value_proposition_summary;
        }

        // Only update if there are actual changes
        if (Object.keys(summaryUpdateData).length > 1) {
          const { error: updateSummaryError } = await supabaseClient
            .from("user_summaries")
            .update(summaryUpdateData)
            .eq("user_id", userId);
  
          if (updateSummaryError) {
            throw new Error(`Failed to update user summary: ${updateSummaryError.message}`);
          }
          
          console.log("Successfully merged guest summary data into existing user summary");
        } else {
          console.log("No new summary data to merge");
        }

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
        
        try {
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
        } catch (conversionError) {
          console.error("Error during summary conversion:", conversionError);
          
          // Fallback: If conversion fails, create a new summary for the user with the guest data
          console.log("Attempting fallback: Creating new user summary with guest data");
          
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
            throw new Error(`Fallback failed - could not create new user summary: ${insertSummaryError.message}`);
          }
          
          console.log("Successfully created new user summary from guest data");
          
          // Try to delete the guest summary
          try {
            await supabaseClient
              .from("user_summaries")
              .delete()
              .eq("session_id", sessionId);
              
            console.log("Successfully deleted original guest summary after fallback");
          } catch (deleteError) {
            console.error("Warning: Could not delete original guest summary:", deleteError);
          }
        }
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

    // Create a record in localStorage to track that this session has been linked
    const linkResult = {
      success: true,
      message: "Guest profile successfully linked to user account",
      linkedAt: new Date().toISOString(),
      sessionId,
      userId
    };

    return new Response(
      JSON.stringify(linkResult),
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
