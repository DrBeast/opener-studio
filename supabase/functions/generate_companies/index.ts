
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

serve(async (req) => {
  // --- CORS Handling ---
  // This allows your frontend (on a different domain/port) to call this function
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  console.log("Generate companies function started");
  
  // Create a Supabase client with the logged-in user's Auth token
  // This is the correct way to run the function *as the authenticated user* subject to RLS
  const authHeader = req.headers.get('Authorization');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '', 
    Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
    {
      global: {
        headers: {
          Authorization: authHeader ?? ''
        }
      }
    }
  );

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
  console.log("Authenticated user ID:", userId);

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

  try {
    // 1. Fetch the user's overall processed background summary from the user_summaries table
    const { data: userSummaryData, error: fetchSummaryError } = await supabaseClient
      .from('user_summaries')
      .select('*') // Fetch all columns from the user_summaries row
      .eq('user_id', userId)
      .maybeSingle(); // Expecting one summary row per user
      
    if (fetchSummaryError) {
      console.error('Error fetching user summary:', fetchSummaryError.message);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to fetch user background summary.',
        error: fetchSummaryError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
    // Clean fallback for missing user summary
    const userSummary = userSummaryData || { 
      overall_blurb: "Professional seeking new opportunities",
      key_skills: [],
      technical_expertise: [],
      domain_expertise: []
    };
    
    console.log("Fetched user summary");

    // 2. Fetch the user's job target criteria from the target_criteria table
    // First clean up any duplicates
    const { data: criteriaArray, error: cleanupError } = await supabaseClient
      .from('target_criteria')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
      
    if (cleanupError) {
      console.error('Error fetching target criteria:', cleanupError.message);
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Failed to fetch user target criteria.',
        error: cleanupError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
    // Check if we have any criteria
    if (!criteriaArray || criteriaArray.length === 0) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'No target criteria found. Please set your job search criteria first.',
        error: 'Missing target criteria'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    
    // Use the most recent criteria
    const targetCriteria = criteriaArray[0];
    console.log("Found target criteria");

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
    Technical Expertise: ${userSummary.technical_expertise ? JSON.stringify(userSummary.technical_expertise) : 'N/A'}
    Value Proposition Summary: ${userSummary.value_proposition_summary ?? 'N/A'}

    User Job Target Criteria:
    Target Functions: ${targetCriteria.target_functions ? JSON.stringify(targetCriteria.target_functions) : 'Any'}
    Target Locations: ${targetCriteria.target_locations ? JSON.stringify(targetCriteria.target_locations) : 'Any'}
    Target WFH Preference: ${targetCriteria.target_wfh_preference ? JSON.stringify(targetCriteria.target_wfh_preference) : 'Any'}
    Free-form Role And Company Description: ${targetCriteria.free_form_role_and_company_description ?? 'None provided'}
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

    Ensure the output is a valid JSON array of up to 30 company objects. Prioritize companies that are the strongest matches.

    Generate the JSON array:
    `;

    console.log("Making API call to Gemini");
    // 4. Make the call to the Gemini API
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: "application/json" // Request JSON output directly
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

    console.log("Received response from Gemini");
    const data = await response.json();
    
    // 5. Process the Gemini response to extract the structured data (array of companies)
    let generatedCompanies;
    try {
      // Try to parse the response as JSON
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Raw response text:", responseText.substring(0, 100) + "...");
      
      if (!responseText) {
        throw new Error("Empty response from AI service");
      }
      
      // Attempt to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedCompanies = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array is found, try parsing the entire response
        generatedCompanies = JSON.parse(responseText);
      }
      
      // Basic validation: Check if it's an array and contains objects with a 'name' field
      if (!Array.isArray(generatedCompanies) || generatedCompanies.some((c) => typeof c !== 'object' || !c.name)) {
        throw new Error("AI response is not a valid array of company objects.");
      }
      
      // Limit to max 30 companies if AI returned more (should be handled by prompt, but as a safeguard)
      generatedCompanies = generatedCompanies.slice(0, 30);
      console.log(`Successfully parsed ${generatedCompanies.length} companies from response`);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw AI response data:', JSON.stringify(data));
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

    console.log("Preparing to insert companies into database");
    // 6. Insert the generated companies into the companies table
    // Map the generated company objects to the database schema, adding user_id and timestamps
    const companiesToInsert = generatedCompanies.map((company) => {
      // Handle key_locations field which might be an array or string
      let hq_location = company.key_locations;
      if (Array.isArray(hq_location)) {
        hq_location = hq_location.join(', ');
      } else if (typeof hq_location !== 'string') {
        hq_location = String(hq_location || '');
      }
      
      return {
        user_id: userId,
        name: company.name,
        ai_description: company.ai_description,
        industry: company.industry,
        hq_location: hq_location,
        estimated_headcount: company.estimated_headcount,
        estimated_revenue: company.estimated_revenue,
        wfh_policy: company.wfh_policy,
        match_quality_score: company.match_quality_score,
        ai_match_reasoning: company.ai_match_reasoning,
        generated_criteria_highlights: company.generated_criteria_highlights,
        public_private: company.public_private,
        user_priority: company.match_quality_score === 3 ? 'Top' : 
                      company.match_quality_score === 2 ? 'Medium' : 'Maybe',
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    console.log(`Inserting ${companiesToInsert.length} companies into database`);
    const { data: insertedCompanies, error: insertError } = await supabaseClient
      .from('companies')
      .insert(companiesToInsert)
      .select('company_id, name'); // Select basic info to confirm insertion
      
    if (insertError) {
      console.error('Error inserting generated companies:', insertError.message);
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

    console.log(`Successfully inserted ${insertedCompanies.length} companies`);
    // 7. Return a success response, including the inserted companies data
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
