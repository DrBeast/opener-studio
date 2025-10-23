import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { getAllResponseHeaders } from "../_shared/cors.ts";

// CORS headers are now handled by shared getCorsHeaders function

// Updated to Gemini 2.5 Flash-Lite for optimized low latency
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

// Response schema for structured contact output
const CONTACT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    first_name: {
      type: "string",
      description: "First name only (e.g., 'John')"
    },
    last_name: {
      type: "string",
      description: "Last name only (everything after first name, e.g., 'Smith' or 'Smith Johnson')"
    },
    role: {
      type: "string",
      description: "The contact's job title/role"
    },
    current_company: {
      type: "string",
      description: "The company where the contact currently works"
    },
    location: {
      type: "string",
      description: "The contact's location (if available)"
    },
    bio_summary: {
      type: "string",
      description: "A brief, 1-2 sentence summary of the contact's background and relevance based on their LinkedIn content"
    },
    how_i_can_help: {
      type: "string",
      description: "2-3 sentence explanation of how the user can potentially be of help or provide value to this specific contact or their team/company. Use examples from the user's background to provide examples and justification. Aim to show the logical connection between the user's expertise and the contact's needs. Use 'you can' format, eg 'You can leverage my experience with X to solve Y problem' or 'You can benefit from my expertise in Z area'."
    }
  },
  required: ["first_name", "last_name", "role", "current_company", "location", "bio_summary", "how_i_can_help"]
};

// Type definitions
interface ProcessedContact {
  first_name: string;
  last_name: string;
  role: string;
  current_company: string;
  location: string;
  bio_summary: string;
  how_i_can_help: string;
}

