
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

interface ProcessedContact {
  first_name: string;
  last_name: string;
  role?: string;
  location?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  current_company?: string;
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
    const { linkedin_bio } = await req.json();

    if (!linkedin_bio) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing linkedin_bio in request body.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch user's background summary for context
    const userSummaryResponse = await supabaseClient.from('user_summaries').select('*').eq('user_id', user.id).single();
    const userSummary = userSummaryResponse.data;

    const prompt = `
    You are an AI assistant helping a professional process contact information from a LinkedIn profile.
    Below is the user's professional background summary and the LinkedIn bio of a potential contact.

    ${userSummary ? `
    User Background Summary:
    Overall Blurb: ${userSummary.overall_blurb ?? 'N/A'}
    Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
    Key Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
    Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
    Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
    Value Proposition: ${userSummary.value_proposition_summary ?? 'N/A'}
    ` : ''}

    LinkedIn Bio/Profile Content:
    ${linkedin_bio}

    Your task is to process this LinkedIn profile content and extract structured contact information. Please provide the following information in a JSON object:

    {
      "first_name": "First name only (e.g., 'John')",
      "last_name": "Last name only (everything after first name, e.g., 'Smith' or 'Smith Johnson')",
      "role": "The contact's job title/role",
      "current_company": "The company where the contact currently works",
      "location": "The contact's location (if available)",
      "bio_summary": "A brief, 1-2 sentence summary of the contact's background and relevance based on their LinkedIn content",
      "how_i_can_help": "2-3 sentence explanation of how the user can potentially be of help or provide value to this specific contact or their team/company. Use examples from the user's background to provide examples and justification. Aim to show the logical connection between the user's expertise and the contact's needs, eg 'I can see you are working on this problem - I have solved a similar one before, I can help you with that'."
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

      if (typeof processedContact !== 'object' || !processedContact.first_name) {
        throw new Error("AI response is not a valid contact object.");
      }

      // Ensure last_name is set (fallback if empty)
      if (!processedContact.last_name) {
        processedContact.last_name = '';
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
