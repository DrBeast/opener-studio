export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          added_at: string | null
          ai_description: string | null
          ai_match_reasoning: string | null
          company_id: string
          estimated_headcount: string | null
          estimated_revenue: string | null
          generated_criteria_highlights: Json | null
          hq_location: string | null
          industry: string | null
          match_quality_score: number | null
          name: string
          public_private: string | null
          updated_at: string | null
          user_id: string | null
          user_notes: string | null
          user_priority: string | null
          website_url: string | null
          wfh_policy: string | null
        }
        Insert: {
          added_at?: string | null
          ai_description?: string | null
          ai_match_reasoning?: string | null
          company_id?: string
          estimated_headcount?: string | null
          estimated_revenue?: string | null
          generated_criteria_highlights?: Json | null
          hq_location?: string | null
          industry?: string | null
          match_quality_score?: number | null
          name: string
          public_private?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
          user_priority?: string | null
          website_url?: string | null
          wfh_policy?: string | null
        }
        Update: {
          added_at?: string | null
          ai_description?: string | null
          ai_match_reasoning?: string | null
          company_id?: string
          estimated_headcount?: string | null
          estimated_revenue?: string | null
          generated_criteria_highlights?: Json | null
          hq_location?: string | null
          industry?: string | null
          match_quality_score?: number | null
          name?: string
          public_private?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_notes?: string | null
          user_priority?: string | null
          website_url?: string | null
          wfh_policy?: string | null
        }
        Relationships: []
      }
      target_criteria: {
        Row: {
          created_at: string | null
          criteria_id: string
          free_form_role_and_company_description: string | null
          similar_companies: Json | null
          target_functions: Json | null
          target_industries: Json | null
          target_locations: Json | null
          target_public_private: Json | null
          target_sizes: Json | null
          target_wfh_preference: Json | null
          updated_at: string | null
          user_id: string
          visa_sponsorship_required: boolean | null
        }
        Insert: {
          created_at?: string | null
          criteria_id?: string
          free_form_role_and_company_description?: string | null
          similar_companies?: Json | null
          target_functions?: Json | null
          target_industries?: Json | null
          target_locations?: Json | null
          target_public_private?: Json | null
          target_sizes?: Json | null
          target_wfh_preference?: Json | null
          updated_at?: string | null
          user_id: string
          visa_sponsorship_required?: boolean | null
        }
        Update: {
          created_at?: string | null
          criteria_id?: string
          free_form_role_and_company_description?: string | null
          similar_companies?: Json | null
          target_functions?: Json | null
          target_industries?: Json | null
          target_locations?: Json | null
          target_public_private?: Json | null
          target_sizes?: Json | null
          target_wfh_preference?: Json | null
          updated_at?: string | null
          user_id?: string
          visa_sponsorship_required?: boolean | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          additional_details: string | null
          created_at: string
          current_company: string | null
          cv_content: string | null
          first_name: string | null
          job_role: string | null
          last_name: string | null
          linkedin_content: string | null
          location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_details?: string | null
          created_at?: string
          current_company?: string | null
          cv_content?: string | null
          first_name?: string | null
          job_role?: string | null
          last_name?: string | null
          linkedin_content?: string | null
          location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_details?: string | null
          created_at?: string
          current_company?: string | null
          cv_content?: string | null
          first_name?: string | null
          job_role?: string | null
          last_name?: string | null
          linkedin_content?: string | null
          location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_summaries: {
        Row: {
          achievements: string | null
          combined_education_highlights: Json | null
          combined_experience_highlights: Json | null
          domain_expertise: Json | null
          education: string | null
          experience: string | null
          expertise: string | null
          generated_at: string
          key_skills: Json | null
          overall_blurb: string | null
          summary_id: string
          technical_expertise: Json | null
          updated_at: string
          user_id: string | null
          value_proposition_summary: string | null
        }
        Insert: {
          achievements?: string | null
          combined_education_highlights?: Json | null
          combined_experience_highlights?: Json | null
          domain_expertise?: Json | null
          education?: string | null
          experience?: string | null
          expertise?: string | null
          generated_at?: string
          key_skills?: Json | null
          overall_blurb?: string | null
          summary_id?: string
          technical_expertise?: Json | null
          updated_at?: string
          user_id?: string | null
          value_proposition_summary?: string | null
        }
        Update: {
          achievements?: string | null
          combined_education_highlights?: Json | null
          combined_experience_highlights?: Json | null
          domain_expertise?: Json | null
          education?: string | null
          experience?: string | null
          expertise?: string | null
          generated_at?: string
          key_skills?: Json | null
          overall_blurb?: string | null
          summary_id?: string
          technical_expertise?: Json | null
          updated_at?: string
          user_id?: string | null
          value_proposition_summary?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
