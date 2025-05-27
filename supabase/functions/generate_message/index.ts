
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
  'Chat': 300,
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

  // 3. Enhanced prompt for authentic, specific messaging with clear asks
  const prompt = `
  You are an AI assistant helping a professional craft authentic, specific outreach messages for job search networking. Your role is to help them articulate their unique value proposition in a way that feels genuine and includes a clear, well-defined ask.

  CRITICAL GUIDELINES:
  1. ALWAYS include a clear, specific ask based on the objective - never leave it vague
  2. AVOID generic praise like "I'm impressed with your work" unless you have very specific examples
  3. Focus on specific industry challenges, technologies, or domain expertise rather than generic statements
  4. Use concrete examples from the user's background that relate to the company's specific needs
  5. The message should feel authentic and professional, not sales-y
  6. LinkedIn connection requests can have implied objectives (to connect), but other mediums need explicit asks

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

  SPECIFIC INSTRUCTIONS FOR MESSAGE CREATION:

  1. Lead with specific expertise/domain knowledge that relates to the company's industry and challenges
  2. Mention concrete technologies, processes, or industry challenges you've tackled
  3. Include a clear, specific ask that matches the objective:
     - For "get to know and build relationship": "I'd be happy to connect as I'm [specific reason]"
     - For "get informational interview": "Please let me know if we can have an intro chat" or "Could we schedule a brief call"
     - For "ask for referral": "Could you point me to the right people at [Company] to explore opportunities?"
     - For "explore roles": "I'd like to connect to discover [specific type] roles at [Company]"
     - For "follow up": Reference the previous interaction and include a specific next step
  4. Avoid generic phrases like "I'm impressed with your work" unless you can be very specific
  5. Use industry-specific terminology and challenges where relevant
  6. Keep the tone professional but authentic

  REASONING INSTRUCTIONS:
  For the AI reasoning, explain your approach using "you" language directed at the user:
  - "Your experience in [specific area] positions you as someone who understands [specific challenge]"
  - "Your background with [specific technology/process] directly relates to [company's needs]"
  - "You are demonstrating value by mentioning [specific expertise] because..."
  - "This approach works because you are showing how you can solve [specific problem]"

  Explain how each message positions the user authentically, why the specific ask is appropriate, and how this approach will resonate professionally while avoiding generic networking language.

  Generate 3 distinct message versions that:
  - Version 1: Focus on technical/domain expertise alignment
  - Version 2: Emphasize problem-solving capabilities with specific examples
  - Version 3: Highlight leadership/strategic experience relevant to their role

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
           maxOutputTokens: Math.round(maxLength * 3),
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
