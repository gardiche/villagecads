-- Fix search_path for normalize_title function
CREATE OR REPLACE FUNCTION normalize_title(title text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(title, '[^a-z0-9]+', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';