import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';

// Medium options defined directly in edge function (cannot import from src)
const MEDIUM_OPTIONS = [
  {
    id: "LinkedIn connection note",
    label: "LinkedIn connection Note",
    maxLength: 175 // slightly below 200 bc Gemini likes to go over the limit
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

// Updated to Gemini 2.5 Flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// System instruction for high-level, unchanging rules
const SYSTEM_INSTRUCTION = `You are an AI assistant specialized in crafting authentic, professional networking messages for job search outreach. Your core mission is to help professionals write compelling, personalized messages that effectively achieve their stated objectives.

CORE PRINCIPLES:
- Always be authentic and professional, never sales-y
- Include specific, actionable asks based on the user's objective
- Leverage concrete details from both user and contact backgrounds
- Match the tone and style appropriate for the communication medium
- Focus on mutual value and genuine relationship building
- Do not use phrases like "I'm impressed with your work on..." or "I'm inspired by what you do..." or others that sounds too generic and unauthentic.

STRICT CONSTRAINTS:
- NEVER exceed the specified character limit for the selected medium
- Generate exactly 3 distinct message versions with different approaches
- Always respond with valid JSON in the specified schema format
- Ensure each message has a clear, specific call-to-action`;

// Response schema for structured JSON output
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    messages: {
      type: "object",
      properties: {
        version1: {
          type: "string",
          description: "First message version focusing on shared background/experience (MAX ${maxLength} characters)"
        },
        version2: {
          type: "string", 
          description: "Second message version highlighting specific skills/expertise (MAX ${maxLength} characters)"
        },
        version3: {
          type: "string",
          description: "Third message version emphasizing value proposition/mutual benefit (MAX ${maxLength} characters)"
        }
      },
      required: ["version1", "version2", "version3"]
    }
  },
  required: ["messages"]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      {
        global: {
          headers: { Authorization: authHeader ?? '' }
        }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Parse request body
    const { contact_id, medium, objective, additional_context } = await req.json();

    // Validate required parameters
    if (!contact_id || !medium || !objective) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters.',
        error: 'contact_id, medium, and objective are required.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Calculate max length for the selected medium
    const foundOption = MEDIUM_OPTIONS.find((opt) => opt.id === medium);
    const maxLength = foundOption?.maxLength || 2000;

    // Validate Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not set in Supabase secrets.');
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Server configuration error.',
        error: 'Gemini API key not configured.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Fetch all required data concurrently
    const [userProfileResult, userSummaryResult, contactResult] = await Promise.all([
      supabaseClient.from('user_profiles').select('background_input').eq('user_id', user.id).single(),
      supabaseClient.from('user_summaries').select('*').eq('user_id', user.id).single(),
      supabaseClient.from('contacts').select('*, companies(*)').eq('contact_id', contact_id).eq('user_id', user.id).single()
    ]);

    // Validate fetched data
    if (userProfileResult.error || !userProfileResult.data) {
      throw new Error(userProfileResult.error?.message || "Failed to fetch user profile.");
    }
    if (userSummaryResult.error || !userSummaryResult.data) {
      throw new Error(userSummaryResult.error?.message || "Failed to fetch user summary.");
    }
    if (contactResult.error || !contactResult.data) {
      throw new Error(contactResult.error?.message || "Failed to fetch contact details.");
    }

    const userProfile = userProfileResult.data;
    const userSummary = userSummaryResult.data;
    const contactData = contactResult.data;
    const companyData = contactData.companies;

    // Build the user prompt with specific context
    const userPrompt = `
TASK: Generate 3 distinct networking messages for the following context:

COMMUNICATION MEDIUM: ${medium}
CHARACTER LIMIT: ${maxLength} characters (STRICT - never exceed this limit)
MESSAGE OBJECTIVE: ${objective}
ADDITIONAL CONTEXT: ${additional_context || 'None provided'}

MESSAGE REQUIREMENTS:
1. ALWAYS include a clear, specific ask based on the objective:
   - "Explore roles, find hiring managers": "I'd like to connect to discover [specific] roles at [Company] and connect with hiring managers"
   - "Request a referral": "Could you point me to the right people at [Company] to explore opportunities?"
   - "Get informational interview": "Could we schedule a brief call to discuss [specific topic]?"
   - "Build relationship": "I'd be happy to connect as I can help with [specific value]"
   - "Follow up": Reference previous interactions and include specific next step
   - "Custom objective": Follow the user's specific request

2. FORMATTING by medium:
   - LinkedIn connection notes: Brief, professional. Start with the message right away - omit greetings like "Hi [firstname]"
   - Emails/InMails: More formal. Use "Hi [firstname], [message] Best regards, [user's name]". Format appropriately.

3. PERSONALIZATION: Use specific details from backgrounds. DO NOT use generic praise like "I'm impressed with your work on..."

4. VALUE PROPOSITION FORMAT: When referencing how the user can help the contact, use "you can" format (e.g., "you can leverage my expertise in...", "you can benefit from my experience with...", "you can tap into my network of...")

USER BACKGROUND:
- Professional Summary: ${userSummary.overall_blurb || 'N/A'}
- Key Achievements: ${userSummary.achievements || 'N/A'}
- Experience: ${userSummary.experience || 'N/A'}
- Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
- Education: ${userSummary.education || 'N/A'}
- Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
- Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
- Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
- Value Proposition: ${userSummary.value_proposition_summary || 'N/A'}

TARGET CONTACT:
- Name: ${contactData.full_name || `${contactData.first_name} ${contactData.last_name}`}
- Role: ${contactData.role || 'N/A'}
- Bio Summary: ${contactData.bio_summary || 'N/A'}
- How User Can Help: ${contactData.how_i_can_help || 'Not specified'}

TARGET COMPANY:
- Name: ${companyData?.name || 'N/A'}
- Description: ${companyData?.ai_description || 'N/A'}
- Industry: ${companyData?.industry || 'N/A'}

RAW BACKGROUND DATA:
USER'S FULL BACKGROUND:
${userProfile.background_input || 'N/A'}

CONTACT'S LINKEDIN BIO:
${contactData.linkedin_bio || 'N/A'}

Generate 3 distinct message versions using different angles and approaches, mentioning different details of backgrounds, while staying under ${maxLength} characters each.`;

    // Make API call to Gemini 2.5 Flash with structured output
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: Math.max(2048, Math.min(8192, maxLength * 4)), // At least 2048 tokens
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      });
    }

    const data = await response.json();
    
    // Process the structured response
    let generatedOutput;
    try {
      const candidate = data?.candidates?.[0];
      
      if (candidate?.finishReason === 'MAX_TOKENS') {
        throw new Error("Response was truncated. Try reducing prompt size or increasing maxOutputTokens.");
      }
      
      const responseText = candidate?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error(`No response text from AI. Finish reason: ${candidate?.finishReason || 'unknown'}`);
      }
      
      generatedOutput = JSON.parse(responseText);
      
      if (!generatedOutput?.messages || 
          typeof generatedOutput.messages !== 'object' ||
          !generatedOutput.messages.version1 ||
          !generatedOutput.messages.version2 ||
          !generatedOutput.messages.version3) {
        throw new Error("AI response missing required message versions");
      }


    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to process AI response structure.',
        error: parseError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Return successful response
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Messages generated successfully.',
      generated_messages: generatedOutput.messages
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Unexpected error during message generation:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'An unexpected error occurred during message generation.',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
