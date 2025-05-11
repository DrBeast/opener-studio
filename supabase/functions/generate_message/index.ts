import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2'; // Use the Supabase JS client

// Define CORS headers using a constant
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend origin in production
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey', // Include common headers
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Define the Gemini API endpoint
// Using gemini-pro for message generation - good balance of cost and quality.
// gemini-flash could be an alternative for potentially lower cost/faster response if context fits.
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Define the expected structure for the AI's message generation output
interface GeneratedMessageOutput {
  messages: {
    version1: string;
    version2: string;
    version3: string;
  };
  ai_reasoning: string; // Explanation of why the messages were drafted this way
}

// Define the maximum message length based on medium (from MVP features)
const MAX_MESSAGE_LENGTH: { [key: string]: number } = {
  'LinkedIn connection note': 300,
  'LinkedIn InMail': 2000, // Body limit
  'LinkedIn message to 1st connection': 400, // Arbitrary limit for focus, can be adjusted
  'Cold email': 500, // Arbitrary limit for conciseness, can be adjusted
};


serve(async (req) => {
  // --- CORS Handling ---
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  // --- End CORS Handling ---

  // Create a Supabase client with the logged-in user's Auth token
  const authHeader = req.headers.get('Authorization');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use ANON key for client-side calls
    {
      global: {
        headers: { Authorization: authHeader ?? '' },
      },
    }
  );

  // Get the authenticated user's ID from the Supabase Auth context
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
      status: 401, // Unauthorized
    });
  }

  const userId = user.id;

  // Get input from the request body
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
      status: 400, // Bad Request
    });
  }

  // Get the Gemini API Key securely from Supabase Secrets
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
    .select('*, companies(*)') // Fetch contact and related company data
    .eq('contact_id', contact_id)
    .eq('user_id', userId) // Double check user_id for security
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

  const companyData = contactData.companies; // Get the related company data

  // Determine the maximum length for the message based on the medium
  const maxLength = MAX_MESSAGE_LENGTH[medium] || 500; // Default to 500 if medium not in map

  // 3. Construct the prompt for the Gemini API
  // Instruct Gemini to act as a message crafting assistant
  const prompt = `
  You are an AI assistant helping a professional draft an outreach message for job search networking.
  Below is the user's professional background summary, details about the target contact and their company, the communication medium, the message objective, and any additional context.

  Your goal is to generate up to 3 distinct versions of a personalized and effective message.
  Focus on helping the user articulate their value proposition and frame the outreach in a way that feels authentic and mutually beneficial, not "salesy."
  Adhere to the specified maximum length for the chosen medium.
  Also, provide a brief explanation of your reasoning behind the drafted messages.

  User Background Summary (Synthesized):
  Overall Blurb: ${userSummary.overall_blurb ?? 'N/A'}
  Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
  Education Highlights: ${userSummary.combined_education_highlights ? JSON.stringify(userSummary.combined_education_highlights) : 'N/A'}
  Key Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
  Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
  Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
  Value Proposition Summary: ${userSummary.value_proposition_summary ?? 'N/A'}
  User's Current Role: ${userSummary.overall_blurb ?? 'N/A'} // Using overall_blurb as a proxy for current role/level
  // Include other relevant fields from user_summaries as needed

  Target Contact Details:
  Name: ${contactData.full_name ?? contactData.first_name + ' ' + contactData.last_name}
  Role: ${contactData.role ?? 'N/A'}
  Bio Summary: ${contactData.bio_summary ?? 'N/A'}
  How User Can Help This Contact: ${contactData.how_i_can_help ?? 'Not specified'}
  // Include other relevant contact fields

  Target Company Details:
  Company Name: ${companyData?.name ?? 'N/A'}
  Company Description: ${companyData?.ai_description ?? 'N/A'}
  Industry: ${companyData?.industry ?? 'N/A'}
  // Include other relevant company fields

  Communication Medium: ${medium}
  Maximum Length for Medium: ${maxLength} characters 
  Message Objective: ${objective}
  Additional Context/Points to Include: ${additional_context ?? 'None provided'}

  Generate up to 3 versions of the message and provide your reasoning. The output should be a single JSON object with 'messages' (an object containing version1, version2, version3 as strings) and 'ai_reasoning' (a string explaining the approach). If fewer than 3 versions are generated, include null or empty strings for the missing ones.

  Example Output Structure:
  {
    "messages": {
      "version1": "...",
      "version2": "...",
      "version3": "..."
    },
    "ai_reasoning": "..."
  }

  Generate the JSON object:
  `;

  // 4. Make the call to the Gemini API
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey, // Use the secured API key
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
           temperature: 0.7, // Allow some creativity in message variations
           maxOutputTokens: Math.round(maxLength * 1.5), // Set max output tokens based on length limit + buffer
           responseMimeType: "application/json" // Request JSON output directly
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorBody}`);
      // Adjusted error response format with CORS headers
       return new Response(JSON.stringify({
         status: 'error',
         message: `Error from AI service: ${response.statusText}`,
         error: errorBody
       }), {
         headers: {
           ...corsHeaders, // Include CORS headers
           'Content-Type': 'application/json',
         },
         status: response.status,
       });
    }

    const data = await response.json();

    // 5. Process the Gemini response to extract the structured data
    let generatedOutput: GeneratedMessageOutput;
    try {
        generatedOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
            ? JSON.parse(data.candidates[0].content.parts[0].text)
            : data; // Assume data is already parsed JSON if responseMimeType worked

        // Basic validation of the structure
        if (typeof generatedOutput !== 'object' || typeof generatedOutput.messages !== 'object' || typeof generatedOutput.ai_reasoning !== 'string') {
             throw new Error("AI response structure is incorrect or missing required fields.");
        }
        // Ensure message versions are strings
        generatedOutput.messages.version1 = typeof generatedOutput.messages.version1 === 'string' ? generatedOutput.messages.version1 : '';
        generatedOutput.messages.version2 = typeof generatedOutput.messages.version2 === 'string' ? generatedOutput.messages.version2 : '';
        generatedOutput.messages.version3 = typeof generatedOutput.messages.version3 === 'string' ? generatedOutput.messages.version3 : '';


    } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
         console.error('Raw AI response data:', JSON.stringify(data)); // Log raw data for debugging
        // Adjusted error response format with CORS headers
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Failed to process AI response structure for messages.',
          error: parseError.message
        }), {
          headers: {
            ...corsHeaders, // Include CORS headers
            'Content-Type': 'application/json',
          },
          status: 500,
        });
    }

    // 6. Return a success response, including the generated messages and reasoning
    // Adjusted success response format
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Messages generated successfully.',
      generated_messages: generatedOutput.messages,
      ai_reasoning: generatedOutput.ai_reasoning
    }), {
      headers: {
        ...corsHeaders, // Include CORS headers
        'Content-Type': 'application/json',
      },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error during message generation:', error);
    // Adjusted error response format
    return new Response(JSON.stringify({
      status: 'error',
      message: 'An unexpected error occurred during message generation.',
      error: error.message
    }), {
      headers: {
        ...corsHeaders, // Include CORS headers
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
});
