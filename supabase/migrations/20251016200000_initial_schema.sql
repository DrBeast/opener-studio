

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cleanup_expired_guest_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM guest_contacts WHERE expires_at < NOW();
  DELETE FROM guest_message_sessions WHERE expires_at < NOW();
  DELETE FROM guest_generated_messages WHERE expires_at < NOW();
  DELETE FROM guest_user_profiles WHERE expires_at < NOW();
  DELETE FROM guest_user_summaries WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_guest_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_guest_sessions"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM guest_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_guest_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_companies_overview"("user_id_param" "uuid") RETURNS TABLE("company_id" "uuid", "name" character varying, "industry" character varying, "ai_description" "text", "hq_location" character varying, "wfh_policy" character varying, "match_quality_score" integer, "ai_match_reasoning" "text", "user_priority" character varying, "interaction_summary" "text", "last_interaction_date" timestamp with time zone, "latest_update" "jsonb", "next_followup" "jsonb", "contacts" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH company_data AS (
    SELECT 
      c.company_id,
      c.name,
      c.industry,
      c.ai_description,
      c.hq_location,
      c.wfh_policy,
      c.match_quality_score,
      c.ai_match_reasoning,
      c.user_priority,
      c.interaction_summary,
      c.last_interaction_date
    FROM 
      companies c
    WHERE 
      c.user_id = user_id_param
      AND (c.is_blacklisted = false OR c.is_blacklisted IS NULL)
  ),
  
  latest_interactions AS (
    SELECT DISTINCT ON (i.company_id)
      i.company_id,
      jsonb_build_object(
        'interaction_id', i.interaction_id,
        'description', i.description,
        'interaction_date', i.interaction_date,
        'interaction_type', i.interaction_type
      ) AS interaction_data
    FROM 
      interactions i
    WHERE 
      i.user_id = user_id_param
      AND i.follow_up_completed = true
    ORDER BY 
      i.company_id, i.interaction_date DESC
  ),
  
  next_followups AS (
    SELECT DISTINCT ON (i.company_id)
      i.company_id,
      jsonb_build_object(
        'interaction_id', i.interaction_id,
        'description', i.description,
        'follow_up_due_date', i.follow_up_due_date,
        'interaction_type', i.interaction_type
      ) AS followup_data
    FROM 
      interactions i
    WHERE 
      i.user_id = user_id_param
      AND i.follow_up_completed = false
      AND i.follow_up_due_date IS NOT NULL
    ORDER BY 
      i.company_id, i.follow_up_due_date ASC
  ),
  
  company_contacts AS (
    SELECT 
      ct.company_id,
      jsonb_agg(
        jsonb_build_object(
          'contact_id', ct.contact_id,
          'first_name', ct.first_name,
          'last_name', ct.last_name,
          'role', ct.role,
          'latest_interaction_date', COALESCE(
            (SELECT MAX(i.interaction_date)
             FROM interactions i
             WHERE i.contact_id = ct.contact_id), 
            ct.added_at
          )
        ) ORDER BY COALESCE(
          (SELECT MAX(i.interaction_date)
           FROM interactions i
           WHERE i.contact_id = ct.contact_id), 
          ct.added_at
        ) DESC
      ) FILTER (WHERE ct.contact_id IS NOT NULL) AS contact_list
    FROM 
      contacts ct
    WHERE 
      ct.user_id = user_id_param
    GROUP BY 
      ct.company_id
  )
  
  SELECT
    cd.company_id,
    cd.name,
    cd.industry,
    cd.ai_description,
    cd.hq_location,
    cd.wfh_policy,
    cd.match_quality_score,
    cd.ai_match_reasoning,
    cd.user_priority,
    cd.interaction_summary,
    cd.last_interaction_date,
    COALESCE(li.interaction_data, '{}'::jsonb) AS latest_update,
    COALESCE(nf.followup_data, '{}'::jsonb) AS next_followup,
    COALESCE(cc.contact_list, '[]'::jsonb) AS contacts
  FROM 
    company_data cd
  LEFT JOIN 
    latest_interactions li ON cd.company_id = li.company_id
  LEFT JOIN 
    next_followups nf ON cd.company_id = nf.company_id
  LEFT JOIN 
    company_contacts cc ON cd.company_id = cc.company_id
  ORDER BY 
    CASE 
      WHEN cd.user_priority = 'Top' THEN 1
      WHEN cd.user_priority = 'Medium' THEN 2
      ELSE 3
    END,
    cd.match_quality_score DESC NULLS LAST,
    cd.name;
END;
$$;


ALTER FUNCTION "public"."get_companies_overview"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_uploaded_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.uploaded_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_uploaded_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_feedback_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_feedback_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_interaction_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- For company interactions
  IF NEW.company_id IS NOT NULL THEN
    UPDATE companies 
    SET last_interaction_date = GREATEST(
      COALESCE(last_interaction_date, '1970-01-01'::timestamp),
      NEW.interaction_date,
      COALESCE(NEW.follow_up_due_date, '1970-01-01'::timestamp)
    )
    WHERE company_id = NEW.company_id;
  END IF;
  
  -- For contact interactions
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts 
    SET last_interaction_date = GREATEST(
      COALESCE(last_interaction_date, '1970-01-01'::timestamp),
      NEW.interaction_date,
      COALESCE(NEW.follow_up_due_date, '1970-01-01'::timestamp)
    )
    WHERE contact_id = NEW.contact_id;
  END IF;
  
  -- For DELETE operations, recalculate from remaining interactions
  IF TG_OP = 'DELETE' THEN
    IF OLD.company_id IS NOT NULL THEN
      UPDATE companies 
      SET last_interaction_date = (
        SELECT GREATEST(
          MAX(interaction_date),
          MAX(follow_up_due_date)
        )
        FROM interactions 
        WHERE company_id = OLD.company_id
      )
      WHERE company_id = OLD.company_id;
    END IF;
    
    IF OLD.contact_id IS NOT NULL THEN
      UPDATE contacts 
      SET last_interaction_date = (
        SELECT GREATEST(
          MAX(interaction_date),
          MAX(follow_up_due_date)
        )
        FROM interactions 
        WHERE contact_id = OLD.contact_id
      )
      WHERE contact_id = OLD.contact_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_last_interaction_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "company_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" character varying NOT NULL,
    "industry" character varying,
    "hq_location" character varying,
    "wfh_policy" character varying,
    "ai_description" "text",
    "ai_match_reasoning" "text",
    "user_priority" character varying DEFAULT 'Maybe'::character varying,
    "is_blacklisted" boolean DEFAULT false,
    "match_quality_score" integer,
    "interaction_summary" "text",
    "user_notes" "text",
    "estimated_headcount" character varying,
    "estimated_revenue" character varying,
    "website_url" character varying,
    "public_private" character varying,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "generated_criteria_highlights" "jsonb",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "last_interaction_date" timestamp with time zone,
    CONSTRAINT "companies_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "contact_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "first_name" character varying,
    "last_name" character varying,
    "role" character varying,
    "location" character varying,
    "user_notes" "text",
    "bio_summary" "text",
    "how_i_can_help" "text",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "recent_activity_summary" "text",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "linkedin_bio" "text",
    "interaction_summary" "text",
    "last_interaction_date" timestamp with time zone,
    CONSTRAINT "contacts_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('inactive'::character varying)::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guest_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "linkedin_bio" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "role" "text",
    "current_company" "text",
    "location" "text",
    "bio_summary" "text",
    "how_i_can_help" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval)
);


