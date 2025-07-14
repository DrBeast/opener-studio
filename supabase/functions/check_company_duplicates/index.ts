import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

interface PotentialDuplicate {
  company_id: string;
  name: string;
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
    const { companyName } = await req.json();
    
    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch all existing companies for this user
    const { data: existingCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('company_id, name, industry, hq_location')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (companiesError) {
      return new Response(JSON.stringify({ error: companiesError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!existingCompanies || existingCompanies.length === 0) {
      return new Response(JSON.stringify({ 
        isDuplicate: false,
        potentialDuplicates: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a list of existing company names for Gemini to analyze
    const companyList = existingCompanies.map(c => `- ${c.name} (ID: ${c.company_id})`).join('\n');

    const prompt = `You are helping to identify duplicate companies. A user wants to add a new company called "${companyName}".

Here are their existing companies:
${companyList}

Analyze if "${companyName}" is likely a duplicate of any existing companies. Consider:
- Company name variations (Microsoft vs Microsoft Corporation vs Microsoft Inc)
- Common abbreviations and legal suffixes
- Different spellings or formatting
- Subsidiary relationships

Respond with a JSON object containing:
{
  "isDuplicate": boolean,
  "potentialDuplicates": [
    {
      "company_id": "exact_id_from_list",
      "name": "exact_name_from_list", 
      "confidence": "high|medium|low",
      "reasoning": "brief explanation why this might be a duplicate"
    }
  ]
}

Rules:
- Only include companies with medium or high confidence
- High confidence: Very likely the same company (e.g., "Microsoft" vs "Microsoft Corporation")
- Medium confidence: Possibly the same company but unclear (e.g., "Apple" vs "Apple Inc" when context is unclear)
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
      const exactMatch = existingCompanies.find(c => 
        c.name.toLowerCase() === companyName.toLowerCase()
      );
      
      return new Response(JSON.stringify({ 
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [{
          company_id: exactMatch.company_id,
          name: exactMatch.name,
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
      const exactMatch = existingCompanies.find(c => 
        c.name.toLowerCase() === companyName.toLowerCase()
      );
      
      return new Response(JSON.stringify({ 
        isDuplicate: !!exactMatch,
        potentialDuplicates: exactMatch ? [{
          company_id: exactMatch.company_id,
          name: exactMatch.name,
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

    // Ensure each potential duplicate has valid company_id from existing companies
    result.potentialDuplicates = result.potentialDuplicates.filter((dup: any) => 
      existingCompanies.some(c => c.company_id === dup.company_id)
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