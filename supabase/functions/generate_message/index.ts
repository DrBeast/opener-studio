import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2';
import { getCorsHeaders } from '../_shared/cors.ts';

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

// CORS headers are now handled by shared getCorsHeaders function

// Updated to Gemini 2.5 Flash-Lite for optimized low latency
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

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
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);
  
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

    // Parse request body to check for guest mode
    const { 
      contact_id, 
      medium, 
      objective, 
      additional_context,
      is_guest = false,
      session_id,
      guest_contact_id,
      user_profile_id
    } = await req.json();

    let user, userProfile, userSummary, contact;

    if (is_guest) {
      // Guest mode: No authentication required
      console.log('Guest mode parameters:', { session_id, guest_contact_id, user_profile_id });
      if (!session_id || !guest_contact_id || !user_profile_id) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'session_id, guest_contact_id, and user_profile_id required for guest mode',
          received: { session_id, guest_contact_id, user_profile_id }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    } else {
      // Authenticated mode: Existing logic
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !authUser) {
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
      user = authUser;
    }

    // Validate required parameters based on mode
    if (is_guest) {
      if (!medium || !objective) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Missing required parameters.',
          error: 'medium and objective are required for guest mode.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    } else {
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

    // Fetch all required data based on mode
    if (is_guest) {
      // Guest mode: Fetch from guest tables
      console.log('Querying with parameters:', { user_profile_id, session_id, guest_contact_id });
      
      const [userProfileResult, userSummaryResult, contactResult] = await Promise.all([
        supabaseClient.from('guest_user_profiles').select('*').eq('id', user_profile_id).single(),
        supabaseClient.from('guest_user_summaries').select('*').eq('session_id', session_id).single(),
        supabaseClient.from('guest_contacts').select('*').eq('id', guest_contact_id).single()
      ]);
      
      console.log('Raw query results:', {
        userProfile: { error: userProfileResult.error, data: userProfileResult.data },
        userSummary: { error: userSummaryResult.error, data: userSummaryResult.data },
        contact: { error: contactResult.error, data: contactResult.data }
      });

      // Validate fetched data
      console.log('Fetched data results:', {
        userProfile: { error: userProfileResult.error, hasData: !!userProfileResult.data },
        userSummary: { error: userSummaryResult.error, hasData: !!userSummaryResult.data },
        contact: { error: contactResult.error, hasData: !!contactResult.data }
      });
      
      // Debug: Check if there are multiple rows for the same session_id
      if (userProfileResult.error && userProfileResult.error.message.includes('multiple')) {
        console.log('Multiple user profiles found for session_id:', session_id);
        const { data: allProfiles } = await supabaseClient
          .from('guest_user_profiles')
          .select('*')
          .eq('session_id', session_id);
        console.log('All profiles for session:', allProfiles);
        
        // Clean up duplicates - keep the most recent one
        if (allProfiles && allProfiles.length > 1) {
          console.log('Cleaning up duplicate user profiles...');
          const sortedProfiles = allProfiles.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          const keepProfile = sortedProfiles[0];
          const deleteProfiles = sortedProfiles.slice(1);
          
          for (const profile of deleteProfiles) {
            await supabaseClient.from('guest_user_profiles').delete().eq('id', profile.id);
          }
          console.log('Cleaned up duplicate user profiles, keeping:', keepProfile.id);
        } else if (allProfiles && allProfiles.length === 0) {
          console.log('No user profiles found for session_id - this might be an RLS policy issue');
        }
      }
      
      if (userSummaryResult.error && userSummaryResult.error.message.includes('multiple')) {
        console.log('Multiple user summaries found for session_id:', session_id);
        const { data: allSummaries } = await supabaseClient
          .from('guest_user_summaries')
          .select('*')
          .eq('session_id', session_id);
        console.log('All summaries for session:', allSummaries);
        
        // Clean up duplicates - keep the most recent one
        if (allSummaries && allSummaries.length > 1) {
          console.log('Cleaning up duplicate user summaries...');
          const sortedSummaries = allSummaries.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          const keepSummary = sortedSummaries[0];
          const deleteSummaries = sortedSummaries.slice(1);
          
          for (const summary of deleteSummaries) {
            await supabaseClient.from('guest_user_summaries').delete().eq('id', summary.id);
          }
          console.log('Cleaned up duplicate user summaries, keeping:', keepSummary.id);
        } else if (allSummaries && allSummaries.length === 0) {
          console.log('No user summaries found for session_id - this might be an RLS policy issue');
        }
      }
      if (userProfileResult.error || !userProfileResult.data) {
        const error = userProfileResult.error?.message || "Failed to fetch guest user profile.";
        console.error('User profile error:', error);
        throw new Error(error);
      }
      if (userSummaryResult.error || !userSummaryResult.data) {
        const error = userSummaryResult.error?.message || "Failed to fetch guest user summary.";
        console.error('User summary error:', error);
        throw new Error(error);
      }
      if (contactResult.error || !contactResult.data) {
        const error = contactResult.error?.message || "Failed to fetch guest contact.";
        console.error('Contact error:', error);
        throw new Error(error);
      }

      userProfile = userProfileResult.data;
      userSummary = userSummaryResult.data;
      contact = contactResult.data;
    } else {
      // Authenticated mode: Existing logic
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

      userProfile = userProfileResult.data;
      userSummary = userSummaryResult.data;
      contact = contactResult.data;
    }

    // Get company data (only for authenticated mode)
    const companyData = is_guest ? null : contact.companies;

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
- Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
- Education Highlights: ${userSummary.combined_education_highlights ? JSON.stringify(userSummary.combined_education_highlights) : 'N/A'}
- Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
- Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
- Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
- Value Proposition: ${userSummary.value_proposition_summary || 'N/A'}

TARGET CONTACT:
- Name: ${contact.full_name || `${contact.first_name} ${contact.last_name}`}
- Role: ${contact.role || 'N/A'}
- Bio Summary: ${contact.bio_summary || 'N/A'}
- How User Can Help: ${contact.how_i_can_help || 'Not specified'}

TARGET COMPANY:
- Name: ${companyData?.name || 'N/A'}
- Description: ${companyData?.ai_description || 'N/A'}
- Industry: ${companyData?.industry || 'N/A'}

RAW BACKGROUND DATA:
USER'S FULL BACKGROUND:
${userProfile.background_input || 'N/A'}

CONTACT'S LINKEDIN BIO:
${contact.linkedin_bio || 'N/A'}

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
          topK: 40,
          topP: 0.95,
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
        console.warn("Response was truncated due to token limit. This may indicate very large input content.");
        // Don't throw error, try to parse what we have
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

    // Conditional storage based on mode
    if (is_guest) {
      // Store each message version in guest_saved_messages table
      const messageVersions = [
        { text: generatedOutput.messages.version1, name: 'Version 1' },
        { text: generatedOutput.messages.version2, name: 'Version 2' },
        { text: generatedOutput.messages.version3, name: 'Version 3' }
      ];

      const savedMessages = [];
      
      for (let i = 0; i < messageVersions.length; i++) {
        const version = messageVersions[i];
        const isSelected = i === 0; // Version 1 is selected by default
        
        const { data: savedMessage, error: insertError } = await supabaseClient
          .from('guest_saved_messages')
          .insert({
            session_id,
            guest_contact_id: guest_contact_id,
            user_profile_id: null, // Don't use user_profile_id for guest users
            message_text: version.text,
            version_name: version.name,
            medium: medium,
            message_objective: objective,
            message_additional_context: additional_context || null,
            is_selected: isSelected, // Version 1 selected by default
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error storing guest message ${version.name}:`, insertError);
          return new Response(JSON.stringify({
            status: 'error',
            message: `Failed to store guest message ${version.name}.`,
            error: insertError.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          });
        }

        savedMessages.push(savedMessage);
      }

      return new Response(JSON.stringify({
        status: 'success',
        message: 'Messages generated successfully.',
        generated_messages: generatedOutput.messages,
        saved_message_ids: savedMessages.map(msg => msg.id)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      // Authenticated mode: Return messages (existing behavior)
      // Note: The original function doesn't store messages, it just generates them
      // The frontend handles storing messages in saved_message_versions
      return new Response(JSON.stringify({
        status: 'success',
        message: 'Messages generated successfully.',
        generated_messages: generatedOutput.messages
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

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
