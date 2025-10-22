import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    industry: { type: "string" },
    hq_location: { type: "string" },
    website_url: { type: "string" },
    public_private: { type: "string" },
    estimated_revenue: { type: "string" },
    estimated_headcount: { type: "string" },
    wfh_policy: { type: "string" },
    ai_description: { type: "string" },
  },
  required: ["industry", "hq_location", "website_url", "public_private", "estimated_revenue", "estimated_headcount", "wfh_policy", "ai_description"]
};

serve(async (req) => {
  // Get dynamic CORS headers based on request origin
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();

    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured.");
    }

    const prompt = `Generate factual information for the company "${companyName}". Return a single JSON object with these exact fields: "industry", "hq_location", "website_url", "public_private", "estimated_revenue", "estimated_headcount", "wfh_policy", "ai_description". If a value is not available, return null for that field.`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("No response text from Gemini API");
    }
    const enrichedData = JSON.parse(responseText);

    const { error: updateError } = await supabaseClient
      .from("companies")
      .update({
        ...enrichedData,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[ENRICH] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
