import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Updated to Gemini 2.5 Flash-Lite for optimized low latency
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Response schema for structured output (simplified to reduce token usage)
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    experience: {
      type: "string",
      description: "A detailed summary of professional experience, highlighting key roles, responsibilities, and career progression"
    },
    education: {
      type: "string", 
      description: "Summary of educational background, including degrees, certifications, and relevant coursework"
    },
    expertise: {
      type: "string",
      description: "Key areas of expertise, technical skills, and domain knowledge"
    },
    achievements: {
      type: "string",
      description: "Notable accomplishments, awards, and quantifiable results"
    },
    overall_blurb: {
      type: "string",
      description: "A concise 2-3 sentence professional summary that captures the essence of this person's background"
    },
    combined_experience_highlights: {
      type: "array",
      items: { type: "string" },
      description: "Array of 5-7 specific experience highlights as bullet points"
    },
    combined_education_highlights: {
      type: "array", 
      items: { type: "string" },
      description: "Array of 3-5 education highlights as bullet points"
    },
    value_proposition_summary: {
      type: "string",
      description: "A 2-3 sentence summary of the unique value this person brings to organizations"
    }
  },
  required: ["experience", "education", "expertise", "achievements", "overall_blurb", "combined_experience_highlights", "combined_education_highlights", "value_proposition_summary"]
};

// Helper function to truncate text to approximate token limit
function truncateToTokenLimit(text: string, maxTokens: number = 3000): string {
  // Rough approximation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return text;
  }
  
  // Truncate and add ellipsis
  const truncated = text.substring(0, maxChars - 100);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1) + "\n\n[Content truncated for processing...]";
  }
  
  return truncated + "\n\n[Content truncated for processing...]";
}

