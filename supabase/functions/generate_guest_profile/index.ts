
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

    // Store profile data in user_profiles with session_id and is_temporary = true
    const { error: profileError } = await supabaseClient
      .from("user_profiles")
      .upsert({
        session_id: sessionId,
        is_temporary: true,
        temp_created_at: new Date().toISOString(),
        background_input: backgroundInput || null,
        linkedin_content: linkedinContent || null,
        cv_content: cvContent || null,
        additional_details: additionalDetails || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "session_id"
      });

    if (profileError) {
      console.error("Error storing profile data:", profileError);
      throw new Error(`Failed to store profile data: ${profileError.message}`);
    }

    // Combine all available content for AI processing
    const combinedContent = [
      backgroundInput && `Background Information: ${backgroundInput}`,
      linkedinContent && `LinkedIn Profile: ${linkedinContent}`,
      additionalDetails && `Additional Details: ${additionalDetails}`,
      cvContent && `CV Content: ${cvContent}`
    ].filter(Boolean).join("\n\n");

    console.log("Calling Gemini API to generate summary...");

    // Call Gemini API to process the profile
    const response = await fetch(GEMINI_API_URL, {
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    console.log("Received response from Gemini API");
    const data = await response.json();
    
    let summary;
    try {
      const generatedText = data.candidates[0].content.parts[0].text;
      summary = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      throw new Error("Failed to parse AI response");
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
      message: "Profile summary generated successfully!",
      summary: summary
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
