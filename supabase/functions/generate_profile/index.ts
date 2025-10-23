import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { getAllResponseHeaders } from "../_shared/cors.ts";

// Updated to Gemini 2.5 Flash-Lite for optimized low latency
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Unified response schema for both guest and registered users
const UNIFIED_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    profile: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: "First name only (no middle names or initials)"
        },
        last_name: {
          type: "string",
          description: "Last name only"
        },
        job_role: {
          type: "string",
          description: "Current or most recent job title/role"
        },
        current_company: {
          type: "string",
          description: "Current or most recent company name"
        },
        location: {
          type: "string",
          description: "City, State/Country or current location"
        }
      }
    },
    summary: {
      type: "object",
      properties: {
        expertise: {
          type: "string",
          description: "Key areas of expertise, technical skills, and domain knowledge"
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
      }
    }
  },
  required: ["profile", "summary"]
};

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
  // Get dynamic CORS and security headers based on request origin
  const corsHeaders = getAllResponseHeaders(req);
  
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

    // Parse the request body - supports both guest and registered users
    const { userId, sessionId, userEmail, backgroundInput } = await req.json();

    // Determine if this is a guest or registered user
    const isGuest = !userId && sessionId;
    const identifier = isGuest ? sessionId : userId;

    if (!identifier) {
      return new Response(JSON.stringify({ error: "Missing required field: either userId or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Processing profile data for ${isGuest ? 'guest' : 'registered'} user: ${identifier} (${userEmail || 'Email not provided'})`);

    // Get the Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Determine content source (ONLY difference in input handling)
    let combinedContent;
    if (isGuest) {
      // Guest: use backgroundInput directly
      if (!backgroundInput) {
        return new Response(JSON.stringify({ error: "No background content provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      combinedContent = backgroundInput;
    } else {
      // Registered: fetch from database
    const { data: profileData, error: profileError } = await supabaseClient
      .from("user_profiles")
        .select("background_input")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile data:", profileError);
      if (profileError.code === "PGRST116") {
        // Profile not found - this is not necessarily an error
        console.log("No profile data found for user. Creating default summary.");
        // Create a default summary
        const defaultSummary = {
          expertise: "No expertise data available yet.",
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
        expertise: "Your expertise areas will appear here once you provide more information.",
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
      combinedContent = profileData.background_input;
    }

    console.log(`Combined content length: ${combinedContent.length} characters`);

    console.log("Calling Gemini API to generate profile and summary...");

    // 2. Single API call with unified schema (SAME for both user types)
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

Please analyze the following background information:

${combinedContent}

Focus on creating content that would be valuable for job search networking. Be specific and highlight transferable skills, quantifiable achievements, and unique value propositions. Address the user - use phrases like "You are..." / "You have..."

Generate both structured profile data and a comprehensive summary:

For profile extraction:
- first_name: First name only (no middle names or initials)
- last_name: Last name only
- job_role: Current or most recent job title/role
- current_company: Current or most recent company name
- location: City, State/Country or current location

Rules for profile extraction:
- If information is not clearly available, return null for that field
- For names, extract only clear first and last names (avoid middle names, initials, or titles)
- For job_role, use the most recent or current position mentioned
- For current_company, use the most recent or current company mentioned
- For location, extract the most relevant current location (city and state/country if available)

For summary generation:
- Expertise: Key areas of knowledge and skills
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
          responseSchema: UNIFIED_RESPONSE_SCHEMA
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
    
    // 3. Process response (SAME for both user types)
    let result;
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
      result = JSON.parse(responseText);
      
      // Validate required fields
      const requiredFields = ["profile", "summary"];
      const missingFields = requiredFields.filter(field => !result[field]);
      
      if (missingFields.length > 0) {
        console.warn(`Missing required fields: ${missingFields.join(', ')}`);
        // Fill in missing fields with defaults
        missingFields.forEach(field => {
          if (field === 'profile') {
            result[field] = {
              first_name: null,
              last_name: null,
              job_role: null,
              current_company: null,
              location: null
            };
          } else if (field === 'summary') {
            result[field] = {
              expertise: "Information not available",
              overall_blurb: "Information not available",
              combined_experience_highlights: ["Information not available"],
              combined_education_highlights: ["Information not available"],
              value_proposition_summary: "Information not available"
            };
          }
        });
      }

    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response was:", JSON.stringify(data, null, 2));
      
      // Try to extract partial data from truncated response
      console.log("Attempting to extract partial summary from truncated response");
      const partialResult = extractPartialSummary(responseText);
      
      if (partialResult) {
        console.log("Successfully extracted partial result");
        result = partialResult;
        
        // Ensure all required fields are present
        const requiredFields = ["profile", "summary"];
        const missingFields = requiredFields.filter(field => !result[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Filling missing fields: ${missingFields.join(', ')}`);
          missingFields.forEach(field => {
            if (field === 'profile') {
              result[field] = {
                first_name: null,
                last_name: null,
                job_role: null,
                current_company: null,
                location: null
              };
            } else if (field === 'summary') {
              result[field] = {
                expertise: "Information not available",
                overall_blurb: "Information not available",
                combined_experience_highlights: ["Information not available"],
                combined_education_highlights: ["Information not available"],
                value_proposition_summary: "Information not available"
              };
            }
          });
        }
      } else {
        // Fallback: create a basic result structure
        console.log("Creating fallback result structure");
        result = {
          profile: {
            first_name: null,
            last_name: null,
            job_role: null,
            current_company: null,
            location: null
          },
          summary: {
            expertise: "Areas of expertise not available",
            overall_blurb: "Professional summary not available",
            combined_experience_highlights: ["Experience details not available"],
            combined_education_highlights: ["Education details not available"],
            value_proposition_summary: "Value proposition not available"
          }
        };
      }
    }

    const { profile, summary } = result;

    // 4. Store in appropriate destinations (ONLY difference in output handling)
    if (isGuest) {
      // Store in guest tables
      const storedProfile = await storeGuestData(sessionId, profile, summary, backgroundInput);

    return new Response(JSON.stringify({
      success: true,
        message: "Profile and summary generated successfully!",
        summary: summary,
        extractedProfile: profile,
        profile_id: storedProfile.id
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    } else {
      // Store in user tables - ALWAYS update profile data
      await updateUserProfile(userId, profile, summary);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Profile and summary generated successfully!",
        summary: summary,
        extractedProfile: profile
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

// Type definitions
interface ExtractedProfile {
  first_name: string | null;
  last_name: string | null;
  job_role: string | null;
  current_company: string | null;
  location: string | null;
}

interface ProfileSummary {
  expertise: string;
  overall_blurb: string;
  combined_experience_highlights: string[];
  combined_education_highlights: string[];
  value_proposition_summary: string;
}

// Helper function to update user profile with extracted data
async function updateUserProfile(userId: string, profile: ExtractedProfile, summary: ProfileSummary) {
  // Update user_profiles table with extracted profile data
  const { error: profileError } = await supabaseClient
    .from("user_profiles")
    .update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      job_role: profile.job_role,
      current_company: profile.current_company,
      location: profile.location,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);
    
  if (profileError) {
    console.error("Error updating user profile:", profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  // Update user_summaries table
  await createOrUpdateSummary(userId, summary);
}

// Helper function to store guest data
async function storeGuestData(sessionId: string, profile: ExtractedProfile, summary: ProfileSummary, backgroundInput: string) {
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
      first_name: profile.first_name,
      last_name: profile.last_name,
      job_role: profile.job_role,
      current_company: profile.current_company,
      location: profile.location,
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

  return storedProfile;
}

async function createOrUpdateSummary(userId: string, summary: ProfileSummary) {
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