
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
// new version of fetch
    // --- REVISED: Fetching all data concurrently for better performance ---
    const [userProfileResult, userSummaryResult, contactResult] = await Promise.all([
      supabaseClient.from('user_profiles').select('background_input').eq('user_id', user.id).single(),
      supabaseClient.from('user_summaries').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('contacts').select('*, companies(*)').eq('contact_id', contact_id).eq('user_id', user.id).single()
    ]);

    // Validate all fetched data
    if (userProfileResult.error || !userProfileResult.data) {
        throw new Error(userProfileResult.error?.message || "Failed to fetch user profile.");
    }
    if (userSummaryResult.error || !userSummaryResult.data) {
        throw new Error(userSummaryResult.error?.message || "Failed to fetch user summary.");
    }
    if (contactResult.error || !contactResult.data) {
        throw new Error(contactResult.error?.message || "Failed to fetch contact details.");
    }

  const userProfile = userProfileResult.data.background_input;
  const userSummary = userSummaryResult.data;
  const contactData = contactResult.data;
  const companyData = contactData.companies;
  const maxLength = MAX_MESSAGE_LENGTH[medium] || 1000;

  // 3. Enhanced hybrid prompt for authentic, specific messaging with clear asks
  const prompt = `
  You are an AI assistant helping a professional craft authentic, specific outreach messages for job search networking. Your role is to help them write a message to a selected contact that effectively achieves the stated objecive taking into account the user's professional background and the contact's details. 
  
  SPECIFIC INSTRUCTIONS FOR MESSAGE CREATION:
  0. Start all messages with the word TEST
  1. ALWAYS include a clear, specific ask based on the objective - never leave it vague
    - For "get to know and build relationship": "I'd be happy to connect as I'm [specific reason]"
     - For "get informational interview": "Please let me know if we can have an intro chat" or "Could we schedule a brief call"
     - For "ask for referral": "Could you point me to the right people at [Company] to explore opportunities?"
     - For "explore roles": "I'd like to connect to discover [specific type] roles at [Company]"
     - For "follow up": Reference the previous interaction and include a specific next step
  2. AVOID generic praise like "I'm impressed with your work" unless you have very specific examples
  3. Focus on user's specific highlights, such as industry challenges solved, technologies they worked with, or domain expertise rather than generic statements. Use concrete examples from the user's background that relate to the specific needs of the contact and their current company / role
  5. The message should feel authentic and professional, not sales-y. Lead with Hi <firstname>. Be brief, but not too casual. 
  6. Try to articulate the users unique value proposition: how they can be useful to the contact's company in their target role.
  7. Follow additional user guidance provided in Additional Context, if not null.
  8. Leverage what you know about the user's relationship with the contact, if available: worked at the same company, went to the same school, come from the same industry ,share a niche hobby. Look into their past interactions if available. Look into Additional Context: the user might provide information on their relationship with the contact.
  9. Based on the language in contact's LinikedIn profile, try to match the tone and style of the message to the contact's communication style. Try to use any specific terms or phrases they use in their profile. 

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

 Now, here is the complete, raw background information for both individuals. Your main task is to analyze this raw text to find specific, non-obvious details—like shared niche skills, past projects, unique experiences, or personal interests—that will make the outreach message exceptionally compelling and personalized.

      **USER'S RAW BACKGROUND INFO (e.g., from their full LinkedIn profile or CV):**
      ---
      ${userProfile.background_input} 
      ---

      **CONTACT'S RAW BACKGROUND INFO (e.g., from their full LinkedIn profile):**
      ---
      ${contactData.linkedin_bio} 

  REASONING INSTRUCTIONS:
  For the AI reasoning, explain your approach using "you" language directed at the user:
  - "Your experience in [specific area] positions you as someone who understands [specific challenge]"
  - "Your background with [specific technology/process] directly relates to [company's needs]"
  - "You are demonstrating value by mentioning [specific expertise] because..."
  - "This approach works because you are showing how you can solve [specific problem]"
  Explain how each message positions the user authentically, why the specific ask is appropriate, and how this approach will resonate professionally while avoiding generic networking language.
  Explain how you used the user's relationship with the contact to create a stronger connection.

  Generate 3 distinct message versions that utilize different approaches, eg leverage different aspects of the user's background, highlight different skills, or take different angles on the contact's needs. Each version should be authentic, specific, and aligned with the user's objective.

  Generate the output as a JSON object with 'messages' (containing version1, version2, version3) and 'ai_reasoning' (explaining your approach in "you" language):

  {
    "messages": {
      "version1": "...",
      "version2": "...",
      "version3": "..."
    },
    "ai_reasoning": "..."
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
