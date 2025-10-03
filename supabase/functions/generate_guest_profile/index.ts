import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Define the Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Create a Supabase client with the Deno runtime
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Parse the request body
    const { sessionId, backgroundInput, linkedinContent, cvContent, additionalDetails } = await req.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: "Missing required field: sessionId"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log(`Processing guest profile data for session: ${sessionId}`);

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({
        error: 'Gemini API key not configured.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Check if any content is provided
    if (!backgroundInput && !linkedinContent && !cvContent && !additionalDetails) {
      return new Response(JSON.stringify({
        error: "No background content provided"
      }), {
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

    console.log("Calling Gemini API to generate profile and summary...");

    // Single API call to generate both profile extraction and summary
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

Please analyze the following profile information and generate both structured profile data and a comprehensive summary:

${combinedContent}

Generate a comprehensive analysis in the following JSON format:

{
  "profile": {
    "first_name": "First name only (no middle names or initials)",
    "last_name": "Last name only",
    "job_role": "Current or most recent job title/role",
    "current_company": "Current or most recent company name",
    "location": "City, State/Country or current location"
  },
  "summary": {
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
}

Rules for profile extraction:
- If information is not clearly available, return null for that field
- For names, extract only clear first and last names (avoid middle names, initials, or titles)
- For job_role, use the most recent or current position mentioned
- For current_company, use the most recent or current company mentioned
- For location, extract the most relevant current location (city and state/country if available)

Focus on creating content that would be valuable for job search networking. Be specific and highlight transferable skills, quantifiable achievements, and unique value propositions. Address the user - use phrases like "You are..." / "You have..."

CRITICAL: Return ONLY the JSON object above, no additional text, explanations, or formatting.
                `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    console.log("Received response from Gemini API");
    const data = await response.json();
    
    let result;
    try {
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log("Raw AI response:", generatedText);
      
      // Clean up the JSON response
      let cleanedText = generatedText.trim();
      
      // Remove any markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find and extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      // Additional cleanup for common JSON issues
      cleanedText = cleanedText
        .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
        .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\r/g, ' ')     // Replace carriage returns with spaces
        .replace(/\t/g, ' ')     // Replace tabs with spaces
        .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
        .trim();
      
      console.log("Cleaned JSON text:", cleanedText);
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw response was:", data.candidates[0].content.parts[0].text);
      throw new Error("Failed to parse AI response");
    }

    // Extract profile and summary from the result
    const extractedProfile = result.profile || {
      first_name: null,
      last_name: null,
      job_role: null,
      current_company: null,
      location: null
    };

    const summary = result.summary || {
      experience: "Professional experience details not available",
      education: "Educational background not available", 
      expertise: "Areas of expertise not available",
      achievements: "Notable achievements not available",
      overall_blurb: "Professional summary not available",
      combined_experience_highlights: ["Experience details not available"],
      combined_education_highlights: ["Education details not available"],
      key_skills: ["Skills not available"],
      domain_expertise: ["Domain expertise not available"],
      technical_expertise: ["Technical expertise not available"],
      value_proposition_summary: "Value proposition not available"
    };

    console.log("Extracted profile fields:", extractedProfile);
    console.log("Generated summary:", summary);

    // Get existing profile data to preserve background_input
    const { data: existingProfile } = await supabaseClient
      .from("guest_user_profiles")
      .select("background_input")
      .eq("session_id", sessionId)
      .single();

    // Store profile data in guest_user_profiles table
    const { data: storedProfile, error: profileError } = await supabaseClient
      .from("guest_user_profiles")
      .upsert({
        session_id: sessionId,
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
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error storing profile data:", profileError);
      throw new Error(`Failed to store profile data: ${profileError.message || 'Unknown error'}`);
    }

    console.log("Stored profile with ID:", storedProfile?.id);

    // Store the summary in the guest_user_summaries table
    const { error: summaryError } = await supabaseClient
      .from("guest_user_summaries")
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

    console.log(`Successfully generated profile and summary for session: ${sessionId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Profile and summary generated successfully!",
      summary: summary,
      extractedProfile: extractedProfile,
      profile_id: storedProfile.id
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Error in generate_guest_profile function:", error);
    return new Response(JSON.stringify({
      error: "Failed to generate profile summary",
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});