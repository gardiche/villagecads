-- Create table for B2B leads capture
CREATE TABLE public.pro_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  structure_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('coach', 'incubateur', 'accelerateur', 'reseau')),
  volume_clients TEXT NOT NULL CHECK (volume_clients IN ('1-5', '5-20', '20+')),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted BOOLEAN DEFAULT false,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.pro_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for lead capture form)
CREATE POLICY "Anyone can submit a lead" 
ON public.pro_leads 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view all leads" 
ON public.pro_leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update leads
CREATE POLICY "Admins can update leads" 
ON public.pro_leads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));