// Helper function to extract partial data from truncated JSON
function extractPartialContact(jsonText: string): ProcessedContact | null {
  try {
    // Try to clean and fix common JSON issues
    let cleanedText = jsonText.trim();
    
    // Remove any markdown formatting
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to fix trailing commas
    cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to close incomplete objects/arrays
    const openBraces = (cleanedText.match(/\{/g) || []).length;
    const closeBraces = (cleanedText.match(/\}/g) || []).length;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      cleanedText += '}';
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Failed to extract partial contact:", error);
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
    const { userId, sessionId, linkedin_bio } = await req.json();

    // Determine if this is a guest or registered user
    const isGuest = !userId && sessionId;
    const identifier = isGuest ? sessionId : userId;

    if (!identifier) {
      return new Response(JSON.stringify({ error: "Missing required field: either userId or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!linkedin_bio) {
      return new Response(JSON.stringify({ error: "Missing required field: linkedin_bio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get the Gemini API Key
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({ error: 'Gemini API key not configured.' }), {
      status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 1. Fetch user summary (ONLY difference in input handling)
    let userSummary;
    if (isGuest) {
      // Guest: fetch from guest_user_summaries
      const { data: guestSummary, error: guestSummaryError } = await supabaseClient
        .from("guest_user_summaries")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (guestSummaryError) {
        console.error("Error fetching guest user summary:", guestSummaryError);
        // Continue without user summary - contact processing can still work
        userSummary = null;
      } else {
        userSummary = guestSummary;
      }
    } else {
      // Registered: fetch from user_summaries
      const { data: userSummaryData, error: userSummaryError } = await supabaseClient
        .from("user_summaries")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (userSummaryError) {
        console.error("Error fetching user summary:", userSummaryError);
        // Continue without user summary - contact processing can still work
        userSummary = null;
      } else {
        userSummary = userSummaryData;
      }
    }

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
    You are an AI assistant helping a professional process contact information from a LinkedIn profile.
    Below is the user's professional background summary and the LinkedIn bio of a potential contact.

    ${userSummary ? `
    User Background Summary:
    Overall Blurb: ${userSummary.overall_blurb ?? 'N/A'}
    Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
Expertise: ${userSummary.expertise ?? 'N/A'}
    Value Proposition: ${userSummary.value_proposition_summary ?? 'N/A'}
    ` : ''}

    LinkedIn Bio/Profile Content:
    ${linkedin_bio}

Your task is to process this LinkedIn profile content and extract structured contact information.

Focus on accuracy and only include information that can be reliably extracted from the provided LinkedIn content.

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
          responseSchema: CONTACT_RESPONSE_SCHEMA
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorBody}`);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    
    // 3. Process response (SAME for both user types)
    let processedContact: ProcessedContact;
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
      
      processedContact = JSON.parse(responseText);
      
      // Validate required fields
      const requiredFields = ["first_name", "last_name", "role", "current_company", "location", "bio_summary", "how_i_can_help"];
      const missingFields = requiredFields.filter(field => !processedContact[field]);
      
      if (missingFields.length > 0) {
        console.warn(`Missing required fields: ${missingFields.join(', ')}`);
        // Fill in missing fields with defaults
        missingFields.forEach(field => {
          if (field === 'last_name') {
            processedContact[field] = '';
          } else {
            processedContact[field] = "Information not available";
          }
        });
      }

    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response was:", JSON.stringify(data, null, 2));
      
      // Try to extract partial data from truncated response
      console.log("Attempting to extract partial contact from truncated response");
      const partialContact = extractPartialContact(responseText);
      
      if (partialContact) {
        console.log("Successfully extracted partial contact");
        processedContact = partialContact;
        
        // Ensure all required fields are present
        const requiredFields = ["first_name", "last_name", "role", "current_company", "location", "bio_summary", "how_i_can_help"];
        const missingFields = requiredFields.filter(field => !processedContact[field]);
        
        if (missingFields.length > 0) {
          console.warn(`Filling missing fields: ${missingFields.join(', ')}`);
          missingFields.forEach(field => {
            if (field === 'last_name') {
              processedContact[field] = '';
            } else {
              processedContact[field] = "Information not available";
            }
          });
        }
      } else {
        // Fallback: create a basic contact structure
        console.log("Creating fallback contact structure");
        processedContact = {
          first_name: "Contact",
          last_name: "",
          role: "Information not available",
          current_company: "Information not available",
          location: "Information not available",
          bio_summary: "Contact information not available",
          how_i_can_help: "Unable to determine how to help this contact"
        };
      }
    }

    // Ensure last_name is set (fallback if empty)
    if (!processedContact.last_name) {
      processedContact.last_name = '';
    }

    // 4. Store in appropriate destinations (ONLY difference in output handling)
    if (isGuest) {
      // Upsert in guest_contacts table to prevent duplicates for the same session
      const { data: storedContact, error: upsertError } = await supabaseClient
        .from('guest_contacts')
        .upsert({
          session_id: sessionId,
          linkedin_bio,
          first_name: processedContact.first_name,
          last_name: processedContact.last_name,
          role: processedContact.role,
          current_company: processedContact.current_company,
          location: processedContact.location,
          bio_summary: processedContact.bio_summary,
          how_i_can_help: processedContact.how_i_can_help,
        }, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting guest contact:', upsertError);
        throw new Error(`Failed to upsert guest contact: ${upsertError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Contact processed successfully!",
        contact: processedContact,
        guest_contact_id: storedContact.id
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      // Registered user: Find or Create/Update logic
      
      // Step 1: Find a potential match
      const { data: matchingContact } = await supabaseClient
        .from('contacts')
        .select('contact_id, companies!inner(name)')
        .eq('user_id', userId)
        .ilike('first_name', processedContact.first_name)
        .ilike('last_name', processedContact.last_name)
        .ilike('companies.name', processedContact.current_company)
        .maybeSingle();

      if (matchingContact) {
        // --- UPDATE PATH ---
        const { data: updatedContact, error: updateError } =
          await supabaseClient
            .from("contacts")
            .update({
            linkedin_bio: linkedin_bio,
            bio_summary: processedContact.bio_summary,
            how_i_can_help: processedContact.how_i_can_help,
            role: processedContact.role,
            location: processedContact.location,
            updated_at: new Date().toISOString(),
          })
          .eq('contact_id', matchingContact.contact_id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update contact: ${updateError.message}`);
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: "Contact details updated from new bio.",
            contact: updatedContact,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // --- CREATE PATH ---
        let companyId = null;
        if (processedContact.current_company) {
          // (This is the find-or-create company logic from our previous step)
          const { data: existingCompany } = await supabaseClient
            .from("companies")
            .select("company_id")
            .eq("user_id", userId)
            .eq("name", processedContact.current_company)
            .maybeSingle();
            if (existingCompany) {
              companyId = existingCompany.company_id;
            } else {
              const { data: newCompany, error: companyError } =
                await supabaseClient
                  .from("companies")
                  .insert({
                    user_id: userId,
                    name: processedContact.current_company,
                    status: "active",
                  })
                  .select("company_id")
                  .single();
              if (companyError) {
                console.error(
                  "[ADD_CONTACT] Error creating company:",
                  companyError
                );
              } else {
                companyId = newCompany.company_id;
                supabaseClient.functions.invoke("enrich_company", {
                  body: {
                    companyId: newCompany.company_id,
                    companyName: processedContact.current_company,
                  },
                });
              }
            }
          }
        
        
        // (This is the insert contact logic from our previous step)
        const { data: storedContact, error: insertError } = await supabaseClient
          .from('contacts')
          .insert({
            user_id: userId,
            company_id: companyId,
            linkedin_bio,
            first_name: processedContact.first_name,
            last_name: processedContact.last_name,
            role: processedContact.role,
            location: processedContact.location,
            bio_summary: processedContact.bio_summary,
            how_i_can_help: processedContact.how_i_can_help,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to store contact: ${insertError.message}`);
        }

      return new Response(JSON.stringify({
          success: true,
          message: "New contact created successfully!",
          contact: storedContact,
      }), {
        status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
      }
    }
  }
 catch (error) {
    console.error("Error in add_contact_by_bio function:", error);
    return new Response(JSON.stringify({
      error: "Failed to process contact bio",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});