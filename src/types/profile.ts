export interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string;
  current_company?: string;
  location?: string;
  linkedin_content?: string;
  additional_details?: string;
  cv_content?: string;
  background_input?: string;
}

export interface Background {
  experience: string;
  education: string;
  expertise: string;
  achievements: string;
  overall_blurb?: string;
  combined_experience_highlights?: string[];
  combined_education_highlights?: string[];
  key_skills?: string[];
  domain_expertise?: string[];
  technical_expertise?: string[];
  value_proposition_summary?: string;
}

export interface CompanyData {
  company_id: string;
  name: string;
  industry?: string;
  hq_location?: string;
  wfh_policy?: string;
  ai_description?: string;
  match_quality_score?: number;
  ai_match_reasoning?: string;
  user_priority?: 'Top' | 'Medium' | 'Maybe';
  updated_at?: string;
  user_notes?: string;
  contacts?: {
    contact_id: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    latest_interaction?: {
      interaction_date: string;
      description: string;
    };
  }[];
  latest_update?: {
    interaction_id: string;
    description: string;
    interaction_date: string;
    interaction_type: string;
  };
  next_followup?: {
    interaction_id: string;
    description: string;
    follow_up_due_date: string;
    interaction_type: string;
  };
  // Additional properties for pipeline view
  last_interaction?: {
    interaction_date: string;
    description: string;
  };
  next_action?: {
    follow_up_due_date: string;
    description: string;
  };
}

export interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  location?: string;
  email?: string;
  linkedin_url?: string;
  user_notes?: string;
  bio_summary?: string;
  how_i_can_help?: string;
  companies?: {
    name: string;
  };
}
