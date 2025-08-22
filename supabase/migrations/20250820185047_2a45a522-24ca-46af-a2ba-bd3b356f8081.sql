-- Create runs table
CREATE TABLE public.runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'started',
  settings_json JSON,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create artifacts table
CREATE TABLE public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Create policies for runs (allow all operations for now - no auth required)
CREATE POLICY "Anyone can view runs" ON public.runs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert runs" ON public.runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update runs" ON public.runs FOR UPDATE USING (true);

-- Create policies for artifacts (allow all operations for now - no auth required)
CREATE POLICY "Anyone can view artifacts" ON public.artifacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert artifacts" ON public.artifacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update artifacts" ON public.artifacts FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_runs_created_at ON public.runs(created_at DESC);
CREATE INDEX idx_artifacts_run_id ON public.artifacts(run_id);
CREATE INDEX idx_artifacts_kind ON public.artifacts(kind);