// Helper function to extract partial data from truncated JSON
function extractPartialSummary(jsonText: string): Record<string, unknown> | null {
  try {
    // Try to clean and fix common JSON issues
    let cleanedText = jsonText.trim();
    
    // Remove any markdown formatting
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to fix incomplete arrays by finding the last complete item
    const arrayFields = ['combined_experience_highlights', 'combined_education_highlights'];
    
    for (const field of arrayFields) {
      const fieldPattern = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*?)(?:,\\s*"[^"]*"\\s*)*$`, 's');
      const match = cleanedText.match(fieldPattern);
      
      if (match) {
        // Find the last complete string in the array
        const arrayContent = match[1];
        const strings = arrayContent.match(/"([^"]*)"/g);
        
        if (strings && strings.length > 0) {
          // Remove the incomplete part and close the array
          const lastCompleteIndex = cleanedText.lastIndexOf(strings[strings.length - 1]) + strings[strings.length - 1].length;
          cleanedText = cleanedText.substring(0, lastCompleteIndex) + '"]';
        }
      }
    }
    
    // Try to close any incomplete objects and add missing fields
    if (cleanedText.includes('"Data Analysis",') || cleanedText.includes('"key_skills"')) {
      // Remove any incomplete key_skills array since we're not generating it anymore
      cleanedText = cleanedText.replace(/"key_skills"\s*:\s*\[[^\]]*$/, '');
      
      // Add missing fields with defaults
      const missingFields = [
        'key_skills": ["Skills not generated"]',
        'domain_expertise": ["Domain expertise not generated"]',
        'technical_expertise": ["Technical expertise not generated"]',
        'value_proposition_summary": "Experienced professional with proven track record and expertise in their field."'
      ];
      
      cleanedText = cleanedText.replace(/}$/, `,\n  ${missingFields.join(',\n  ')}\n}`);
    }
    
    // Try to fix trailing commas
    cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to close incomplete objects/arrays
    const openBraces = (cleanedText.match(/\{/g) || []).length;
    const closeBraces = (cleanedText.match(/\}/g) || []).length;
    const openBrackets = (cleanedText.match(/\[/g) || []).length;
    const closeBrackets = (cleanedText.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      cleanedText += ']';
    }
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      cleanedText += '}';
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to extract partial summary:", error);
    return null;
  }
}

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

    // Check if we have background_input content
    if (!profileData.background_input) {
      console.log("Profile data found but background_input is empty");
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

    console.log("Profile data found with background_input content");

    // Use only background_input, truncate to prevent token limit issues
    const combinedContent = truncateToTokenLimit(profileData.background_input, 2500);

    console.log(`Combined content length: ${combinedContent.length} characters`);

    console.log("Calling Gemini API to generate summary...");

    // Call Gemini API to process the profile with structured output
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

Please analyze the following background information and generate a structured summary:

${combinedContent}

Focus on creating content that would be valuable for job search networking. Be specific and highlight transferable skills, quantifiable achievements, and unique value propositions. Address the user - use phrases like "You are..." / "You have..."

Generate a concise but comprehensive summary with the following structure:
- Experience: Detailed professional background
- Education: Academic credentials and certifications  
- Expertise: Key areas of knowledge and skills
- Achievements: Notable accomplishments and results
- Overall blurb: 2-3 sentence professional summary
- Experience highlights: 5-7 key career achievements as bullet points
- Education highlights: 3-5 academic credentials as bullet points
- Value proposition: 2-3 sentence summary of unique value

CRITICAL: Return ONLY the JSON object matching the required schema, no additional text, explanations, or formatting.
                `
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorBody}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    console.log("Received response from Gemini API");
    const data = await response.json();
    
    // Process the structured response with improved error handling
    let summary;
    let responseText = '';
    
    try {
      const candidate = data?.candidates?.[0];
      
      if (candidate?.finishReason === 'MAX_TOKENS') {
        console.warn("Response was truncated due to token limit. This may indicate very large input content.");
        // Don't throw error, try to parse what we have
      }
      
      responseText = candidate?.content?.parts?.[0]?.text || '';
      if (!responseText) {
        throw new Error(`No response text from AI. Finish reason: ${candidate?.finishReason || 'unknown'}`);
      }
      
      console.log("Raw AI response:", responseText);
      summary = JSON.parse(responseText);
      
      // Validate required fields (simplified schema)
      const requiredFields = ["experience", "education", "expertise", "achievements", "overall_blurb", "combined_experience_highlights", "combined_education_highlights", "value_proposition_summary"];
      const missingFields = requiredFields.filter(field => !summary[field]);
      
      if (missingFields.length > 0) {
        console.warn(`Missing required fields: ${missingFields.join(', ')}`);
        // Fill in missing fields with defaults
        missingFields.forEach(field => {
          if (field.includes('highlights')) {
            summary[field] = ["Information not available"];
          } else {
            summary[field] = "Information not available";
          }
        });
      }
      
      // Add default values for removed fields (for UI compatibility)
      summary.key_skills = ["Skills not generated"];
      summary.domain_expertise = ["Domain expertise not generated"];
      summary.technical_expertise = ["Technical expertise not generated"];

    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response was:", JSON.stringify(data, null, 2));
      
      // Try to extract partial data from truncated response
      console.log("Attempting to extract partial summary from truncated response");
      const partialSummary = extractPartialSummary(responseText);
      
      if (partialSummary) {
        console.log("Successfully extracted partial summary");
        summary = partialSummary;
        
        // Ensure all required fields are present (simplified schema)
        const requiredFields = ["experience", "education", "expertise", "achievements", "overall_blurb", "combined_experience_highlights", "combined_education_highlights", "value_proposition_summary"];
        const missingFields = requiredFields.filter(field => !summary[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Filling missing fields: ${missingFields.join(', ')}`);
          missingFields.forEach(field => {
            if (field.includes('highlights')) {
              summary[field] = ["Information not available"];
            } else {
              summary[field] = "Information not available";
            }
          });
        }
        
        // Add default values for removed fields (for UI compatibility)
        summary.key_skills = ["Skills not generated"];
        summary.domain_expertise = ["Domain expertise not generated"];
        summary.technical_expertise = ["Technical expertise not generated"];
      } else {
        // Fallback: create a basic summary structure
        console.log("Creating fallback summary structure");
        summary = {
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
      }
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