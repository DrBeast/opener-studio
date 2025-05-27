
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

interface GeneratedMessageOutput {
  messages: {
    version1: string;
    version2: string;
    version3: string;
  };
  ai_reasoning: string;
}

const MAX_MESSAGE_LENGTH: { [key: string]: number } = {
  'LinkedIn connection note': 300,
  'LinkedIn message to 1st connection': 400,
  'LinkedIn InMail': 400,
  'Cold email': 500,
  'Forwardable intro': 1000,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
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
    console.error('Authentication failed:', userError?.message);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Authentication failed.',
      error: userError?.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 401,
    });
  }

  const userId = user.id;
  const { contact_id, medium, objective, additional_context } = await req.json();

  if (!contact_id || !medium || !objective) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Missing required parameters.',
      error: 'contact_id, medium, and objective are required.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400,
    });
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    console.error('Gemini API key not set in Supabase secrets.');
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Server configuration error.',
      error: 'Gemini API key not configured.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }

  // 1. Fetch user's overall processed background summary
  const { data: userSummaryData, error: fetchSummaryError } = await supabaseClient
    .from('user_summaries')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchSummaryError || !userSummaryData) {
    console.error('Error fetching user summary:', fetchSummaryError?.message || 'Summary not found.');
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to fetch user background summary.',
      error: fetchSummaryError?.message || 'User summary data missing.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }

  const userSummary = userSummaryData;

  // 2. Fetch target contact details
  const { data: contactData, error: fetchContactError } = await supabaseClient
    .from('contacts')
    .select('*, companies(*)')
    .eq('contact_id', contact_id)
    .eq('user_id', userId)
    .single();

  if (fetchContactError || !contactData) {
    console.error(`Error fetching contact data for ID ${contact_id}:`, fetchContactError?.message || 'Contact not found.');
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to fetch contact details.',
      error: fetchContactError?.message || `Contact with ID ${contact_id} not found for this user.`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }

  const companyData = contactData.companies;
  const maxLength = MAX_MESSAGE_LENGTH[medium] || 500;

  // 3. Enhanced prompt for value-focused messaging
  const prompt = `
  You are an AI assistant helping a professional craft an authentic, value-driven outreach message for job search networking.

  Your goal is to help the user articulate their value proposition in a way that feels genuine and mutually beneficial, focusing on how they can contribute rather than what they need. The message should position the user as someone who brings value and authentic interest, avoiding any "sales-y" feeling.

  User Background Summary:
  Overall Professional Summary: ${userSummary.overall_blurb ?? 'N/A'}
  Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
  Education Highlights: ${userSummary.combined_education_highlights ? JSON.stringify(userSummary.combined_education_highlights) : 'N/A'}
  Key Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
  Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
  Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
  Value Proposition: ${userSummary.value_proposition_summary ?? 'N/A'}

  Target Contact Details:
  Name: ${contactData.full_name ?? contactData.first_name + ' ' + contactData.last_name}
  Role: ${contactData.role ?? 'N/A'}
  Bio Summary: ${contactData.bio_summary ?? 'N/A'}
  How User Can Help: ${contactData.how_i_can_help ?? 'Not specified'}

  Target Company Details:
  Company Name: ${companyData?.name ?? 'N/A'}
  Company Description: ${companyData?.ai_description ?? 'N/A'}
  Industry: ${companyData?.industry ?? 'N/A'}

  Communication Medium: ${medium}
  Maximum Length: ${maxLength} characters
  Message Objective: ${objective}
  Additional Context: ${additional_context ?? 'None provided'}

  IMPORTANT INSTRUCTIONS:

  1. Generate 3 distinct message versions that highlight different aspects of the user's background and value proposition
  2. Focus on authentic value creation and genuine interest rather than asking for favors
  3. Position the user as someone who can contribute to the contact's work and company goals
  4. Use language that demonstrates understanding of the industry and role
  5. Avoid overly formal or sales-oriented language
  6. Make each version feel personal and thoughtful

  For the AI reasoning, explain your approach using "you" language directed at the user:
  - "Your experience in [X] positions you as..."
  - "Your background shows..."
  - "You are demonstrating value by..."
  - "This approach works because you are..."

  Explain how each message positions the user authentically and why this approach will resonate positively with the contact emotionally and professionally.

  Generate the output as a JSON object with 'messages' (containing version1, version2, version3) and 'ai_reasoning' (explaining your approach in "you" language):

  {
    "messages": {
      "version1": "...",
      "version2": "...",
      "version3": "..."
    },
    "ai_reasoning": "Your experience positions you... [explanation using 'you' language]"
  }
  `;

  // 4. Make the call to the Gemini API
  try {
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
           maxOutputTokens: Math.round(maxLength * 2),
           responseMimeType: "application/json"
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorBody}`);
       return new Response(JSON.stringify({
         status: 'error',
         message: `Error from AI service: ${response.statusText}`,
         error: errorBody
       }), {
         headers: {
           ...corsHeaders,
           'Content-Type': 'application/json',
         },
         status: response.status,
       });
    }

    const data = await response.json();

    // 5. Process the Gemini response
    let generatedOutput: GeneratedMessageOutput;
    try {
        generatedOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
            ? JSON.parse(data.candidates[0].content.parts[0].text)
            : data;

        if (typeof generatedOutput !== 'object' || typeof generatedOutput.messages !== 'object' || typeof generatedOutput.ai_reasoning !== 'string') {
             throw new Error("AI response structure is incorrect or missing required fields.");
        }

        generatedOutput.messages.version1 = typeof generatedOutput.messages.version1 === 'string' ? generatedOutput.messages.version1 : '';
        generatedOutput.messages.version2 = typeof generatedOutput.messages.version2 === 'string' ? generatedOutput.messages.version2 : '';
        generatedOutput.messages.version3 = typeof generatedOutput.messages.version3 === 'string' ? generatedOutput.messages.version3 : '';

    } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw AI response data:', JSON.stringify(data));
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Failed to process AI response structure for messages.',
          error: parseError.message
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 500,
        });
    }

    // 6. Return success response
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Messages generated successfully.',
      generated_messages: generatedOutput.messages,
      ai_reasoning: generatedOutput.ai_reasoning
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error during message generation:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'An unexpected error occurred during message generation.',
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
