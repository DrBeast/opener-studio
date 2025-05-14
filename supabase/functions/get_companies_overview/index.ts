
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );
    
    // Get the user ID from the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get companies for the user
    // Using direct SQL query to avoid GROUP BY issues
    const { data, error } = await supabase.from('companies')
      .select(`
        company_id,
        name,
        industry,
        hq_location,
        wfh_policy,
        ai_description,
        match_quality_score,
        ai_match_reasoning,
        user_priority,
        contacts (
          contact_id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching companies:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For each company, get the latest interaction and next follow-up
    const companies = await Promise.all(data.map(async (company) => {
      // Get the latest interaction
      const { data: latestInteraction, error: latestError } = await supabase
        .from('interactions')
        .select('interaction_id, description, interaction_date, interaction_type')
        .eq('company_id', company.company_id)
        .order('interaction_date', { ascending: false })
        .limit(1)
        .single();

      // Get the next follow-up
      const { data: nextFollowup, error: followupError } = await supabase
        .from('interactions')
        .select('interaction_id, description, follow_up_due_date, interaction_type')
        .eq('company_id', company.company_id)
        .not('follow_up_due_date', 'is', null)
        .gte('follow_up_due_date', new Date().toISOString())
        .order('follow_up_due_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Add these to the company object
      return {
        ...company,
        latest_update: latestInteraction || { 
          interaction_id: null, 
          description: null, 
          interaction_date: null, 
          interaction_type: null 
        },
        next_followup: nextFollowup || { 
          interaction_id: null, 
          description: null, 
          follow_up_due_date: null, 
          interaction_type: null 
        }
      };
    }));
    
    // Return the companies data
    return new Response(JSON.stringify({ companies }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error in get_companies_overview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
