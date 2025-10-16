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
        JSON.stringify({
          status: "error",
          message: "userId and sessionId are required",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = {
      transferred: {
        profile: false,
        summary: false,
        contacts: 0,
        messages: 0,
      },
    };

    // ============================================================================
    // STEP 1: Fetch all guest data associated with the session ID
    // ============================================================================
    const { data: guestProfile } = await supabaseClient
      .from("guest_user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!guestProfile) {
      return new Response(
        JSON.stringify({ 
          status: "ok",
          message: "No guest profile found to link",
          transferred: { profile: false, summary: false, contacts: 0, messages: 0 }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // ============================================================================
    // STEP 2: Transfer guest user profile to user_profiles
    // ============================================================================
    const { data: newUserProfile, error: profileError } = await supabaseClient
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
      })
      .select("profile_id")
      .single();

    if (profileError) {
      console.error("[LINK] Error transferring profile:", profileError);
          } else {
      response.transferred.profile = true;
    }

    // ============================================================================
    // STEP 3: Transfer guest user summary to user_summaries if it exists
    // ============================================================================
      if (guestSummary) {
      const { error: summaryError } = await supabaseClient
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

      if (summaryError) {
        console.error("[LINK] Error transferring summary:", summaryError);
            } else {
        response.transferred.summary = true;
      }
    }

    // ============================================================================
    // STEP 4: Transfer guest contacts to contacts (with company creation & enrichment)
    // ============================================================================
    const transferredContacts: Array<{
      guest_contact_id: string;
      contact_id: string;
      company_id: string | null;
    }> = [];
    if (guestContacts && guestContacts.length > 0) {
      for (const guestContact of guestContacts) {
        let companyId = null;
        if (guestContact.current_company) {
          const { data: existingCompany } = await supabaseClient
            .from("companies")
            .select("company_id")
          .eq("user_id", userId)
            .eq("name", guestContact.current_company)
          .maybeSingle();
          
          if (existingCompany) {
            companyId = existingCompany.company_id;
          } else {
            // Create new company (initially with just name)
            const { data: newCompany, error: companyError } =
              await supabaseClient
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
            } else {
              companyId = newCompany.company_id;
              // Asynchronously invoke the enrichment function, DO NOT await it.
              supabaseClient.functions.invoke("enrich_company", {
                body: {
                  companyId: newCompany.company_id,
                  companyName: guestContact.current_company,
                },
              });
            }
          }
        }

        // Insert the new contact
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
        } else {
          transferredContacts.push({
            guest_contact_id: guestContact.id,
            contact_id: newContact.contact_id,
            company_id: companyId,
          });
        }
      }
      response.transferred.contacts = transferredContacts.length;
    }

    // ============================================================================
    // STEP 5: Transfer selected message to saved_messages
    // ============================================================================
    if (selectedMessage && transferredContacts.length > 0) {
      // Find the permanent contact_id that corresponds to the guest_contact_id
      const firstContact = transferredContacts[0];

          const { error: messageError } = await supabaseClient
        .from("saved_messages")
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
          } else {
        response.transferred.messages = 1;
        // Also create a corresponding interaction record
        const interactionDescription = `You sent a ${
          selectedMessage.medium
        } to ${firstContact.first_name || ""} ${
          firstContact.last_name || ""
        }: "${selectedMessage.message_text}"`;
        const { error: interactionError } = await supabaseClient
          .from("interactions")
          .insert({
            user_id: userId,
            contact_id: firstContact.contact_id,
            company_id: firstContact.company_id,
            interaction_type: "message_draft", // Matches the type used in the frontend
            description: interactionDescription,
            medium: selectedMessage.medium,
            message_objective: selectedMessage.message_objective,
            message_additional_context: selectedMessage.message_additional_context,
            interaction_date: new Date().toISOString(),
          });

        if (interactionError) {
          console.error(
            "[LINK] Error creating corresponding interaction:",
            interactionError
          );
        }
      }
    }

    // ============================================================================
    // STEP 6: Clean up all guest data for this session
    // ============================================================================
    const cleanupErrors: string[] = [];
    const tablesToClean = [
      "guest_saved_messages",
      "guest_user_summaries",
      "guest_contacts",
      "guest_user_profiles",
    ];

    for (const table of tablesToClean) {
      const { error } = await supabaseClient
        .from(table)
      .delete()
        .eq("session_id", sessionId);
      if (error) {
        console.error(`[LINK] Error cleaning up ${table}:`, error);
        cleanupErrors.push(table);
      }
    }

    if (cleanupErrors.length > 0) {
    }

    // ============================================================================
    // STEP 7: Return success response
    // ============================================================================
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
