
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Create a Supabase client with the Deno runtime
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface ProfileData {
  linkedinContent?: string;
  additionalDetails?: string;
  cvContent?: string;
  sessionId: string;
}

// Updated interface to match our data structure
interface GeneratedSummary {
  experience: string;
  education: string;
  expertise: string;
  achievements: string;
  overall_blurb?: string;
  combined_experience_highlights?: string[];
  combined_education_highlights?: string[];
  key_skills?: string[];
  domain_expertise?: string[];
  technical_expertise?: string[];
  value_proposition_summary?: string;
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
    const profileData: ProfileData = await req.json();

    if (!profileData.sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing guest profile data for session: ${profileData.sessionId}`);

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create or update temporary profile
    const profileInsertResult = await createOrUpdateTempProfile(
      profileData.sessionId, 
      profileData.linkedinContent || null, 
      profileData.additionalDetails || null, 
      profileData.cvContent || null
    );
    
    if (profileInsertResult.error) {
      throw new Error(`Error creating temporary profile: ${profileInsertResult.error.message}`);
    }

    // Check if we have any content to process
    const hasContent = !!(profileData.linkedinContent || profileData.additionalDetails || profileData.cvContent);
    
    if (!hasContent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No content provided for processing.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Combine all content into a single text block with labels
    let combinedBackgroundText = '';
    
    if (profileData.linkedinContent) {
      combinedBackgroundText += `--- linkedin_profile ---\n${profileData.linkedinContent}\n\n`;
    }
    
    if (profileData.additionalDetails) {
      combinedBackgroundText += `--- additional_details ---\n${profileData.additionalDetails}\n\n`;
    }
    
    if (profileData.cvContent) {
      combinedBackgroundText += `--- cv_content ---\n${profileData.cvContent}\n\n`;
    }

    // Call the Gemini API
    try {
      console.log("Calling Gemini API to generate summary...");
      
      // Construct the prompt for Gemini API
      const prompt = `
      You are an AI assistant specializing in synthesizing and summarizing professional backgrounds from multiple sources.
      Below is a collection of text describing a user's professional background, potentially including LinkedIn profile text, resume content, additional details, etc. Each section is marked by its source (e.g., "--- linkedin_profile ---").

      Your task is to read this combined text and generate a single, structured JSON object that provides an overall summary and key highlights of the user's professional profile. Synthesize information across all sources.

      The JSON object should have the following structure:
      {
        "overall_blurb": "A concise, 1-2 sentence overall summary of the user's professional profile, highlighting their current status, seniority, and main area of expertise.",
        "experience": "A paragraph summarizing their professional experience.",
        "education": "A paragraph summarizing their education background.",
        "expertise": "A paragraph summarizing their key areas of expertise.",
        "achievements": "A paragraph summarizing their key achievements.",
        "combined_experience_highlights": ["Synthesized bullet points summarizing the most significant roles, companies, and achievements from their entire work history."],
        "combined_education_highlights": ["Synthesized bullet points summarizing degrees, institutions, and relevant academic achievements from all educational entries."],
        "key_skills": ["A synthesized list of the most prominent professional skills mentioned across all sources."],
        "domain_expertise": ["A synthesized list of key industry or domain expertise mentioned."],
        "technical_expertise": ["A synthesized list of key technical skills or areas of expertise mentioned."],
        "value_proposition_summary": "A brief summary of the user's core professional value proposition based on their combined background."
      }

      Ensure the output is valid JSON. Synthesize information across all provided sections. Focus on the most impactful and relevant details for an overall professional summary.

      Combined Background Text:
      --- START ---
      ${combinedBackgroundText}
      --- END ---

      Generate the JSON object:
      `;

      // Make the API call to Gemini
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1, // Lower temperature for consistent synthesis
            responseMimeType: "application/json" // Request JSON output directly
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API error: ${response.status} - ${errorBody}`);
        throw new Error(`Error from Gemini API: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received response from Gemini API");

      // Process the Gemini response to extract the structured data
      let generatedSummary: GeneratedSummary;
      try {
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error("Empty or invalid response from Gemini API");
        }
        
        generatedSummary = JSON.parse(rawText);

        // Basic validation of the structure
        if (typeof generatedSummary !== 'object' || 
            typeof generatedSummary.experience !== 'string' || 
            typeof generatedSummary.education !== 'string' ||
            typeof generatedSummary.expertise !== 'string' ||
            typeof generatedSummary.achievements !== 'string') {
          throw new Error("AI response structure is incomplete or missing required fields");
        }

      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw AI response data:', JSON.stringify(data)); // Log raw data for debugging
        
        // Fallback to simpler summary generation
        generatedSummary = {
          experience: "Generated summary of professional experience based on provided content.",
          education: "Generated summary of education based on provided content.",
          expertise: "Generated summary of expertise and skills based on provided content.",
          achievements: "Generated summary of key achievements based on provided content.",
          overall_blurb: "Professional profile generated from provided background information."
        };
      }

      // Create or update the summary in the user_summaries table
      const summaryResult = await createOrUpdateTempSummary(profileData.sessionId, generatedSummary);
      
      if (summaryResult.error) {
        throw new Error(`Error saving temporary summary: ${summaryResult.error.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Profile data processed successfully using Gemini AI",
          summary: generatedSummary,
          sessionId: profileData.sessionId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (aiError) {
      console.error("Error processing with Gemini AI:", aiError);
      
      // Fallback to simplified summary generation
      const fallbackSummary: GeneratedSummary = {
        experience: "Generated summary of professional experience based on provided content.",
        education: "Generated summary of education based on provided content.",
        expertise: "Generated summary of expertise and skills based on provided content.",
        achievements: "Generated summary of key achievements based on provided content.",
        overall_blurb: "Error generating detailed AI summary. Basic summary provided instead."
      };
      
      // Create or update with fallback summary
      await createOrUpdateTempSummary(profileData.sessionId, fallbackSummary);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Generated fallback profile summary due to AI processing error",
          summary: fallbackSummary,
          sessionId: profileData.sessionId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    
    return new Response(
      JSON.stringify({
        error: `Unexpected error: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Create or update a temporary profile
 */
async function createOrUpdateTempProfile(
  sessionId: string, 
  linkedinContent: string | null, 
  additionalDetails: string | null, 
  cvContent: string | null
) {
  try {
    // Check if a profile with this session ID already exists
    const { data: existingProfile, error: checkError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing profile:", checkError);
      return { error: checkError };
    }
    
    const now = new Date().toISOString();
    
    if (existingProfile) {
      // Update existing temporary profile
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          linkedin_content: linkedinContent,
          additional_details: additionalDetails,
          cv_content: cvContent,
          updated_at: now
        })
        .eq("session_id", sessionId)
        .is("user_id", null);
      
      if (updateError) {
        console.error("Error updating temporary profile:", updateError);
        return { error: updateError };
      }
      
      return { success: true };
    } else {
      // Insert new temporary profile
      const { error: insertError } = await supabaseClient
        .from("user_profiles")
        .insert({
          session_id: sessionId,
          is_temporary: true,
          temp_created_at: now,
          updated_at: now,
          created_at: now,
          linkedin_content: linkedinContent,
          additional_details: additionalDetails,
          cv_content: cvContent
        });
      
      if (insertError) {
        console.error("Error inserting temporary profile:", insertError);
        return { error: insertError };
      }
      
      return { success: true };
    }
  } catch (error: any) {
    console.error("Error in createOrUpdateTempProfile:", error);
    return { error };
  }
}

/**
 * Create or update a temporary summary
 */
async function createOrUpdateTempSummary(sessionId: string, summary: GeneratedSummary) {
  try {
    // Check if a summary with this session ID already exists
    const { data: existingSummary, error: checkError } = await supabaseClient
      .from("user_summaries")
      .select("summary_id")
      .eq("session_id", sessionId)
      .is("user_id", null)
      .maybeSingle();
    
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking for existing summary:", checkError);
      return { error: checkError };
    }
    
    const now = new Date().toISOString();
    
    if (existingSummary) {
      // Update existing temporary summary
      const { error: updateError } = await supabaseClient
        .from("user_summaries")
        .update({
          experience: summary.experience,
          education: summary.education,
          expertise: summary.expertise,
          achievements: summary.achievements,
          overall_blurb: summary.overall_blurb || null,
          combined_experience_highlights: summary.combined_experience_highlights || null,
          combined_education_highlights: summary.combined_education_highlights || null,
          key_skills: summary.key_skills || null,
          domain_expertise: summary.domain_expertise || null,
          technical_expertise: summary.technical_expertise || null,
          value_proposition_summary: summary.value_proposition_summary || null,
          updated_at: now
        })
        .eq("session_id", sessionId)
        .is("user_id", null);
      
      if (updateError) {
        console.error("Error updating temporary summary:", updateError);
        return { error: updateError };
      }
      
      return { success: true };
    } else {
      // Insert new temporary summary
      const { error: insertError } = await supabaseClient
        .from("user_summaries")
        .insert({
          session_id: sessionId,
          user_id: null, // No user attached yet
          experience: summary.experience,
          education: summary.education,
          expertise: summary.expertise,
          achievements: summary.achievements,
          overall_blurb: summary.overall_blurb || null,
          combined_experience_highlights: summary.combined_experience_highlights || null,
          combined_education_highlights: summary.combined_education_highlights || null,
          key_skills: summary.key_skills || null,
          domain_expertise: summary.domain_expertise || null,
          technical_expertise: summary.technical_expertise || null,
          value_proposition_summary: summary.value_proposition_summary || null,
          generated_at: now,
          updated_at: now
        });
      
      if (insertError) {
        console.error("Error inserting temporary summary:", insertError);
        return { error: insertError };
      }
      
      return { success: true };
    }
  } catch (error: any) {
    console.error("Error in createOrUpdateTempSummary:", error);
    return { error };
  }
}
