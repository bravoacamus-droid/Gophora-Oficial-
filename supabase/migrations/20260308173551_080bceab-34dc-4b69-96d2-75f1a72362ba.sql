
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skill TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  reward NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert on missions" ON public.missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on missions" ON public.missions FOR SELECT USING (true);