ALTER TABLE "public"."guest_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guest_saved_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "guest_contact_id" "uuid",
    "user_profile_id" "uuid",
    "message_text" "text" NOT NULL,
    "version_name" "text" NOT NULL,
    "medium" "text" NOT NULL,
    "message_objective" "text" NOT NULL,
    "message_additional_context" "text",
    "is_selected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "company_id" "uuid"
);


ALTER TABLE "public"."guest_saved_messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."guest_saved_messages"."company_id" IS 'Company ID associated with the message. NULL during guest experience, populated during user registration linking.';



CREATE TABLE IF NOT EXISTS "public"."guest_user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "background_input" "text",
    "linkedin_content" "text",
    "cv_content" "text",
    "additional_details" "text",
    "first_name" "text",
    "last_name" "text",
    "job_role" "text",
    "current_company" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval)
);


ALTER TABLE "public"."guest_user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."guest_user_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "experience" "text",
    "education" "text",
    "expertise" "text",
    "achievements" "text",
    "overall_blurb" "text",
    "value_proposition_summary" "text",
    "combined_experience_highlights" "jsonb",
    "combined_education_highlights" "jsonb",
    "key_skills" "jsonb",
    "domain_expertise" "jsonb",
    "technical_expertise" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval)
);


ALTER TABLE "public"."guest_user_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "interaction_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "contact_id" "uuid",
    "description" "text",
    "interaction_date" timestamp with time zone DEFAULT "now"(),
    "interaction_type" character varying NOT NULL,
    "follow_up_due_date" "date",
    "follow_up_completed" boolean DEFAULT false,
    "follow_up_completed_date" timestamp with time zone,
    "medium" character varying,
    "message_objective" "text",
    "message_additional_context" "text",
    "is_ai_suggestion" boolean DEFAULT false,
    "message_version_id" "uuid"
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_messages" (
    "message_version_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "company_id" "uuid",
    "contact_id" "uuid",
    "message_text" "text" NOT NULL,
    "version_name" character varying NOT NULL,
    "medium" character varying,
    "message_objective" "text",
    "message_additional_context" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "feedback_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "view_name" "text" NOT NULL,
    "feedback_text" "text",
    "session_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "job_role" "text",
    "current_company" "text",
    "location" "text",
    "linkedin_content" "text",
    "additional_details" "text",
    "cv_content" "text",
    "email" "text",
    "is_temporary" boolean DEFAULT false,
    "temp_created_at" timestamp with time zone,
    "session_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "background_input" "text"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_summaries" (
    "summary_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "technical_expertise" "jsonb",
    "experience" "text",
    "education" "text",
    "expertise" "text",
    "achievements" "text",
    "session_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "overall_blurb" "text",
    "value_proposition_summary" "text",
    "combined_experience_highlights" "jsonb",
    "combined_education_highlights" "jsonb",
    "key_skills" "jsonb",
    "domain_expertise" "jsonb"
);


