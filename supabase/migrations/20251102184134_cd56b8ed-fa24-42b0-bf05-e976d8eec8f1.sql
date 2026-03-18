-- Add project_hash column to feedback_events for deduplication
ALTER TABLE feedback_events 
ADD COLUMN project_hash text;

-- Create index for fast hash lookups
CREATE INDEX idx_feedback_events_project_hash 
ON feedback_events(assessment_id, project_hash);

-- Add columns to track diversity metrics in projects_feed
ALTER TABLE projects_feed
ADD COLUMN IF NOT EXISTS normalized_title text,
ADD COLUMN IF NOT EXISTS feature_hash text;

-- Create function to normalize title for hashing
CREATE OR REPLACE FUNCTION normalize_title(title text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(title, '[^a-z0-9]+', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing projects with normalized titles
UPDATE projects_feed 
SET normalized_title = normalize_title(title)
WHERE normalized_title IS NULL;