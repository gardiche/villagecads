-- Create analytics events table
CREATE TABLE IF NOT EXISTS public.user_analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their analytics
CREATE POLICY "Users can manage their analytics events"
ON public.user_analytics_events
FOR ALL
USING (
  assessment_id IN (
    SELECT id FROM user_assessments WHERE user_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_analytics_user_assessment ON public.user_analytics_events(user_id, assessment_id);
CREATE INDEX idx_analytics_event_type ON public.user_analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.user_analytics_events(created_at DESC);