ALTER TABLE "public"."user_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


ALTER TABLE "public"."waitlist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitlist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("contact_id");



ALTER TABLE ONLY "public"."guest_contacts"
    ADD CONSTRAINT "guest_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_contacts"
    ADD CONSTRAINT "guest_contacts_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."guest_saved_messages"
    ADD CONSTRAINT "guest_saved_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_user_profiles"
    ADD CONSTRAINT "guest_user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_user_profiles"
    ADD CONSTRAINT "guest_user_profiles_session_id_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."guest_user_summaries"
    ADD CONSTRAINT "guest_user_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guest_user_summaries"
    ADD CONSTRAINT "guest_user_summaries_session_id_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("interaction_id");



ALTER TABLE ONLY "public"."saved_messages"
    ADD CONSTRAINT "saved_message_versions_pkey" PRIMARY KEY ("message_version_id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("feedback_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_session_id_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."user_summaries"
    ADD CONSTRAINT "user_summaries_pkey" PRIMARY KEY ("summary_id");



ALTER TABLE ONLY "public"."user_summaries"
    ADD CONSTRAINT "user_summaries_session_id_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."user_summaries"
    ADD CONSTRAINT "user_summaries_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_companies_is_blacklisted" ON "public"."companies" USING "btree" ("is_blacklisted");



CREATE INDEX "idx_companies_last_interaction_date" ON "public"."companies" USING "btree" ("last_interaction_date");



CREATE INDEX "idx_companies_match_quality_score" ON "public"."companies" USING "btree" ("match_quality_score");



CREATE INDEX "idx_companies_user_id" ON "public"."companies" USING "btree" ("user_id");



CREATE INDEX "idx_companies_user_priority" ON "public"."companies" USING "btree" ("user_priority");



CREATE INDEX "idx_contacts_company_id" ON "public"."contacts" USING "btree" ("company_id");



CREATE INDEX "idx_contacts_interaction_summary" ON "public"."contacts" USING "btree" ("interaction_summary");



CREATE INDEX "idx_contacts_last_interaction_date" ON "public"."contacts" USING "btree" ("last_interaction_date");



CREATE INDEX "idx_contacts_user_id" ON "public"."contacts" USING "btree" ("user_id");



CREATE INDEX "idx_guest_contacts_session_id" ON "public"."guest_contacts" USING "btree" ("session_id");



CREATE INDEX "idx_guest_saved_messages_company_id" ON "public"."guest_saved_messages" USING "btree" ("company_id");



CREATE INDEX "idx_guest_saved_messages_selected" ON "public"."guest_saved_messages" USING "btree" ("session_id", "is_selected") WHERE ("is_selected" = true);



CREATE INDEX "idx_guest_saved_messages_session_id" ON "public"."guest_saved_messages" USING "btree" ("session_id");



CREATE INDEX "idx_guest_user_profiles_session_id" ON "public"."guest_user_profiles" USING "btree" ("session_id");



CREATE INDEX "idx_guest_user_summaries_session_id" ON "public"."guest_user_summaries" USING "btree" ("session_id");



CREATE INDEX "idx_interactions_company_id" ON "public"."interactions" USING "btree" ("company_id");



CREATE INDEX "idx_interactions_contact_id" ON "public"."interactions" USING "btree" ("contact_id");



CREATE INDEX "idx_interactions_follow_up_completed" ON "public"."interactions" USING "btree" ("follow_up_completed");



CREATE INDEX "idx_interactions_follow_up_due_date" ON "public"."interactions" USING "btree" ("follow_up_due_date");



CREATE INDEX "idx_interactions_user_id" ON "public"."interactions" USING "btree" ("user_id");



CREATE INDEX "idx_saved_message_versions_company_id" ON "public"."saved_messages" USING "btree" ("company_id");



CREATE INDEX "idx_saved_message_versions_contact_id" ON "public"."saved_messages" USING "btree" ("contact_id");



CREATE INDEX "idx_saved_message_versions_user_id" ON "public"."saved_messages" USING "btree" ("user_id");



CREATE INDEX "idx_user_feedback_session_id" ON "public"."user_feedback" USING "btree" ("session_id");



CREATE INDEX "idx_user_feedback_user_id" ON "public"."user_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_is_temporary" ON "public"."user_profiles" USING "btree" ("is_temporary");



CREATE INDEX "idx_user_profiles_session_id" ON "public"."user_profiles" USING "btree" ("session_id");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_summaries_session_id" ON "public"."user_summaries" USING "btree" ("session_id");



CREATE INDEX "idx_user_summaries_user_id" ON "public"."user_summaries" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_saved_message_versions_updated_at" BEFORE UPDATE ON "public"."saved_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_user_feedback_updated_at" BEFORE UPDATE ON "public"."user_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_feedback_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_user_summaries_updated_at" BEFORE UPDATE ON "public"."user_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_guest_saved_messages_updated_at" BEFORE UPDATE ON "public"."guest_saved_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_last_interaction_date_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."interactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_interaction_date"();



CREATE OR REPLACE TRIGGER "update_user_feedback_updated_at" BEFORE UPDATE ON "public"."user_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_feedback_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_summaries_updated_at" BEFORE UPDATE ON "public"."user_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id");



