import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("🚀 guest_message_selection function initialized");

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { sessionId, guestContactId, selectedVersion } = await req.json();

    if (!sessionId || !guestContactId || !selectedVersion) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: sessionId, guestContactId, or selectedVersion",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    console.log(`Processing selection for session ${sessionId}, contact ${guestContactId}, version ${selectedVersion}`);

    // Step 1: Set is_selected to false for all messages for this contact
    const { error: updateError } = await supabaseClient
      .from("guest_saved_messages")
      .update({ is_selected: false })
      .eq("session_id", sessionId)
      .eq("guest_contact_id", guestContactId);

    if (updateError) {
      console.error("Error unselecting previous messages:", updateError);
      throw updateError;
    }

    console.log(`Unselected all messages for contact ${guestContactId}`);

    // Step 2: Set is_selected to true for the selected version
    const { error: selectError } = await supabaseClient
      .from("guest_saved_messages")
      .update({ is_selected: true })
      .eq("session_id", sessionId)
      .eq("guest_contact_id", guestContactId)
      .eq("version_name", selectedVersion);

    if (selectError) {
      console.error("Error selecting the new message:", selectError);
      throw selectError;
    }

    console.log(`Successfully selected version ${selectedVersion} for contact ${guestContactId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
