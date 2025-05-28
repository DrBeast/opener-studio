
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader ?? '' },
      },
    }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Authentication failed.',
      error: userError?.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Server configuration error.',
      error: 'Gemini API key not configured.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const { company_name } = await req.json();

    if (!company_name) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing company_name in request body.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch user's target criteria for context
    const { data: targetCriteria } = await supabaseClient
      .from('target_criteria')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const prompt = `
    Generate 4-5 LinkedIn search query suggestions for finding relevant contacts at "${company_name}".
    
    User's target criteria:
    - Target Functions: ${targetCriteria?.target_functions ? JSON.stringify(targetCriteria.target_functions) : 'Any'}
    - Target Role Description: ${targetCriteria?.free_form_role_and_company_description || 'General professional roles'}
    
    Create queries that would help find:
    1. People in the user's target function (1-2 levels above their current/target seniority)
    2. Relevant executives (within 3 levels of user's target seniority)
    3. Potential peers in similar roles/teams
    4. Recruiters or Talent Acquisition professionals
    5. General business managers
    
    Return ONLY a JSON array of strings, like:
    ["Product Manager ${company_name}", "VP Product ${company_name}", "Head of Engineering ${company_name}", "Recruiter ${company_name}", "CEO ${company_name}"]
    
    Make the queries specific and actionable for LinkedIn search.
    `;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    let suggestions: string[];

    try {
      suggestions = data?.candidates?.[0]?.content?.parts?.[0]?.text
        ? JSON.parse(data.candidates[0].content.parts[0].text)
        : data;

      if (!Array.isArray(suggestions)) {
        throw new Error("AI response is not a valid array of suggestions.");
      }

      // Limit to 5 suggestions
      suggestions = suggestions.slice(0, 5);

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback suggestions
      suggestions = [
        `${company_name} hiring manager`,
        `${company_name} recruiter`,
        `${company_name} CEO`,
        `head of product ${company_name}`,
        `director ${company_name}`
      ];
    }

    return new Response(JSON.stringify({
      status: 'success',
      suggestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating LinkedIn queries:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to generate LinkedIn queries.',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
