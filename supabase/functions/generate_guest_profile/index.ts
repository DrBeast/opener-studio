
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Define the Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Create a Supabase client with the Deno runtime
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse the request body - now accepts unified backgroundInput plus legacy fields
    const { 
      sessionId, 
      backgroundInput,
      linkedinContent, 
      cvContent, 
      additionalDetails 
    } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing required field: sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Processing guest profile data for session: ${sessionId}`);

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check if any content is provided
    if (!backgroundInput && !linkedinContent && !cvContent && !additionalDetails) {
      return new Response(JSON.stringify({ error: "No background content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Combine all available content for AI processing
    const combinedContent = [
      backgroundInput && `Background Information: ${backgroundInput}`,
      linkedinContent && `LinkedIn Profile: ${linkedinContent}`,
      additionalDetails && `Additional Details: ${additionalDetails}`,
      cvContent && `CV Content: ${cvContent}`
    ].filter(Boolean).join("\n\n");

    console.log("Step 1: Calling Gemini API to extract structured profile fields...");

    // STEP 1: Extract structured profile fields
    const profileExtractionResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
You are an AI assistant that extracts structured profile information from professional background text.

Please analyze the following profile information and extract the key profile fields:

${combinedContent}

Extract and return the following information in JSON format:

{
  "first_name": "First name only (no middle names or initials)",
  "last_name": "Last name only",
  "job_role": "Current or most recent job title/role",
  "current_company": "Current or most recent company name",
  "location": "City, State/Country or current location"
}

Rules:
- If information is not clearly available, return null for that field
- For names, extract only clear first and last names (avoid middle names, initials, or titles)
- For job_role, use the most recent or current position mentioned
- For current_company, use the most recent or current company mentioned
- For location, extract the most relevant current location (city and state/country if available)
- Return valid JSON only, no additional text or explanations
            `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      })
    });

    if (!profileExtractionResponse.ok) {
      throw new Error(`Gemini API error during profile extraction: ${profileExtractionResponse.status}`);
    }

    console.log("Received profile extraction response from Gemini API");
    const profileData = await profileExtractionResponse.json();
    
    let extractedProfile;
    try {
      const extractedText = profileData.candidates[0].content.parts[0].text;
      extractedProfile = JSON.parse(extractedText);
      console.log("Extracted profile fields:", extractedProfile);
    } catch (parseError) {
      console.error("Error parsing profile extraction response:", parseError);
      // Set default empty profile if parsing fails
      extractedProfile = {
        first_name: null,
        last_name: null,
        job_role: null,
        current_company: null,
        location: null
      };
    }

    // Get existing profile data to preserve background_input
    const { data: existingProfile } = await supabaseClient
      .from("user_profiles")
      .select("background_input")
      .eq("session_id", sessionId)
      .single();

    // Store profile data in user_profiles with session_id and extracted fields
    // Preserve existing background_input if it exists
    const { error: profileError } = await supabaseClient
      .from("user_profiles")
      .upsert({
        session_id: sessionId,
        is_temporary: true,
        temp_created_at: new Date().toISOString(),
        background_input: existingProfile?.background_input || backgroundInput || null,
        linkedin_content: linkedinContent || null,
        cv_content: cvContent || null,
        additional_details: additionalDetails || null,
        first_name: extractedProfile.first_name,
        last_name: extractedProfile.last_name,
        job_role: extractedProfile.job_role,
        current_company: extractedProfile.current_company,
        location: extractedProfile.location,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "session_id"
      });

    if (profileError) {
      console.error("Error storing profile data:", profileError);
      throw new Error(`Failed to store profile data: ${profileError.message}`);
    }

    console.log("Step 2: Calling Gemini API to generate comprehensive summary...");

    // STEP 2: Generate comprehensive summary (existing logic)
    const summaryResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
You are an AI assistant helping professionals create comprehensive profile summaries for job search networking. 

Please analyze the following profile information and generate a structured summary:

${combinedContent}

Generate a comprehensive analysis in the following JSON format:

{
  "experience": "A detailed summary of professional experience, highlighting key roles, responsibilities, and career progression",
  "education": "Summary of educational background, including degrees, certifications, and relevant coursework",
  "expertise": "Key areas of expertise, technical skills, and domain knowledge",
  "achievements": "Notable accomplishments, awards, and quantifiable results",
  "overall_blurb": "A concise 2-3 sentence professional summary that captures the essence of this person's background",
  "combined_experience_highlights": ["Array of 5-7 specific experience highlights as bullet points"],
  "combined_education_highlights": ["Array of 3-5 education highlights as bullet points"],
  "key_skills": ["Array of 10-15 key technical and professional skills"],
  "domain_expertise": ["Array of 5-8 domain/industry expertise areas"],
  "technical_expertise": ["Array of 5-10 specific technical competencies"],
  "value_proposition_summary": "A 2-3 sentence summary of the unique value this person brings to organizations"
}

Focus on creating content that would be valuable for job search networking. Be specific and highlight transferable skills, quantifiable achievements, and unique value propositions. Address the user - use phrases like "You are..." / "You have..."
            `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    });

    if (!summaryResponse.ok) {
      throw new Error(`Gemini API error during summary generation: ${summaryResponse.status}`);
    }

    console.log("Received summary response from Gemini API");
    const summaryData = await summaryResponse.json();
    
    let summary;
    try {
      const generatedText = summaryData.candidates[0].content.parts[0].text;
      summary = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing summary response:", parseError);
      throw new Error("Failed to parse AI summary response");
    }

    // Store the summary in the database with session_id
    const { error: summaryError } = await supabaseClient
      .from("user_summaries")
      .upsert({
        session_id: sessionId,
        ...summary,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "session_id"
      });

    if (summaryError) {
      console.error("Error saving summary:", summaryError);
      throw new Error(`Failed to save summary: ${summaryError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Profile and summary generated successfully!",
      summary: summary,
      extractedProfile: extractedProfile
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in generate_guest_profile function:", error);
    return new Response(JSON.stringify({
      error: "Failed to generate profile summary",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
