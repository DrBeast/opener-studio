-- Update get_companies_overview function to include last_interaction_date
-- First drop the existing function since we're changing the return type
DROP FUNCTION IF EXISTS public.get_companies_overview(uuid);

CREATE OR REPLACE FUNCTION public.get_companies_overview(user_id_param uuid)
RETURNS TABLE(company_id uuid, name character varying, industry character varying, ai_description text, hq_location character varying, wfh_policy character varying, match_quality_score integer, ai_match_reasoning text, user_priority character varying, interaction_summary text, last_interaction_date timestamp with time zone, latest_update jsonb, next_followup jsonb, contacts jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
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
