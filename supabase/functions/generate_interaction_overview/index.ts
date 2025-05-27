
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
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
      return new Response(JSON.stringify({ 
        overview: "No interactions yet with this company.",
        hasInteractions: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Separate past and planned interactions
    const pastInteractions = interactions.filter(i => i.follow_up_completed === true);
    const plannedInteractions = interactions.filter(i => 
      i.follow_up_completed === false && i.follow_up_due_date && new Date(i.follow_up_due_date) >= new Date()
    );

    // Prepare data for AI
    const interactionSummary = {
      companyName: company.name,
      industry: company.industry,
      totalInteractions: interactions.length,
      pastInteractions: pastInteractions.map(i => ({
        date: i.interaction_date,
        type: i.interaction_type,
        description: i.description,
        contact: i.contacts ? `${i.contacts.first_name || ''} ${i.contacts.last_name || ''}`.trim() : 'Company-level',
        contactRole: i.contacts?.role || null
      })),
      plannedInteractions: plannedInteractions.map(i => ({
        dueDate: i.follow_up_due_date,
        type: i.interaction_type,
        description: i.description,
        contact: i.contacts ? `${i.contacts.first_name || ''} ${i.contacts.last_name || ''}`.trim() : 'Company-level',
        contactRole: i.contacts?.role || null
      }))
    };

    // Generate AI overview
    const prompt = `Analyze the following interaction history and provide a concise overview (2-3 sentences max) of the relationship status and next steps with ${company.name}:

Company: ${company.name} (${company.industry || 'Unknown industry'})

Past Interactions (${pastInteractions.length}):
${pastInteractions.map(i => 
  `• ${new Date(i.date).toLocaleDateString()}: ${i.type} - ${i.description}${i.contact && i.contact !== 'Company-level' ? ` (with ${i.contact}${i.contactRole ? `, ${i.contactRole}` : ''})` : ''}`
).join('\n')}

Planned Follow-ups (${plannedInteractions.length}):
${plannedInteractions.map(i => 
  `• ${new Date(i.dueDate).toLocaleDateString()}: ${i.type} - ${i.description}${i.contact && i.contact !== 'Company-level' ? ` (with ${i.contact}${i.contactRole ? `, ${i.contactRole}` : ''})` : ''}`
).join('\n')}

Provide a brief, professional summary focusing on:
1. Current relationship status/momentum
2. Key contacts engaged
3. Next logical steps or follow-ups

Keep it concise and actionable.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
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
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const overview = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate overview.";

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
