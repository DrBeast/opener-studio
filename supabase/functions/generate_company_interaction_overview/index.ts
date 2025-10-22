
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Company ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, industry')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all interactions for this company
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select(`
        *,
        contacts (first_name, last_name, role)
      `)
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });

    if (interactionsError) {
      throw interactionsError;
    }

    if (!interactions || interactions.length === 0) {
      // Store the no interactions summary in the companies table
      const { error: updateError } = await supabase
        .from('companies')
        .update({ interaction_summary: "No interactions yet with this company." })
        .eq('company_id', companyId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating company summary:', updateError);
      }

      return new Response(JSON.stringify({ 
        overview: "No interactions yet with this company.",
        hasInteractions: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Updated logic: Include message_draft interactions as past interactions
    // Treat message_draft and completed interactions as "past"
    // Consider only future follow-ups as "planned"
    const pastInteractions = interactions.filter(i => 
      i.interaction_type === 'message_draft' || 
      i.follow_up_completed === true ||
      (i.follow_up_due_date && new Date(i.follow_up_due_date) < new Date())
    );
    
    const plannedInteractions = interactions.filter(i => 
      i.follow_up_completed === false && 
      i.follow_up_due_date && 
      new Date(i.follow_up_due_date) >= new Date() &&
      i.interaction_type !== 'message_draft'
    );

    // Generate AI overview with concise, note-like style
    const prompt = `Summarize interaction history with ${company.name} in brief, note-like style. Use incomplete sentences and be very concise (1-2 short phrases max):

Company: ${company.name} (${company.industry || 'Unknown industry'})

Past Interactions (${pastInteractions.length}):
${pastInteractions.map(i => 
  `• ${new Date(i.interaction_date).toLocaleDateString()}: ${i.interaction_type} - ${i.description}${i.contacts && i.contacts.first_name ? ` (with ${i.contacts.first_name} ${i.contacts.last_name || ''}${i.contacts.role ? `, ${i.contacts.role}` : ''})` : ''}`
).join('\n')}

Planned Follow-ups (${plannedInteractions.length}):
${plannedInteractions.map(i => 
  `• ${new Date(i.follow_up_due_date).toLocaleDateString()}: ${i.interaction_type} - ${i.description}${i.contacts && i.contacts.first_name ? ` (with ${i.contacts.first_name} ${i.contacts.last_name || ''}${i.contacts.role ? `, ${i.contacts.role}` : ''})` : ''}`
).join('\n')}

Write in note-like style with incomplete sentences. Examples:
- "Early stage, LinkedIn outreach to CDO"
- "Awaiting response from initial contact"
- "Follow-up due next week"
- "Active conversation with hiring manager"

Keep it very brief and actionable.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const overview = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate overview.";

    // Store the summary in the companies table
    const { error: updateError } = await supabase
      .from('companies')
      .update({ interaction_summary: overview.trim() })
      .eq('company_id', companyId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating company summary:', updateError);
    }

    return new Response(JSON.stringify({ 
      overview: overview.trim(),
      hasInteractions: true,
      interactionCount: interactions.length,
      pastCount: pastInteractions.length,
      plannedCount: plannedInteractions.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating interaction overview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
