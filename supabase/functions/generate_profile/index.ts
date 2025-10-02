
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

    // Parse the request body
    const { userId, userEmail } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing required field: userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Processing profile data for user: ${userId} (${userEmail || 'Email not provided'})`);

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
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
        const defaultSummary = {
          experience: "No experience data available yet.",
          education: "No education data available yet.",
          expertise: "No expertise data available yet.",
          achievements: "No achievements data available yet.",
          overall_blurb: "Please add more information to your profile to generate a complete summary."
        };
        
        // Insert default summary
        await createOrUpdateSummary(userId, defaultSummary);
        
        return new Response(JSON.stringify({
          success: true,
          message: "Default profile summary created. Please add more information to your profile.",
          summary: defaultSummary
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`Failed to fetch profile data: ${profileError.message}`);
    }

    // Check if we have any content from any of the fields (including new background_input)
    const hasContent = profileData.background_input || 
                      profileData.linkedin_content || 
                      profileData.additional_details || 
                      profileData.cv_content;

    if (!hasContent) {
      console.log("Profile data found but empty or incomplete");
      // Create a basic summary with what we have
      const basicSummary = {
        experience: "Your professional experience will appear here once you provide more information.",
        education: "Your education details will appear here once you provide more information.",
        expertise: "Your expertise areas will appear here once you provide more information.",
        achievements: "Your key achievements will appear here once you provide more information.",
        overall_blurb: "Add your background information to generate a complete professional summary."
      };
      
      await createOrUpdateSummary(userId, basicSummary);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Basic profile summary created. Add more information to get a detailed summary.",
        summary: basicSummary
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Profile data found:", {
      hasBackgroundInput: !!profileData.background_input,
      hasLinkedinContent: !!profileData.linkedin_content,
      hasAdditionalDetails: !!profileData.additional_details,
      hasCvContent: !!profileData.cv_content
    });

    // Combine all profile data, prioritizing the new background_input field
    const combinedContent = [
      profileData.background_input && `Background Information: ${profileData.background_input}`,
      profileData.linkedin_content && `LinkedIn Profile: ${profileData.linkedin_content}`,
      profileData.additional_details && `Additional Details: ${profileData.additional_details}`,
      profileData.cv_content && `CV Content: ${profileData.cv_content}`
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

    // Store the summary in the database
    await createOrUpdateSummary(userId, summary);

    return new Response(JSON.stringify({
      success: true,
      message: "Profile summary generated successfully!",
      summary: summary
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in generate_profile function:", error);
    return new Response(JSON.stringify({
      error: "Failed to regenerate summary",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function createOrUpdateSummary(userId, summary) {
  const { error } = await supabaseClient
    .from("user_summaries")
    .upsert({
      user_id: userId,
      ...summary,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id"
    });
    
  if (error) {
    console.error("Error saving summary:", error);
    throw new Error(`Failed to save summary: ${error.message}`);
  }
}
