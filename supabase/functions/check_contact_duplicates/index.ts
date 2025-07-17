import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

interface PotentialContactDuplicate {
  contact_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name?: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get the user ID from the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the request body
    const { first_name, last_name, role, company_id } = await req.json();
    
    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'First name and last name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch existing contacts for this user with company information
    const { data: existingContacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        contact_id,
        first_name,
        last_name,
        role,
        email,
        linkedin_url,
        companies(name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (contactsError) {
      return new Response(JSON.stringify({ error: contactsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!existingContacts || existingContacts.length === 0) {
      return new Response(JSON.stringify({ 
        isDuplicate: false,
        potentialDuplicates: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get company name if company_id is provided
    let companyName = '';
    if (company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('company_id', company_id)
        .single();
      companyName = company?.name || '';
    }

    // Create a list of existing contacts for analysis
    const contactList = existingContacts.map(c => {
      const company = Array.isArray(c.companies) ? c.companies[0] : c.companies;
      return `- ${c.first_name} ${c.last_name} at ${company?.name || 'Unknown Company'} (${c.role || 'Unknown Role'}) (ID: ${c.contact_id})`;
    }).join('\n');

    const contactFullName = `${first_name} ${last_name}`;
    const newContactInfo = `${contactFullName} at ${companyName || 'Unknown Company'} (${role || 'Unknown Role'})`;

    const prompt = `You are helping to identify duplicate contacts. A user wants to add a new contact: "${newContactInfo}".

Here are their existing contacts:
${contactList}

Analyze if this new contact is likely a duplicate of any existing contacts. Consider:
- Exact name matches (same first and last name)
- Similar names with minor variations (nicknames, middle names, typos)
- Same person at different companies (job changes)
- Same person with different roles at the same company (promotions)
- Name variations like "Mike" vs "Michael", "Chris" vs "Christopher"

Respond with a JSON object containing:
{
  "isDuplicate": boolean,
  "potentialDuplicates": [
    {
      "contact_id": "exact_id_from_list",
      "first_name": "exact_first_name_from_list",
      "last_name": "exact_last_name_from_list", 
      "role": "exact_role_from_list",
      "company_name": "company_name_from_list",
      "confidence": "high|medium|low",
      "reasoning": "brief explanation why this might be a duplicate"
    }
  ]
}

Rules:
- Only include contacts with medium or high confidence
- High confidence: Very likely the same person (exact name match, or obvious nickname variations)
- Medium confidence: Possibly the same person but unclear (similar names, different companies)
- Low confidence: Unlikely but worth mentioning (don't include these)
- Set isDuplicate to true if ANY potential duplicate has high confidence
- Include up to 3 most likely duplicates, ranked by confidence`;

    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
        },
      }),
    });
    
    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No candidates returned from Gemini');
      // Fallback to simple name check
      const exactMatch = existingContacts.find(c => 
        c.first_name.toLowerCase() === first_name.toLowerCase() && 
        c.last_name.toLowerCase() === last_name.toLowerCase()
      );
      
      return new Response(JSON.stringify({ 
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [{
          contact_id: exactMatch.contact_id,
          first_name: exactMatch.first_name,
          last_name: exactMatch.last_name,
          role: exactMatch.role,
          company_name: Array.isArray(exactMatch.companies) ? exactMatch.companies[0]?.name : exactMatch.companies?.name,
          confidence: 'high',
          reasoning: 'Exact name match'
        }] : []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      const exactMatch = existingContacts.find(c => 
        c.first_name.toLowerCase() === first_name.toLowerCase() && 
        c.last_name.toLowerCase() === last_name.toLowerCase()
      );
      
      return new Response(JSON.stringify({ 
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [{
          contact_id: exactMatch.contact_id,
          first_name: exactMatch.first_name,
          last_name: exactMatch.last_name,
          role: exactMatch.role,
          company_name: Array.isArray(exactMatch.companies) ? exactMatch.companies[0]?.name : exactMatch.companies?.name,
          confidence: 'high',
          reasoning: 'Exact name match (fallback)'
        }] : []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    result.potentialDuplicates = result.potentialDuplicates.filter((dup: any) => 
      existingContacts.some(c => c.contact_id === dup.contact_id)
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});