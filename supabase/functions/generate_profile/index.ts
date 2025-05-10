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

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          overall_blurb: "Please add more information to your profile to generate a complete summary.",
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
        overall_blurb: "Add your LinkedIn profile, CV, or additional details to generate a comprehensive summary.",
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

    // Combine all content into a single text block with labels
    let combinedBackgroundText = '';
    
    if (profileContent.linkedinContent) {
      combinedBackgroundText += `--- linkedin_profile ---\n${profileContent.linkedinContent}\n\n`;
    }
    
    if (profileContent.additionalDetails) {
      combinedBackgroundText += `--- additional_details ---\n${profileContent.additionalDetails}\n\n`;
    }
    
    if (profileContent.cvContent) {
      combinedBackgroundText += `--- cv_content ---\n${profileContent.cvContent}\n\n`;
    }

    // If we have data, call the Gemini API
    if (combinedBackgroundText) {
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
            message: "Profile data processed successfully using Gemini AI",
            summary: generatedSummary,
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
        await createOrUpdateSummary(userId, fallbackSummary);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Generated fallback profile summary due to AI processing error",
            summary: fallbackSummary,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // If we don't have any content, return a simple summary
      const emptySummary: GeneratedSummary = {
        experience: "No professional experience information provided yet.",
        education: "No education information provided yet.",
        expertise: "No expertise information provided yet.",
        achievements: "No achievements information provided yet.",
        overall_blurb: "Please add your professional information to generate a complete summary."
      };
      
      // Create or update with empty summary
      await createOrUpdateSummary(userId, emptySummary);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Created empty profile summary placeholder",
          summary: emptySummary,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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

// Helper function to safely parse JSON array or return empty array
function safeParseJsonArray(jsonData: any): string[] {
  if (!jsonData) return [];
  
  try {
    if (typeof jsonData === 'string') {
      const parsed = JSON.parse(jsonData);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    
    if (Array.isArray(jsonData)) {
      return jsonData.map(String);
    }
  } catch (e) {
    console.error("Error parsing JSON array:", e);
  }
  
  return [];
}

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
        overall_blurb: summary.overall_blurb,
        combined_experience_highlights: summary.combined_experience_highlights,
        combined_education_highlights: summary.combined_education_highlights,
        key_skills: summary.key_skills,
        domain_expertise: summary.domain_expertise,
        technical_expertise: summary.technical_expertise,
        value_proposition_summary: summary.value_proposition_summary,
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
        overall_blurb: summary.overall_blurb,
        combined_experience_highlights: summary.combined_experience_highlights,
        combined_education_highlights: summary.combined_education_highlights,
        key_skills: summary.key_skills,
        domain_expertise: summary.domain_expertise,
        technical_expertise: summary.technical_expertise,
        value_proposition_summary: summary.value_proposition_summary,
      });
  }
  
  if (response.error) {
    console.error("Error handling summary record:", response.error);
    throw new Error(`Failed to handle summary record: ${response.error.message}`);
  }
  
  return response;
}
