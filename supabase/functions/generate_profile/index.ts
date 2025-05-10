
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

interface ProfileData {
  linkedinContent?: string;
  additionalDetails?: string;
  cvContent?: string;
}

interface GeneratedSummary {
  experience: string;
  education: string;
  expertise: string;
  achievements: string;
}

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
    const { userId, userEmail } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing profile data for user: ${userId} (${userEmail || 'Email not provided'})`);

    // Fetch user profile data
    const { data: profileData, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile data:", profileError);
      
      if (profileError.code === "PGRST116") {
        // Profile not found - this is not necessarily an error
        console.log("No profile data found for user. Creating default summary.");
        
        // Create a default summary
        const defaultSummary: GeneratedSummary = {
          experience: "No experience data available yet.",
          education: "No education data available yet.",
          expertise: "No expertise data available yet.",
          achievements: "No achievements data available yet.",
        };
        
        // Insert default summary
        await createOrUpdateSummary(userId, defaultSummary);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Default profile summary created. Please add more information to your profile.",
            summary: defaultSummary,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`Failed to fetch profile data: ${profileError.message}`);
    }

    if (!profileData || (!profileData.linkedin_content && !profileData.additional_details && !profileData.cv_content)) {
      console.log("Profile data found but empty or incomplete");
      
      // Create a basic summary with what we have
      const basicSummary: GeneratedSummary = {
        experience: "Your professional experience will appear here once you provide more information.",
        education: "Your education details will appear here once you provide more information.",
        expertise: "Your expertise areas will appear here once you provide more information.",
        achievements: "Your key achievements will appear here once you provide more information.",
      };
      
      // Insert basic summary
      await createOrUpdateSummary(userId, basicSummary);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Basic profile summary created. Please add more information to your profile.",
          summary: basicSummary,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Profile data found:", {
      hasLinkedinContent: !!profileData.linkedin_content,
      hasAdditionalDetails: !!profileData.additional_details,
      hasCvContent: !!profileData.cv_content
    });

    // Organize the profile data
    const profileContent: ProfileData = {
      linkedinContent: profileData.linkedin_content,
      additionalDetails: profileData.additional_details,
      cvContent: profileData.cv_content
    };

    // For now, since we don't have Gemini API integration yet, we'll generate a simple summary
    // In the future, this will use the Gemini API to analyze and summarize the data
    const generatedSummary: GeneratedSummary = {
      experience: "Generated summary of professional experience based on provided content.",
      education: "Generated summary of education based on provided content.",
      expertise: "Generated summary of expertise and skills based on provided content.",
      achievements: "Generated summary of key achievements based on provided content.",
    };

    // Create or update the summary in the user_summaries table
    await createOrUpdateSummary(userId, generatedSummary);
    
    // Update the processed status for the user profile
    const { error: updateError } = await supabaseClient
      .from("user_profiles")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
      
    if (updateError) {
      console.error(`Error updating user profile:`, updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile data processed successfully",
        summary: generatedSummary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing profile data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process profile data",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to create or update a user summary
async function createOrUpdateSummary(userId: string, summary: GeneratedSummary) {
  // Check if a summary already exists
  const { data: existingSummary, error: checkError } = await supabaseClient
    .from("user_summaries")
    .select("summary_id")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (checkError) {
    console.error("Error checking for existing summary:", checkError);
    throw new Error(`Failed to check for existing summary: ${checkError.message}`);
  }
  
  let response;
  
  if (existingSummary) {
    console.log(`Updating existing summary for user: ${userId}`);
    response = await supabaseClient
      .from("user_summaries")
      .update({
        experience: summary.experience,
        education: summary.education,
        expertise: summary.expertise,
        achievements: summary.achievements,
        updated_at: new Date().toISOString(),
      })
      .eq("summary_id", existingSummary.summary_id)
      .eq("user_id", userId); // Extra security check
  } else {
    console.log(`Creating new summary for user: ${userId}`);
    response = await supabaseClient
      .from("user_summaries")
      .insert({
        user_id: userId,
        experience: summary.experience,
        education: summary.education,
        expertise: summary.expertise,
        achievements: summary.achievements,
      });
  }
  
  if (response.error) {
    console.error("Error handling summary record:", response.error);
    throw new Error(`Failed to handle summary record: ${response.error.message}`);
  }
  
  return response;
}
