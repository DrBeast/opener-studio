import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.2'; // Use the Supabase JS client
// Define CORS headers using a constant
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
// Define the Gemini API endpoint
// Using gemini-1.5-pro for its larger context window and reasoning ability for this task.
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
serve(async (req)=>{
  // --- CORS Handling ---
  // This allows your frontend (on a different domain/port) to call this function
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  // --- End CORS Handling ---
  // Create a Supabase client with the logged-in user's Auth token
  // This is the correct way to run the function *as the authenticated user* subject to RLS
  const authHeader = req.headers.get('Authorization');
  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: {
        Authorization: authHeader ?? ''
      }
    }
  });
  // Get the authenticated user's ID from the Supabase Auth context
  // This check remains important for security and RLS
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.error('Authentication failed:', userError?.message);
    // Adjusted error response format with CORS headers
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
  // Get the Gemini API Key securely from Supabase Secrets
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    console.error('Gemini API key not set in Supabase secrets.');
    // Adjusted error response format with CORS headers
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
  // 1. Fetch the user's overall processed background summary from the user_summaries table
  const { data: userSummaryData, error: fetchSummaryError } = await supabaseClient.from('user_summaries').select('*') // Fetch all columns from the user_summaries row
  .eq('user_id', userId).single(); // Expecting one summary row per user
  if (fetchSummaryError || !userSummaryData) {
    console.error('Error fetching user summary:', fetchSummaryError?.message || 'Summary not found in user_summaries.');
    // Adjusted error response format with CORS headers
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to fetch user background summary.',
      error: fetchSummaryError?.message || 'User summary data missing.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
  const userSummary = userSummaryData;
  // 2. Fetch the user's job target criteria from the target_criteria table
  const { data: targetCriteria, error: fetchCriteriaError } = await supabaseClient.from('target_criteria').select('*') // Fetch all columns
  .eq('user_id', userId).single();
  if (fetchCriteriaError || !targetCriteria) {
    console.error('Error fetching target criteria:', fetchCriteriaError?.message || 'Criteria not found.');
    // Adjusted error response format with CORS headers
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to fetch user target criteria.',
      error: fetchCriteriaError?.message || 'User target criteria missing.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
  // 3. Construct the prompt for the Gemini API
  const prompt = `
  You are an AI assistant helping a professional identify target companies for their job search.
  Below is the user's professional background summary and their job target criteria.

  User Background Summary (Synthesized):
  Overall Blurb: ${userSummary.overall_blurb ?? 'N/A'}
  Experience Highlights: ${userSummary.combined_experience_highlights ? JSON.stringify(userSummary.combined_experience_highlights) : 'N/A'}
  Education Highlights: ${userSummary.combined_education_highlights ? JSON.stringify(userSummary.combined_education_highlights) : 'N/A'}
  Key Skills: ${userSummary.key_skills ? JSON.stringify(userSummary.key_skills) : 'N/A'}
  Domain Expertise: ${userSummary.domain_expertise ? JSON.stringify(userSummary.domain_expertise) : 'N/A'}
  Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(targetCriteria.technical_expertise) : 'N/A'} // Corrected field access here
  Value Proposition Summary: ${userSummary.value_proposition_summary ?? 'N/A'}
  // Include other relevant fields from user_summaries as needed in the prompt

  User Job Target Criteria:
  Target Functions: ${targetCriteria.target_functions ? JSON.stringify(targetCriteria.target_functions) : 'Any'}
  Target Locations: ${targetCriteria.target_locations ? JSON.stringify(targetCriteria.target_locations) : 'Any'}
  Target WFH Preference: ${targetCriteria.target_wfh_preference ? JSON.stringify(targetCriteria.target_wfh_preference) : 'Any'}
  Free-form Role And Company Description: ${targetCriteria.free_form_role_description ?? 'None provided'}
  Target Industries: ${targetCriteria.target_industries ? JSON.stringify(targetCriteria.target_industries) : 'Any'}
  Target Sizes: ${targetCriteria.target_sizes ? JSON.stringify(targetCriteria.target_sizes) : 'Any'}
  Target Public/Private: ${targetCriteria.target_public_private ? JSON.stringify(targetCriteria.target_public_private) : 'Any'}
  Similar Companies (Inspiration): ${targetCriteria.similar_companies ? JSON.stringify(targetCriteria.similar_companies) : 'None provided'}
  Visa Sponsorship Required: ${targetCriteria.visa_sponsorship_required ? 'Yes' : 'No'}

  Your task is to identify up to 30 companies (but at least 10) that are the best fit for this user's background and criteria. For each company, provide the following information in a structured JSON array.

  For each company object in the array:
  - "name": Company Name
  - "ai_description": A brief, 1-2 sentence description of the company's business, tailored to the user's interests if possible.
  - "industry": The primary industry of the company.
  - "key_locations": Key locations of the company (e.g., HQ, relevant offices).
  - "estimated_headcount": Estimated number of employees (use categories like "<200", "201-1000", "1000+").
  - "estimated_revenue": Estimated annual revenue (use categories like "<$10M", "$10M-$50M", "$50M-$250M", "$250M-$1B", "$1B+"). Use public information where available.
  - "wfh_policy": The company's general WFH policy (e.g., "Remote", "Hybrid", "On-site").
  - "match_quality_score": Assign a score from 1 to 3 (3 being the best match) indicating how well this company fits the user's criteria and background.
  - "ai_match_reasoning": A brief, 1-2 sentence explanation of *why* this company is a good match, referencing specific aspects of the user's background/criteria and the company's profile.
  - "generated_criteria_highlights": A JSON object highlighting specific connections between the user's free-form criteria (from 'Free-form Role Description' and 'Free-form Company Description') and this company, e.g., {"keywords_matched": ["AI", "SaaS"], "inspiration_match": "Similar to HubSpot"}. Include relevant highlights if the user provided free-form criteria.
  - "public_private": "Public" or "Private".
  // website_url: string; // Removed as per requirement

  Ensure the output is a valid JSON array of up to 30 company objects. Prioritize companies that are the strongest matches.

  Generate the JSON array:
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
          temperature: 0.5,
          responseMimeType: "application/json" // Request JSON output directly
        }
      })
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
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: response.status
      });
    }
    const data = await response.json();
    // 5. Process the Gemini response to extract the structured data (array of companies)
    let generatedCompanies;
    try {
      generatedCompanies = data?.candidates?.[0]?.content?.parts?.[0]?.text ? JSON.parse(data.candidates[0].content.parts[0].text) : data; // Assume data is already parsed JSON if responseMimeType worked
      // Basic validation: Check if it's an array and contains objects with a 'name' field
      if (!Array.isArray(generatedCompanies) || generatedCompanies.some((c)=>typeof c !== 'object' || !c.name)) {
        throw new Error("AI response is not a valid array of company objects.");
      }
      // Limit to max 30 companies if AI returned more (should be handled by prompt, but as a safeguard)
      generatedCompanies = generatedCompanies.slice(0, 30);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response data:', JSON.stringify(data)); // Log raw data for debugging
      // Adjusted error response format with CORS headers
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to process AI response structure for companies.',
        error: parseError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // 6. Insert the generated companies into the companies table
    // Ensure RLS allows inserting rows with the user_id
    // We'll insert in batches if the list is large, but for max 30, a single insert is fine.
    // Map the generated company objects to the database schema, adding user_id and timestamps.
    const companiesToInsert = generatedCompanies.map((company)=>({
        user_id: userId,
        name: company.name,
        ai_description: company.ai_description,
        industry: company.industry,
        hq_location: company.key_locations,
        estimated_headcount: company.estimated_headcount,
        estimated_revenue: company.estimated_revenue,
        wfh_policy: company.wfh_policy,
        match_quality_score: company.match_quality_score,
        ai_match_reasoning: company.ai_match_reasoning,
        generated_criteria_highlights: company.generated_criteria_highlights,
        public_private: company.public_private,
        // website_url: company.website_url, // Removed as per requirement
        user_priority: 'Maybe',
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    const { data: insertedCompanies, error: insertError } = await supabaseClient.from('companies').insert(companiesToInsert).select(); // Select the inserted rows to return their IDs
    if (insertError) {
      console.error('Error inserting generated companies:', insertError.message);
      // Adjusted error response format
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to save generated companies.',
        error: insertError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // 7. Return a success response, including the inserted companies data
    // Adjusted success response format
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Companies generated and saved successfully.',
      companies: insertedCompanies // Return the data of the newly inserted rows
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Unexpected error during company generation:', error);
    // Adjusted error response format
    return new Response(JSON.stringify({
      status: 'error',
      message: 'An unexpected error occurred during company generation.',
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