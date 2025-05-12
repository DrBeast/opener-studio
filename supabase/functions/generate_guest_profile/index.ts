
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
    const { 
      sessionId, 
      linkedinContent, 
      additionalDetails, 
      cvContent 
    } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing guest profile data for session: ${sessionId}`);

    // Clean up old temporary profiles (older than 48 hours)
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 48);
      
      // Delete old temporary profiles
      await supabaseClient
        .from("user_profiles")
        .delete()
        .eq("is_temporary", true)
        .lt("temp_created_at", cutoffTime.toISOString());
        
      // Delete orphaned summaries
      const { data: orphanedSummaries } = await supabaseClient
        .from("user_summaries")
        .select("summary_id, session_id")
        .is("user_id", null)
        .not("session_id", "is", null);
        
      if (orphanedSummaries && orphanedSummaries.length > 0) {
        // Get session IDs that no longer have a corresponding profile
        const sessionIds = orphanedSummaries.map(summary => summary.session_id);
        
        // Check which session IDs don't have profiles
        const { data: existingProfiles } = await supabaseClient
          .from("user_profiles")
          .select("session_id")
          .in("session_id", sessionIds);
          
        const existingSessionIds = new Set(existingProfiles?.map(profile => profile.session_id) || []);
        const orphanedSessionIds = sessionIds.filter(id => !existingSessionIds.has(id));
        
        // Delete summaries with orphaned session IDs
        if (orphanedSessionIds.length > 0) {
          await supabaseClient
            .from("user_summaries")
            .delete()
            .is("user_id", null)
            .in("session_id", orphanedSessionIds);
        }
      }
    } catch (cleanupError) {
      // Log but don't fail the request if cleanup fails
      console.error("Error cleaning up old temporary profiles:", cleanupError);
    }

    // Check if profile with this session ID already exists
    const { data: existingProfile, error: profileCheckError } = await supabaseClient
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();
      
    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      throw new Error(`Error checking for existing profile: ${profileCheckError.message}`);
    }
    
    // Save profile data
    let userProfileId;
    
    if (existingProfile) {
      // Update existing temporary profile
      const { error: updateError } = await supabaseClient
        .from("user_profiles")
        .update({
          linkedin_content: linkedinContent || existingProfile.linkedin_content,
          additional_details: additionalDetails || existingProfile.additional_details,
          cv_content: cvContent || existingProfile.cv_content,
          updated_at: new Date().toISOString()
        })
        .eq("session_id", sessionId);
        
      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      userProfileId = existingProfile.user_id;
    } else {
      // Create new temporary profile
      const { data: newProfile, error: insertError } = await supabaseClient
        .from("user_profiles")
        .insert({
          session_id: sessionId,
          is_temporary: true,
          temp_created_at: new Date().toISOString(),
          linkedin_content: linkedinContent || null,
          additional_details: additionalDetails || null,
          cv_content: cvContent || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }
      
      userProfileId = newProfile.user_id;
    }

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Combine all content into a single text block with labels
    let combinedBackgroundText = '';
    
    if (linkedinContent) {
      combinedBackgroundText += `--- linkedin_profile ---\n${linkedinContent}\n\n`;
    }
    
    if (additionalDetails) {
      combinedBackgroundText += `--- additional_details ---\n${additionalDetails}\n\n`;
    }
    
    if (cvContent) {
      combinedBackgroundText += `--- cv_content ---\n${cvContent}\n\n`;
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
        const { data: existingSummary, error: summaryCheckError } = await supabaseClient
          .from("user_summaries")
          .select("summary_id")
          .eq("session_id", sessionId)
          .maybeSingle();
          
        if (summaryCheckError && summaryCheckError.code !== "PGRST116") {
          throw new Error(`Error checking for existing summary: ${summaryCheckError.message}`);
        }
        
        if (existingSummary) {
          // Update the existing summary
          const { error: updateError } = await supabaseClient
            .from("user_summaries")
            .update({
              experience: generatedSummary.experience,
              education: generatedSummary.education,
              expertise: generatedSummary.expertise,
              achievements: generatedSummary.achievements,
              overall_blurb: generatedSummary.overall_blurb || null,
              combined_experience_highlights: generatedSummary.combined_experience_highlights || null,
              combined_education_highlights: generatedSummary.combined_education_highlights || null,
              key_skills: generatedSummary.key_skills || null,
              domain_expertise: generatedSummary.domain_expertise || null,
              technical_expertise: generatedSummary.technical_expertise || null,
              value_proposition_summary: generatedSummary.value_proposition_summary || null,
              updated_at: new Date().toISOString()
            })
            .eq("session_id", sessionId);
            
          if (updateError) {
            throw new Error(`Error updating summary: ${updateError.message}`);
          }
        } else {
          // Insert a new summary
          const { error: insertError } = await supabaseClient
            .from("user_summaries")
            .insert({
              session_id: sessionId,
              experience: generatedSummary.experience,
              education: generatedSummary.education,
              expertise: generatedSummary.expertise,
              achievements: generatedSummary.achievements,
              overall_blurb: generatedSummary.overall_blurb || null,
              combined_experience_highlights: generatedSummary.combined_experience_highlights || null,
              combined_education_highlights: generatedSummary.combined_education_highlights || null,
              key_skills: generatedSummary.key_skills || null,
              domain_expertise: generatedSummary.domain_expertise || null,
              technical_expertise: generatedSummary.technical_expertise || null,
              value_proposition_summary: generatedSummary.value_proposition_summary || null,
              generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            throw new Error(`Error inserting summary: ${insertError.message}`);
          }
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
      } catch (aiError) {
        console.error("Error processing with AI:", aiError);
        
        return new Response(
          JSON.stringify({
            error: `AI processing failed: ${aiError.message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // If we don't have any content, return an error
      return new Response(
        JSON.stringify({
          error: "No content provided to process",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
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