ALTER TABLE ONLY "public"."guest_saved_messages"
    ADD CONSTRAINT "guest_saved_messages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."guest_saved_messages"
    ADD CONSTRAINT "guest_saved_messages_guest_contact_id_fkey" FOREIGN KEY ("guest_contact_id") REFERENCES "public"."guest_contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."guest_saved_messages"
    ADD CONSTRAINT "guest_saved_messages_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("profile_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_message_version_id_fkey" FOREIGN KEY ("message_version_id") REFERENCES "public"."saved_messages"("message_version_id");



ALTER TABLE ONLY "public"."saved_messages"
    ADD CONSTRAINT "saved_message_versions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id");



ALTER TABLE ONLY "public"."saved_messages"
    ADD CONSTRAINT "saved_message_versions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("contact_id");



CREATE POLICY "Allow all operations for guest users" ON "public"."guest_saved_messages" USING (true);



CREATE POLICY "Allow all operations on guest_contacts" ON "public"."guest_contacts" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on guest_user_profiles" ON "public"."guest_user_profiles" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on guest_user_summaries" ON "public"."guest_user_summaries" USING (true) WITH CHECK (true);



CREATE POLICY "Public can insert their own email" ON "public"."waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete their own companies" ON "public"."companies" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own contacts" ON "public"."contacts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own feedback" ON "public"."user_feedback" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own interactions" ON "public"."interactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."user_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own saved messages" ON "public"."saved_messages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own summaries" ON "public"."user_summaries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own companies" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own contacts" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own feedback" ON "public"."user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own interactions" ON "public"."interactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own saved messages" ON "public"."saved_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own summaries" ON "public"."user_summaries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own companies" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own contacts" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own feedback" ON "public"."user_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own interactions" ON "public"."interactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own saved messages" ON "public"."saved_messages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own summaries" ON "public"."user_summaries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own companies" ON "public"."companies" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own contacts" ON "public"."contacts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own feedback" ON "public"."user_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own interactions" ON "public"."interactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own saved messages" ON "public"."saved_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own summaries" ON "public"."user_summaries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guest_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guest_saved_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guest_user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guest_user_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_expired_guest_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_guest_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_guest_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_guest_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_guest_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_guest_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_companies_overview"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_companies_overview"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_companies_overview"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_uploaded_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_uploaded_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_uploaded_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_feedback_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_feedback_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_feedback_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_interaction_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_interaction_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_interaction_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."guest_contacts" TO "anon";
GRANT ALL ON TABLE "public"."guest_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."guest_saved_messages" TO "anon";
GRANT ALL ON TABLE "public"."guest_saved_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_saved_messages" TO "service_role";



GRANT ALL ON TABLE "public"."guest_user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."guest_user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."guest_user_summaries" TO "anon";
GRANT ALL ON TABLE "public"."guest_user_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."guest_user_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."saved_messages" TO "anon";
GRANT ALL ON TABLE "public"."saved_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_messages" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_summaries" TO "anon";
GRANT ALL ON TABLE "public"."user_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."user_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."waitlist_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
