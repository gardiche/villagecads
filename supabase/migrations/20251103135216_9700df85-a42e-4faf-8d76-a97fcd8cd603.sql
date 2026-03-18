-- Add chosen_project_id column to user_assessments
ALTER TABLE public.user_assessments 
ADD COLUMN chosen_project_id UUID REFERENCES public.projects_feed(id);