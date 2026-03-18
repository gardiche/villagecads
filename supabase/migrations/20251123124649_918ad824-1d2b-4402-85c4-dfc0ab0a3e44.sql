-- Table pour stocker les exports PDF
CREATE TABLE IF NOT EXISTS public.pdf_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID,
  file_path TEXT NOT NULL,
  export_type TEXT NOT NULL DEFAULT 'complete', -- 'complete' | 'profile_only' | 'progression'
  insights_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_exports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own PDF exports
CREATE POLICY "Users can manage their PDF exports"
ON public.pdf_exports
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_pdf_exports_user_id ON public.pdf_exports(user_id);
CREATE INDEX idx_pdf_exports_idea_id ON public.pdf_exports(idea_id);
CREATE INDEX idx_pdf_exports_created_at ON public.pdf_exports(created_at DESC);