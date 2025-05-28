
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

interface ProcessedContact {
  name: string;
  role?: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  bio_summary?: string;
  how_i_can_help?: string;
}

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
    const { company_id, linkedin_bio } = await req.json();

    if (!company_id || !linkedin_bio) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing company_id or linkedin_bio in request body.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch user's background summary and target criteria for context
    const [userSummaryResponse, targetCriteriaResponse, companyResponse] = await Promise.all([
      supabaseClient.from('user_summaries').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('target_criteria').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('companies').select('*').eq('company_id', company_id).eq('user_id', user.id).single()
    ]);

    const userSummary = userSummaryResponse.data;
    const targetCriteria = targetCriteriaResponse.data;
    const companyData = companyResponse.data;

    if (!userSummary || !targetCriteria || !companyData) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required user data (summary, criteria, or company).',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const prompt = `
    You are an AI assistant helping a professional process contact information from a LinkedIn profile.
    Below is the user's professional background summary, their job target criteria, details about the target company, and the LinkedIn bio of a potential contact.

    User Background Summary:
    Overall Blurb: ${userSummary.overall_blurb ?? 'N/A'}
    Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
    Key Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
    Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
    Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
    Value Proposition: ${userSummary.value_proposition_summary ?? 'N/A'}

    User Job Target Criteria:
    Target Functions: ${targetCriteria.target_functions ? JSON.stringify(targetCriteria.target_functions) : 'Any'}
    Target Role Description: ${targetCriteria.free_form_role_and_company_description ?? 'None provided'}
    Target Industries: ${targetCriteria.target_industries ? JSON.stringify(targetCriteria.target_industries) : 'Any'}

    Target Company Details:
    Company Name: ${companyData.name}
    Company Description: ${companyData.ai_description ?? 'N/A'}
    Industry: ${companyData.industry ?? 'N/A'}

    LinkedIn Bio/Profile Content:
    ${linkedin_bio}

    Your task is to process this LinkedIn profile content and extract structured contact information. Please provide the following information in a JSON object:

    {
      "name": "Full Name of the contact",
      "role": "The contact's job title/role at the company",
      "location": "The contact's location (if available)",
      "linkedin_url": "LinkedIn URL if found (may not be present in bio text)",
      "email": "Public email address if found (very unlikely). Do NOT guess or generate email addresses.",
      "bio_summary": "A brief, 1-2 sentence summary of the contact's background and relevance based on their LinkedIn content",
      "how_i_can_help": "A brief, 1-2 sentence explanation of how the user (referring to their background and skills) can potentially be of help or provide value to this specific contact or their team/company"
    }

    Ensure the output is a valid JSON object. Focus on accuracy and only include information that can be reliably extracted from the provided LinkedIn content.
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
    let processedContact: ProcessedContact;

    try {
      processedContact = data?.candidates?.[0]?.content?.parts?.[0]?.text
        ? JSON.parse(data.candidates[0].content.parts[0].text)
        : data;

      if (typeof processedContact !== 'object' || !processedContact.name) {
        throw new Error("AI response is not a valid contact object.");
      }

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to process LinkedIn bio content.',
        error: parseError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      status: 'success',
      contact: processedContact
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing contact bio:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to process contact bio.',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
