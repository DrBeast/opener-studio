import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Create a Supabase client with the Deno runtime
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request method
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse the request body
    const { sessionId, selectedMessage, selectedVersion, guestContactId } = await req.json();

    if (!sessionId || !selectedMessage || !selectedVersion) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: sessionId, selectedMessage, selectedVersion" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Updating message selection for session: ${sessionId}, version: ${selectedVersion}`);

    // First, unselect all messages for this session
    const { error: unselectError } = await supabaseClient
      .from('guest_saved_messages')
      .update({ is_selected: false })
      .eq('session_id', sessionId);

    if (unselectError) {
      console.error("Error unselecting previous messages:", unselectError);
      return new Response(JSON.stringify({
        error: "Failed to unselect previous messages",
        message: unselectError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      console.log("Successfully unselected all previous messages");
    }

    // Then, select the most recent message of the chosen version
    // First, find the latest message of this version
    let query = supabaseClient
      .from('guest_saved_messages')
      .select('id')
      .eq('session_id', sessionId)
      .eq('version_name', selectedVersion)
      .order('created_at', { ascending: false })
      .limit(1);

    // If guestContactId is provided, filter by it for more precision
    if (guestContactId) {
      query = query.eq('guest_contact_id', guestContactId);
    }

    const { data: latestMessage, error: findError } = await query.single();

    if (findError) {
      console.error("Error finding latest message:", findError);
      return new Response(JSON.stringify({
        error: "Failed to find latest message",
        message: findError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Now select only this specific message
    const { error: updateError } = await supabaseClient
      .from('guest_saved_messages')
      .update({
        is_selected: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', latestMessage.id);

    if (updateError) {
      console.error("Error updating message selection:", updateError);
      return new Response(JSON.stringify({
        error: "Failed to update message selection",
        message: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } else {
      console.log(`Successfully selected latest message version: ${selectedVersion} (ID: ${latestMessage.id})`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Message selection updated successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in update_guest_message_selection function:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
