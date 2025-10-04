
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

// Interface for company data
interface CompanyData {
  name: string;
  industry?: string;
  hq_location?: string;
  website_url?: string;
  public_private?: string;
  estimated_revenue?: string;
  estimated_headcount?: string;
  wfh_policy?: string;
  ai_description?: string;
  ai_match_reasoning?: string;
  match_quality_score?: number;
  user_priority?: string;
  generated_criteria_highlights?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests TEST
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
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get the user
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
    
    // Check if company already exists for this user
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', companyName)
      .maybeSingle();
    
    if (existingCompany) {
      return new Response(JSON.stringify({ 
        error: 'Company already exists',
        company: existingCompany 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user profile and criteria for context
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    const { data: targetCriteria } = await supabase
      .from('target_criteria')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Fetch company details using Gemini API
    const userBackground = userProfile?.additional_details || '';
    const targetRole = targetCriteria?.free_form_role_and_company_description || '';
    
    const prompt = `Generate detailed information about the company "${companyName}" in JSON format. Include the following fields:
    - industry: the industry this company operates in
    - hq_location: headquarter location of the company
    - website_url: company's website URL
    - public_private: whether the company is public or private
    - estimated_revenue: estimated annual revenue range
    - estimated_headcount: estimated number of employees
    - wfh_policy: work from home policy if known
    - ai_description: a brief 1-2 sentence description of what the company does
    
    Additionally, considering this job seeker background: "${userBackground}" 
    and their target role/companies: "${targetRole}"
    
    Please also generate:
    - ai_match_reasoning: reasons why this company might or might not be a good match for the job seeker
    - match_quality_score: a score from 1-3 indicating match quality (3 is best)
    
    Format the response as valid JSON with only these fields.`;
    
    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
        },
      }),
    });
    
    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return new Response(JSON.stringify({ error: 'Failed to generate company data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract generated JSON from text response
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    let companyData: CompanyData;
    
    try {
      // Extract JSON from the text (find anything between { and })
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        companyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (error) {
      console.error("Error parsing company data:", error);
      return new Response(JSON.stringify({ error: 'Failed to parse generated company data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Set default values if missing
    companyData.name = companyName;
    companyData.user_priority = companyData.match_quality_score === 3 ? 'Top' : 
                                companyData.match_quality_score === 2 ? 'Medium' : 'Maybe';
    
    // Insert the company into the database
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        industry: companyData.industry,
        hq_location: companyData.hq_location,
        website_url: companyData.website_url,
        public_private: companyData.public_private,
        estimated_revenue: companyData.estimated_revenue,
        estimated_headcount: companyData.estimated_headcount,
        wfh_policy: companyData.wfh_policy,
        ai_description: companyData.ai_description,
        ai_match_reasoning: companyData.ai_match_reasoning,
        match_quality_score: companyData.match_quality_score,
        user_priority: companyData.user_priority,
        user_id: user.id,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_blacklisted: false
      })
      .select()
      .single();
    
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ company: newCompany }), {
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
