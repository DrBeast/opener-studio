
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

    const { contactId } = await req.json();

    if (!contactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get contact and company info
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        first_name, 
        last_name, 
        role,
        companies (name, industry)
      `)
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all interactions for this contact
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', user.id)
      .order('interaction_date', { ascending: false });

    if (interactionsError) {
      throw interactionsError;
    }

    if (!interactions || interactions.length === 0) {
      return new Response(JSON.stringify({ 
        overview: "No interactions yet with this contact.",
        hasInteractions: false
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Categorize interactions
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

    console.log(`Processing ${interactions.length} total interactions for contact ${contact.first_name} ${contact.last_name}`);
    console.log(`Past interactions: ${pastInteractions.length}, Planned: ${plannedInteractions.length}`);

    // Generate AI overview
    const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const companyName = contact.companies?.name || 'Unknown Company';
    
    const prompt = `Summarize interaction history with ${contactName} at ${companyName} in brief, note-like style. Use incomplete sentences and be very concise (1-2 short phrases max):

Contact: ${contactName} (${contact.role || 'Unknown role'}) at ${companyName} (${contact.companies?.industry || 'Unknown industry'})

Past Interactions (${pastInteractions.length}):
${pastInteractions.map(i => 
  `• ${new Date(i.interaction_date).toLocaleDateString()}: ${i.interaction_type} - ${i.description}`
).join('\n')}

Planned Follow-ups (${plannedInteractions.length}):
${plannedInteractions.map(i => 
  `• ${new Date(i.follow_up_due_date).toLocaleDateString()}: ${i.interaction_type} - ${i.description}`
).join('\n')}

Write in note-like style with incomplete sentences. Examples:
- "Initial LinkedIn outreach sent"
- "Awaiting response from initial contact"
- "Follow-up due next week"
- "Active conversation, positive response"

Keep it very brief and actionable.`;

    console.log('Sending prompt to Gemini API for contact overview generation');

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
          maxOutputTokens: 150,
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const overview = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate overview.";

    console.log('Generated contact overview:', overview);

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
    console.error('Error generating contact interaction overview:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
