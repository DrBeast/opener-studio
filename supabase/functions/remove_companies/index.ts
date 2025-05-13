
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
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
    
    // Get the request body
    const { companyIds } = await req.json();
    
    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Company IDs array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Update companies to be blacklisted
    const { data: updatedCompanies, error: updateError } = await supabase
      .from('companies')
      .update({ 
        is_blacklisted: true,
        updated_at: new Date().toISOString()
      })
      .in('company_id', companyIds)
      .eq('user_id', user.id)
      .select();
    
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Find all interactions for these companies
    const { data: interactionsToDelete, error: findError } = await supabase
      .from('interactions')
      .select('interaction_id')
      .in('company_id', companyIds)
      .eq('user_id', user.id);
    
    if (findError) {
      console.error('Error finding interactions:', findError);
    } else if (interactionsToDelete && interactionsToDelete.length > 0) {
      // Delete interactions
      const interactionIds = interactionsToDelete.map(i => i.interaction_id);
      
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .in('interaction_id', interactionIds);
      
      if (deleteError) {
        console.error('Error deleting interactions:', deleteError);
      }
    }
    
    return new Response(JSON.stringify({ 
      message: `${updatedCompanies?.length || 0} companies blacklisted successfully`,
      blacklistedCompanyIds: companyIds
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
