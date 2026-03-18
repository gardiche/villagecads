-- Fixer le warning de sécurité en ajoutant search_path
DROP FUNCTION IF EXISTS clean_why_you_scores();

CREATE OR REPLACE FUNCTION clean_why_you_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_record RECORD;
  cleaned_reasons jsonb;
  reason text;
  cleaned_reason text;
BEGIN
  FOR project_record IN 
    SELECT id, why_you FROM projects_feed WHERE jsonb_array_length(why_you) > 0
  LOOP
    cleaned_reasons := '[]'::jsonb;
    
    FOR reason IN 
      SELECT jsonb_array_elements_text(project_record.why_you)
    LOOP
      cleaned_reason := reason;
      cleaned_reason := regexp_replace(cleaned_reason, '\s*\(?\d+\.?\d*\s*%\)?', '', 'g');
      cleaned_reason := regexp_replace(cleaned_reason, '\s*\(?\d+\.?\d*\s*/\s*\d+\.?\d*\)?', '', 'g');
      cleaned_reason := regexp_replace(cleaned_reason, 'score\s+(de\s+)?\d+\.?\d*', '', 'gi');
      cleaned_reason := regexp_replace(cleaned_reason, '\d+\.?\d*\+?\s*ans?', '', 'gi');
      cleaned_reason := regexp_replace(cleaned_reason, '\d+-\d+\s*ans?', '', 'gi');
      cleaned_reason := regexp_replace(cleaned_reason, '\s+', ' ', 'g');
      cleaned_reason := regexp_replace(cleaned_reason, '\(\s*\)', '', 'g');
      cleaned_reason := trim(cleaned_reason);
      
      IF length(cleaned_reason) > 0 THEN
        cleaned_reasons := cleaned_reasons || to_jsonb(cleaned_reason);
      END IF;
    END LOOP;
    
    UPDATE projects_feed 
    SET why_you = cleaned_reasons 
    WHERE id = project_record.id;
  END LOOP;
END;
$$;