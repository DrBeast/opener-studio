
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
  cvStorageUrl?: string;
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
    const { userId, backgroundIds } = await req.json();

    if (!userId || !backgroundIds || !Array.isArray(backgroundIds) || backgroundIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and backgroundIds array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing profile data for user: ${userId}`);
    console.log(`Background IDs to process: ${backgroundIds.join(", ")}`);

    // Fetch the user backgrounds based on provided IDs
    const { data: backgrounds, error: fetchError } = await supabaseClient
      .from("user_backgrounds")
      .select("*")
      .eq("user_id", userId)
      .in("background_id", backgroundIds);

    if (fetchError) {
      console.error("Error fetching backgrounds:", fetchError);
      throw new Error(`Failed to fetch backgrounds: ${fetchError.message}`);
    }

    if (!backgrounds || backgrounds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No background data found for the provided IDs" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Organize the background data
    const profileData: ProfileData = {};
    backgrounds.forEach((bg) => {
      if (bg.content_type === "linkedin_profile") {
        profileData.linkedinContent = bg.content;
      } else if (bg.content_type === "additional_details") {
        profileData.additionalDetails = bg.content;
      } else if (bg.content_type === "cv_upload" && bg.storage_url) {
        profileData.cvStorageUrl = bg.storage_url;
      }
    });

    console.log("Collected profile data:", Object.keys(profileData));

    // For now, since we don't have Gemini API integration yet, we'll generate a simple summary
    // In the future, this will use the Gemini API to analyze and summarize the data
    const generatedSummary: GeneratedSummary = {
      experience: "Generated summary of professional experience based on provided content.",
      education: "Generated summary of education based on provided content.",
      expertise: "Generated summary of expertise and skills based on provided content.",
      achievements: "Generated summary of key achievements based on provided content.",
    };

    // Store the generated summary in the user_backgrounds table
    const { error: insertError } = await supabaseClient
      .from("user_backgrounds")
      .insert({
        user_id: userId,
        content_type: "generated_summary",
        content: JSON.stringify(generatedSummary),
        processed_data: generatedSummary,
        processed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error storing generated summary:", insertError);
      throw new Error(`Failed to store generated summary: ${insertError.message}`);
    }

    // Update the processed status for all input backgrounds
    for (const bgId of backgroundIds) {
      await supabaseClient
        .from("user_backgrounds")
        .update({
          processed_at: new Date().toISOString(),
          processed_data: {
            status: "processed",
            included_in_summary: true,
          },
        })
        .eq("background_id", bgId);
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
