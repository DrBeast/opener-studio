
import { supabase } from "@/integrations/supabase/client";
import { Background } from "@/types/profile";

// Function keywords with weighted scoring
const FUNCTION_KEYWORDS = {
  "Product Management": {
    primary: ["product manager", "product management", "pm", "product lead", "head of product", "chief product officer", "cpo", "product owner", "product strategy"],
    secondary: ["product", "roadmap", "feature", "user experience", "product development", "go-to-market", "gtm"],
    weight: 1.0
  },
  "Engineering": {
    primary: ["software engineer", "software developer", "developer", "engineer", "engineering", "technical lead", "tech lead", "cto", "chief technology officer", "full stack", "frontend", "backend", "devops"],
    secondary: ["coding", "programming", "python", "javascript", "react", "node.js", "aws", "cloud", "api", "database", "sql"],
    weight: 0.8
  },
  "Marketing": {
    primary: ["marketing manager", "marketing", "digital marketing", "content marketing", "growth marketing", "marketing lead", "cmo", "chief marketing officer"],
    secondary: ["campaigns", "branding", "seo", "sem", "social media", "content creation", "analytics", "acquisition"],
    weight: 1.0
  },
  "Sales": {
    primary: ["sales manager", "sales", "business development", "account manager", "sales rep", "sales lead", "cro", "chief revenue officer"],
    secondary: ["revenue", "pipeline", "leads", "closing", "negotiations", "crm", "prospects"],
    weight: 1.0
  },
  "Finance": {
    primary: ["finance manager", "financial analyst", "finance", "accounting", "controller", "cfo", "chief financial officer"],
    secondary: ["budgeting", "forecasting", "financial planning", "analysis", "reporting", "audit"],
    weight: 1.0
  },
  "Operations": {
    primary: ["operations manager", "operations", "ops", "business operations", "operational excellence", "coo", "chief operating officer"],
    secondary: ["process improvement", "efficiency", "logistics", "supply chain", "workflow"],
    weight: 1.0
  },
  "Data Science": {
    primary: ["data scientist", "data analyst", "data science", "machine learning engineer", "ml engineer", "ai engineer"],
    secondary: ["analytics", "machine learning", "statistical analysis", "data modeling", "python", "r", "sql"],
    weight: 1.0
  },
  "Design": {
    primary: ["designer", "ux designer", "ui designer", "product designer", "design", "creative director"],
    secondary: ["user experience", "user interface", "prototyping", "wireframes", "figma", "sketch"],
    weight: 1.0
  }
};

const scoreFunction = (text: string, functionName: string): number => {
  if (!text) return 0;
  
  const lowerText = text.toLowerCase();
  const keywords = FUNCTION_KEYWORDS[functionName as keyof typeof FUNCTION_KEYWORDS];
  let score = 0;
  
  // Primary keywords (explicit role mentions) get much higher weight
  keywords.primary.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 10; // High weight for explicit role mentions
  });
  
  // Secondary keywords get lower weight
  keywords.secondary.forEach(keyword => {
    const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
    score += matches * 1; // Lower weight for related skills
  });
  
  return score * keywords.weight;
};

const inferTargetFunction = (backgroundSummary: Background | null): string => {
  if (!backgroundSummary) return "Product Management";
  
  const functionScores: { [key: string]: number } = {};
  
  // Initialize scores
  Object.keys(FUNCTION_KEYWORDS).forEach(func => {
    functionScores[func] = 0;
  });
  
  // Score based on multiple data sources
  const textSources = [
    { text: backgroundSummary.overall_blurb, weight: 3 }, // Highest weight for overall description
    { text: JSON.stringify(backgroundSummary.key_skills || []), weight: 2 },
    { text: JSON.stringify(backgroundSummary.experience || []), weight: 2 },
    { text: JSON.stringify(backgroundSummary.expertise || []), weight: 1.5 }
  ];
  
  textSources.forEach(source => {
    if (source.text) {
      Object.keys(FUNCTION_KEYWORDS).forEach(functionName => {
        const baseScore = scoreFunction(source.text, functionName);
        functionScores[functionName] += baseScore * source.weight;
      });
    }
  });
  
  // Find the function with the highest score
  const bestFunction = Object.entries(functionScores).reduce((best, [func, score]) => {
    return score > best.score ? { function: func, score } : best;
  }, { function: "Product Management", score: 0 });
  
  console.log("Function scores:", functionScores);
  console.log("Selected function:", bestFunction.function);
  
  return bestFunction.function;
};

const inferIndustries = (backgroundSummary: Background | null): string[] => {
  if (!backgroundSummary?.overall_blurb) return ["Technology"];
  
  const blurb = backgroundSummary.overall_blurb.toLowerCase();
  
  if (blurb.includes("finance") || blurb.includes("banking") || blurb.includes("fintech")) {
    return ["Financial Services"];
  } else if (blurb.includes("healthcare") || blurb.includes("medical") || blurb.includes("biotech")) {
    return ["Healthcare"];
  } else if (blurb.includes("consulting")) {
    return ["Consulting"];
  } else if (blurb.includes("biotech") || blurb.includes("pharmaceutical")) {
    return ["Biotechnology"];
  } else if (blurb.includes("retail") || blurb.includes("ecommerce")) {
    return ["Retail"];
  } else if (blurb.includes("education") || blurb.includes("edtech")) {
    return ["Education"];
  }
  
  return ["Technology"];
};

export const createDefaultTargetCriteria = async (userId: string, backgroundSummary: Background | null) => {
  try {
    // Extract location from background or use default
    const defaultLocation = backgroundSummary?.overall_blurb?.match(/(?:based in|located in|from)\s+([^,.]+)/i)?.[1] || "United States";
    
    // Infer function with improved logic that prioritizes current role
    const defaultFunction = inferTargetFunction(backgroundSummary);
    
    // Infer industry from background
    const defaultIndustries = inferIndustries(backgroundSummary);
    
    const defaultCriteria = {
      user_id: userId,
      target_functions: [defaultFunction],
      target_locations: [defaultLocation],
      target_wfh_preference: ["Hybrid", "Remote"],
      free_form_role_and_company_description: `Looking for ${defaultFunction.toLowerCase()} opportunities in ${defaultIndustries[0].toLowerCase()} companies that value innovation and growth.`,
      target_industries: defaultIndustries,
      target_sizes: ["201-1000", "1000+"],
      target_public_private: ["Public", "Private"],
      similar_companies: [],
      visa_sponsorship_required: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('target_criteria')
      .insert(defaultCriteria)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating default target criteria:', error);
    throw error;
  }
};
