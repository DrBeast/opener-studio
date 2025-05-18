
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
