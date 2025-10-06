import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client with service role key
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, sessionId } = await req.json();

    if (!userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[LINK] Starting link process - userId: ${userId}, sessionId: ${sessionId}`);

    // ============================================================================
    // STEP 1: Fetch all guest data
    // ============================================================================
    console.log("[LINK] Step 1: Fetching guest data...");

    const { data: guestProfile, error: profileFetchError } = await supabaseClient
      .from("guest_user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (profileFetchError) {
      console.error("[LINK] Error fetching guest profile:", profileFetchError);
      throw new Error(`Failed to fetch guest profile: ${profileFetchError.message}`);
    }

    console.log(`[LINK] Guest profile query result: ${JSON.stringify(guestProfile)}`);

    // Early exit if no guest data
    if (!guestProfile) {
      console.log("[LINK] No guest profile found - nothing to link");
      console.log(`[LINK] Searched for session_id: ${sessionId}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "No guest profile found to link",
          transferred: { profile: false, summary: false, contacts: 0, messages: 0 }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[LINK] Guest profile found");

    const { data: guestSummary } = await supabaseClient
      .from("guest_user_summaries")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    const { data: guestContacts } = await supabaseClient
      .from("guest_contacts")
      .select("*")
      .eq("session_id", sessionId);

    const { data: selectedMessage } = await supabaseClient
      .from("guest_saved_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_selected", true)
      .maybeSingle();

    console.log(`[LINK] Fetched: profile=yes, summary=${!!guestSummary}, contacts=${guestContacts?.length || 0}, message=${!!selectedMessage}`);

    // ============================================================================
    // STEP 2: Transfer guest profile to user_profiles
    // ============================================================================
    console.log("[LINK] Step 2: Transferring profile...");

    const { error: profileTransferError } = await supabaseClient
      .from("user_profiles")
      .insert({
        user_id: userId,
        first_name: guestProfile.first_name,
        last_name: guestProfile.last_name,
        job_role: guestProfile.job_role,
        current_company: guestProfile.current_company,
        location: guestProfile.location,
        background_input: guestProfile.background_input,
        linkedin_content: guestProfile.linkedin_content,
        cv_content: guestProfile.cv_content,
        additional_details: guestProfile.additional_details,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileTransferError) {
      console.error("[LINK] Error transferring profile:", profileTransferError);
      throw new Error(`Failed to transfer profile: ${profileTransferError.message}`);
    }

    console.log("[LINK] Profile transferred successfully");

    // ============================================================================
    // STEP 3: Transfer guest summary to user_summaries
    // ============================================================================
    let summaryTransferred = false;

    if (guestSummary) {
      console.log("[LINK] Step 3: Transferring summary...");

      const { error: summaryTransferError } = await supabaseClient
        .from("user_summaries")
        .insert({
          user_id: userId,
          experience: guestSummary.experience,
          education: guestSummary.education,
          expertise: guestSummary.expertise,
          achievements: guestSummary.achievements,
          overall_blurb: guestSummary.overall_blurb,
          combined_experience_highlights: guestSummary.combined_experience_highlights,
          combined_education_highlights: guestSummary.combined_education_highlights,
          key_skills: guestSummary.key_skills,
          domain_expertise: guestSummary.domain_expertise,
          technical_expertise: guestSummary.technical_expertise,
          value_proposition_summary: guestSummary.value_proposition_summary,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (summaryTransferError) {
        console.error("[LINK] Error transferring summary:", summaryTransferError);
        // Non-critical - continue
      } else {
        console.log("[LINK] Summary transferred successfully");
        summaryTransferred = true;
      }
    } else {
      console.log("[LINK] Step 3: No summary to transfer");
    }

    // ============================================================================
    // STEP 4: Transfer guest contacts to contacts (with company creation)
    // ============================================================================
    console.log("[LINK] Step 4: Transferring contacts...");

    const transferredContacts: Array<{ contact_id: string; company_id: string | null }> = [];

    if (guestContacts && guestContacts.length > 0) {
      for (const guestContact of guestContacts) {
        let companyId = null;

        // Create or find company if contact has current_company
        if (guestContact.current_company) {
          console.log(`[LINK] Processing company: ${guestContact.current_company}`);

          // Check if company already exists
          const { data: existingCompany } = await supabaseClient
            .from("companies")
            .select("company_id")
            .eq("user_id", userId)
            .eq("name", guestContact.current_company)
            .maybeSingle();

          if (existingCompany) {
            companyId = existingCompany.company_id;
            console.log(`[LINK] Using existing company (ID: ${companyId})`);
          } else {
            // Create new company
            const { data: newCompany, error: companyError } = await supabaseClient
              .from("companies")
              .insert({
                user_id: userId,
                name: guestContact.current_company,
                status: "active",
                added_at: new Date().toISOString(),
              })
              .select("company_id")
              .single();

            if (companyError) {
              console.error(`[LINK] Error creating company:`, companyError);
              // Continue without company
            } else {
              companyId = newCompany.company_id;
              console.log(`[LINK] Created company (ID: ${companyId})`);
            }
          }
        }

        // Transfer contact
        const { data: newContact, error: contactError } = await supabaseClient
          .from("contacts")
          .insert({
            user_id: userId,
            company_id: companyId,
            first_name: guestContact.first_name,
            last_name: guestContact.last_name,
            role: guestContact.role,
            location: guestContact.location,
            bio_summary: guestContact.bio_summary,
            how_i_can_help: guestContact.how_i_can_help,
            linkedin_bio: guestContact.linkedin_bio,
            added_at: new Date().toISOString(),
          })
          .select("contact_id")
          .single();

        if (contactError) {
          console.error(`[LINK] Error transferring contact:`, contactError);
          // Non-critical - continue
        } else {
          transferredContacts.push({ contact_id: newContact.contact_id, company_id: companyId });
          console.log(`[LINK] Contact transferred (ID: ${newContact.contact_id})`);
        }
      }
    } else {
      console.log("[LINK] No contacts to transfer");
    }

    // ============================================================================
    // STEP 5: Transfer selected message to saved_message_versions
    // ============================================================================
    let messageTransferred = false;

    if (selectedMessage && transferredContacts.length > 0) {
      console.log("[LINK] Step 5: Transferring selected message...");

      const firstContact = transferredContacts[0];

      const { error: messageError } = await supabaseClient
        .from("saved_message_versions")
        .insert({
          user_id: userId,
          contact_id: firstContact.contact_id,
          company_id: firstContact.company_id,
          message_text: selectedMessage.message_text,
          version_name: selectedMessage.version_name,
          medium: selectedMessage.medium,
          message_objective: selectedMessage.message_objective,
          message_additional_context: selectedMessage.message_additional_context,
          created_at: new Date().toISOString(),
        });

      if (messageError) {
        console.error("[LINK] Error transferring message:", messageError);
        // Non-critical - continue
      } else {
        console.log("[LINK] Message transferred successfully");
        messageTransferred = true;
      }
    } else {
      console.log("[LINK] Step 5: No message to transfer or no contacts");
    }

    // ============================================================================
    // STEP 6: Cleanup - Delete all guest data
    // ============================================================================
    console.log("[LINK] Step 6: Cleaning up guest data...");

    const cleanupErrors = [];

    const { error: profileCleanupError } = await supabaseClient
      .from("guest_user_profiles")
      .delete()
      .eq("session_id", sessionId);

    if (profileCleanupError) {
      console.error("[LINK] Error cleaning up guest profile:", profileCleanupError);
      cleanupErrors.push("profile");
    }

    const { error: summaryCleanupError } = await supabaseClient
      .from("guest_user_summaries")
      .delete()
      .eq("session_id", sessionId);

    if (summaryCleanupError) {
      console.error("[LINK] Error cleaning up guest summary:", summaryCleanupError);
      cleanupErrors.push("summary");
    }

    const { error: contactsCleanupError } = await supabaseClient
      .from("guest_contacts")
      .delete()
      .eq("session_id", sessionId);

    if (contactsCleanupError) {
      console.error("[LINK] Error cleaning up guest contacts:", contactsCleanupError);
      cleanupErrors.push("contacts");
    }

    const { error: messagesCleanupError } = await supabaseClient
      .from("guest_saved_messages")
      .delete()
      .eq("session_id", sessionId);

    if (messagesCleanupError) {
      console.error("[LINK] Error cleaning up guest messages:", messagesCleanupError);
      cleanupErrors.push("messages");
    }

    if (cleanupErrors.length === 0) {
      console.log("[LINK] All guest data cleaned up successfully");
    } else {
      console.log(`[LINK] Cleanup completed with warnings: ${cleanupErrors.join(", ")}`);
    }

    // ============================================================================
    // STEP 7: Return success response
    // ============================================================================
    const response = {
      success: true,
      message: "Guest profile successfully linked to user account",
      transferred: {
        profile: true,
        summary: summaryTransferred,
        contacts: transferredContacts.length,
        messages: messageTransferred ? 1 : 0,
      },
      cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : undefined,
    };

    console.log(`[LINK] Complete - transferred: ${JSON.stringify(response.transferred)}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(`[LINK] Fatal error:`, error);

    return new Response(
      JSON.stringify({
        error: "Failed to link guest profile",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
