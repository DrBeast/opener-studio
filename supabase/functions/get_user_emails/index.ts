
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response(
        JSON.stringify({ error: "userIds array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userEmails: Record<string, string> = {};

    // Fetch each user's email
    for (const userId of userIds) {
      if (userId) {
        const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!error && userData.user) {
          userEmails[userId] = userData.user.email || 'No email';
        } else {
          userEmails[userId] = 'Unknown email';
        }
      }
    }

    return new Response(
      JSON.stringify({ userEmails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch user emails' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
