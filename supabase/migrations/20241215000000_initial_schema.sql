-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  job_search_goals jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Applications table
CREATE TABLE public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  description text,
  application_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN (
    'applied', 'interview_scheduled', 'interview_completed',
    'offer_received', 'rejected', 'withdrawn'
  )),
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD',
  job_url text,
  deadline date,
  notes text,
  tags text[],
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Contacts table
CREATE TABLE public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  linkedin_url text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Interviews table
CREATE TABLE public.interviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  interview_type text NOT NULL CHECK (interview_type IN (
    'phone_screen', 'video_call', 'in_person', 'technical', 'panel', 'final'
  )),
  scheduled_at timestamp with time zone,
  duration_minutes integer,
  interviewer_names text[],
  location text,
  meeting_link text,
  preparation_notes text,
  interview_notes text,
  follow_up_sent boolean DEFAULT false,
  status text DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'completed', 'cancelled', 'rescheduled'
  )),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents table (for file storage metadata)
CREATE TABLE public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'resume', 'cover_letter', 'portfolio', 'reference', 'other'
  )),
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  is_template boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activity logs for timeline tracking
CREATE TABLE public.activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only see their own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see contacts for their applications" ON public.contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = contacts.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see interviews for their applications" ON public.interviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = interviews.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only see their own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see activity logs for their applications" ON public.activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = activity_logs.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_application_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (application_id, activity_type, description)
    VALUES (NEW.id, 'application_created', 'Application created for ' || NEW.job_title || ' at ' || NEW.company_name);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.activity_logs (application_id, activity_type, description, metadata)
      VALUES (NEW.id, 'status_changed',
        'Status changed from ' || OLD.status || ' to ' || NEW.status,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for application activity logging
CREATE TRIGGER log_application_activity_trigger
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.log_application_activity();

-- Indexes for better performance
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at);
CREATE INDEX idx_contacts_application_id ON public.contacts(application_id);
CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_activity_logs_application_id ON public.activity_logs(application_id);