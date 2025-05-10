
// Edge function for generating company recommendations
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Define types for request body
interface GenerateCompaniesRequest {
  user_id: string;
}

// Simulated company data for demonstration
const generateCompanyData = (userId: string) => {
  const companies = [
    {
      name: "TechNova Solutions",
      industry: "Software Development",
      hq_location: "San Francisco, CA",
      ai_description: "A cutting-edge software development company specializing in AI and machine learning applications.",
      match_quality_score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
      user_id: userId,
    },
    {
      name: "GreenEnergy Innovations",
      industry: "Renewable Energy",
      hq_location: "Boston, MA",
      ai_description: "Leading the transition to sustainable energy with innovative solutions and research.",
      match_quality_score: Math.floor(Math.random() * 30) + 70,
      user_id: userId,
    },
    {
      name: "HealthPlus Technologies",
      industry: "Healthcare Technology",
      hq_location: "Austin, TX",
      ai_description: "Creating next-generation healthcare technology to improve patient outcomes and healthcare delivery.",
      match_quality_score: Math.floor(Math.random() * 30) + 70,
      user_id: userId,
    },
    {
      name: "FinTech Advantage",
      industry: "Financial Technology",
      hq_location: "New York, NY",
      ai_description: "Revolutionizing financial services through cutting-edge technology and innovative approaches.",
      match_quality_score: Math.floor(Math.random() * 30) + 70,
      user_id: userId,
    },
    {
      name: "ConsultTech Partners",
      industry: "Business Consulting",
      hq_location: "Chicago, IL",
      ai_description: "Providing strategic consulting services with a technology-first approach to drive business growth.",
      match_quality_score: Math.floor(Math.random() * 30) + 70,
      user_id: userId,
    },
  ];
  
  return companies;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Parse the request to get user_id
    const { user_id } = await req.json() as GenerateCompaniesRequest;
    
    if (!user_id) {
      throw new Error('Missing user_id in request body');
    }
    
    console.log("Generating companies for user:", user_id);
    
    // Generate sample company data for demonstration
    const companies = generateCompanyData(user_id);
    
    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Companies generated successfully",
        companies: companies
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate_companies function:", error.message);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
