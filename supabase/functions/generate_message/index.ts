import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';
// Medium options defined directly in edge function (cannot import from src)
const MEDIUM_OPTIONS = [
  {
    id: "LinkedIn connection note",
    label: "LinkedIn connection Note",
    maxLength: 200
  },
  {
    id: "Premium LinkedIn connection note",
    label: "Premium LinkedIn connection note",
    maxLength: 300
  },

  {
    id: "LinkedIn message, email, InMail",
    label: "LinkedIn message, email, InMail",
    maxLength: 2000
  }
];
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const authHeader = req.headers.get('Authorization');
  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: {
        Authorization: authHeader ?? ''
      }
    }
  });
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
        'Content-Type': 'application/json'
      },
      status: 401
    });
  }
  const userId = user.id;
  const { contact_id, medium, objective, additional_context } = await req.json();
  const maxLength = MEDIUM_OPTIONS.find((opt)=>opt.id === medium)?.maxLength || 8000;
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
      status: 400
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
        'Content-Type': 'application/json'
      },
      status: 500
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
  // 3. Enhanced hybrid prompt for authentic, specific messaging with clear asks
  const prompt = `
  You are an AI assistant helping a professional craft authentic, specific outreach messages for job search networking. Your role is to help them write a message to a selected contact that effectively achieves the stated objecive taking into account the user's professional background and the contact's details. 
  
  SPECIFIC INSTRUCTIONS FOR MESSAGE CREATION:
  1. ALWAYS include a clear, specific ask based on the objective - never leave it vague. For example:
    - For "Explore roles, find hiring managers": "I'd like to connect to discover [specific type] roles at [Company] and connect with hiring managers"
    - For "Request a referral for a role you applied for": "Could you point me to the right people at [Company] to explore opportunities?"
    - For "Get informational interview": "Please let me know if we can have an intro chat" or "Could we schedule a brief call"
    - For "Build relationship, open-ended": "I'd be happy to connect as I can help with [specific example of how I can help or what I can learn from you]"
    - For "Follow up": Reference the previous interactions and include a specific next step based on the previous messages and the additional context, if provided.
    - For "Custom objective": Do your best to follow the specific ask provided by the user.
  2. AVOID generic praise like "I'm impressed with your work".
  3. Focus on user's specific highlights, such as industry challenges solved, technologies they worked with, or domain expertise rather than generic statements. Use concrete examples from the user's background that relate to the specific needs of the contact and their current company / role
  5. The message should feel authentic and professional, not sales-y, and adjusted for the medium. Lead with Hi <firstname>. For LinkedIn connection notes, be brief, but not too casual. For emails and InMails, use a more formal tone and formatting by default (unless instructed differently by the user in Additional Context), eg "Hi <first name>, <empty line>, <message body>, <empty line>, Best regards, <user's name>". 
  6. Try to articulate the users unique value proposition: how they can be useful to the contact's company in their target role.
  7. Follow additional user guidance provided in Additional Context, if not null.
  8. Leverage what you know about the user's relationship with the contact, if available: worked at the same company, went to the same school, come from the same industry ,share a niche hobby. Look into their past interactions if available. Look into Additional Context: the user might provide information on their relationship with the contact.
  9. Based on the language in contact's LinikedIn profile, try to match the tone and style of the message to the contact's communication style. Try to use any specific terms or phrases they use in their profile. 
  10. Consider MAX_MESSAGE_LENGTH as a hard limit for the message length. If the message exceeds this length, redraft it to fit within the limit. For emails, InMails, and messages to 1st connections, aim for around 1,000 chars or less, to ensure the message is concise and to the point, while still hitting on the most relevant points. 

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

   Generate 3 distinct message versions that utilize different approaches, eg leverage different aspects of the user's background, highlight different skills, or take different angles on the contact's needs. Each version should be authentic, specific, and aligned with the user's objective.

  Generate the output as a JSON object with 'messages' (containing version1, version2, version3):

  {
    "messages": {
      "version1": "...",
      "version2": "...",
      "version3": "..."
    },

  }
  `;
  // 4. Make the call to the Gemini API
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: Math.round(maxLength * 3),
          responseMimeType: "application/json"
        }
      })
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
          'Content-Type': 'application/json'
        },
        status: response.status
      });
    }
    const data = await response.json();
    // 5. Process the Gemini response
    let generatedOutput;
    try {
      generatedOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text ? JSON.parse(data.candidates[0].content.parts[0].text) : data;
      if (typeof generatedOutput !== 'object' || typeof generatedOutput.messages !== 'object') {
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
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // 6. Return success response
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Messages generated successfully.',
      generated_messages: generatedOutput.messages
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
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
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
