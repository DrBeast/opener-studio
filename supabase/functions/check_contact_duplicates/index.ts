import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Missing Authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Invalid token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { first_name, last_name, role, company_id } = await req.json();
    if (!first_name || !last_name) {
      return new Response(JSON.stringify({
        error: 'First name and last name are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // --- REVISED QUERY LOGIC ---
    // First, fetch all existing active contacts for the user.
    // We use a LEFT join (`companies(*)`) which means it will return contacts EVEN IF they don't have a company.
    const { data: existingContacts, error: contactsError } = await supabase.from('contacts').select(`
            contact_id,
            first_name,
            last_name,
            role,
            companies(name) 
        `).eq('user_id', user.id).eq('status', 'active');
    if (contactsError) {
      throw new Error(contactsError.message);
    }
    // If there are no existing contacts, there can be no duplicates.
    if (!existingContacts || existingContacts.length === 0) {
      return new Response(JSON.stringify({
        isDuplicate: false,
        potentialDuplicates: []
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Now, proceed with the Gemini prompt using this complete list.
    const contactList = existingContacts.map((c)=>{
      const companyName = c.companies?.name || 'Unknown Company';
      return `- ${c.first_name} ${c.last_name} at ${companyName} (${c.role || 'Unknown Role'}) (ID: ${c.contact_id})`;
    }).join('\n');
    const newContactInfo = `${first_name} ${last_name} (${role || 'Unknown Role'})`;
    const prompt = `
      You are an AI assistant helping to identify duplicate professional contacts. A user wants to add a new contact: "${newContactInfo}".

      Here is their list of existing contacts:
      ${contactList}

      Analyze if the new contact is a likely duplicate of any existing contacts. Consider:
      - Exact name matches.
      - Nickname variations (e.g., "Mike" for "Michael").
      - The same person who may have changed jobs (different company).

      Respond ONLY with a valid JSON object with the following structure:
      {
        "isDuplicate": boolean,
        "potentialDuplicates": [
          {
            "contact_id": "exact_id_from_list",
            "first_name": "exact_first_name_from_list",
            "last_name": "exact_last_name_from_list", 
            "role": "exact_role_from_list",
            "company_name": "company_name_from_list",
            "confidence": "high|medium",
            "reasoning": "A brief explanation of why this might be a duplicate."
          }
        ]
      }

      RULES:
      - Set "isDuplicate" to true if you find any match with high or medium confidence.
      - Only include duplicates with "high" or "medium" confidence.
      - "High" confidence for exact name matches or obvious nicknames.
      - "Medium" confidence for similar names at different companies.
      - Return an empty array if no likely duplicates are found.
    `;
    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40
        }
      })
    });
    const geminiData = await geminiResponse.json();
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No candidates returned from Gemini');
      // Fallback to simple name check
      const exactMatch = existingContacts.find((c)=>c.first_name.toLowerCase() === first_name.toLowerCase() && c.last_name.toLowerCase() === last_name.toLowerCase());
      return new Response(JSON.stringify({
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [
          {
            contact_id: exactMatch.contact_id,
            first_name: exactMatch.first_name,
            last_name: exactMatch.last_name,
            role: exactMatch.role,
            company_name: Array.isArray(exactMatch.companies) ? exactMatch.companies[0]?.name : exactMatch.companies?.name,
            confidence: 'high',
            reasoning: 'Exact name match'
          }
        ] : []
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Extract and parse the JSON response
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    let result;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (error) {
      console.error("Error parsing Gemini response:", error, "Raw text:", generatedText);
      // Fallback to simple check
      const exactMatch = existingContacts.find((c)=>c.first_name.toLowerCase() === first_name.toLowerCase() && c.last_name.toLowerCase() === last_name.toLowerCase());
      return new Response(JSON.stringify({
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [
          {
            contact_id: exactMatch.contact_id,
            first_name: exactMatch.first_name,
            last_name: exactMatch.last_name,
            role: exactMatch.role,
            company_name: Array.isArray(exactMatch.companies) ? exactMatch.companies[0]?.name : exactMatch.companies?.name,
            confidence: 'high',
            reasoning: 'Exact name match (fallback)'
          }
        ] : []
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate the result structure
    if (typeof result.isDuplicate !== 'boolean') {
      result.isDuplicate = false;
    }
    if (!Array.isArray(result.potentialDuplicates)) {
      result.potentialDuplicates = [];
    }
    // Ensure each potential duplicate has valid contact_id from existing contacts
    result.potentialDuplicates = result.potentialDuplicates.filter((dup)=>existingContacts.some((c)=>c.contact_id === dup.contact_id));
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
