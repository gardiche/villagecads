-- Fonction de nettoyage des scores dans les why_you
CREATE OR REPLACE FUNCTION clean_why_you_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_record RECORD;
  cleaned_reasons jsonb;
  reason text;
  cleaned_reason text;
BEGIN
  -- Pour chaque projet dans projects_feed
  FOR project_record IN 
    SELECT id, why_you FROM projects_feed WHERE jsonb_array_length(why_you) > 0
  LOOP
    cleaned_reasons := '[]'::jsonb;
    
    -- Pour chaque raison dans why_you
    FOR reason IN 
      SELECT jsonb_array_elements_text(project_record.why_you)
    LOOP
      -- Nettoyer la raison
      cleaned_reason := reason;
      
      -- Supprimer les patterns de scores/pourcentages
      -- Pattern: "X%" ou "(X%)"
      cleaned_reason := regexp_replace(cleaned_reason, '\s*\(?\d+\.?\d*\s*%\)?', '', 'g');
      
      -- Pattern: "X/100" ou "X/Y"
      cleaned_reason := regexp_replace(cleaned_reason, '\s*\(?\d+\.?\d*\s*/\s*\d+\.?\d*\)?', '', 'g');
      
      -- Pattern: "score X" ou "score de X"
      cleaned_reason := regexp_replace(cleaned_reason, 'score\s+(de\s+)?\d+\.?\d*', '', 'gi');
      
      -- Pattern: nombres avec "ans" : "18 ans", "10+ ans", "2-5 ans"
      cleaned_reason := regexp_replace(cleaned_reason, '\d+\.?\d*\+?\s*ans?', '', 'gi');
      cleaned_reason := regexp_replace(cleaned_reason, '\d+-\d+\s*ans?', '', 'gi');
      
      -- Nettoyer espaces multiples et parenthèses vides
      cleaned_reason := regexp_replace(cleaned_reason, '\s+', ' ', 'g');
      cleaned_reason := regexp_replace(cleaned_reason, '\(\s*\)', '', 'g');
      cleaned_reason := trim(cleaned_reason);
      
      -- Ajouter au tableau nettoyé
      IF length(cleaned_reason) > 0 THEN
        cleaned_reasons := cleaned_reasons || to_jsonb(cleaned_reason);
      END IF;
    END LOOP;
    
    -- Mettre à jour le projet avec les raisons nettoyées
    UPDATE projects_feed 
    SET why_you = cleaned_reasons 
    WHERE id = project_record.id;
  END LOOP;
  
  RAISE NOTICE 'Nettoyage terminé';
END;
$$;

-- Exécuter le nettoyage immédiatement
SELECT clean_why_you_scores();