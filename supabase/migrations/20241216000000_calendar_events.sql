-- Create calendar_events table for custom user events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type VARCHAR DEFAULT 'custom' CHECK (event_type IN ('custom', 'interview_prep', 'networking', 'follow_up', 'meeting', 'reminder', 'other')),
  all_day BOOLEAN DEFAULT false,
  color VARCHAR DEFAULT '#3B82F6',
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,
  location VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own calendar events
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own calendar events
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calendar events
CREATE POLICY "Users can update own calendar events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own calendar events
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS calendar_events_user_id_idx ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_start_time_idx ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS calendar_events_application_id_idx ON public.calendar_events(application_id);

-- Add activity logging for calendar events
CREATE OR REPLACE FUNCTION public.log_calendar_event_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.application_id IS NOT NULL THEN
      INSERT INTO public.activity_logs (application_id, activity_type, description)
      VALUES (NEW.application_id, 'calendar_event_created',
        'Calendar event created: ' || NEW.title);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.application_id IS NOT NULL THEN
      INSERT INTO public.activity_logs (application_id, activity_type, description)
      VALUES (NEW.application_id, 'calendar_event_updated',
        'Calendar event updated: ' || NEW.title);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.application_id IS NOT NULL THEN
      INSERT INTO public.activity_logs (application_id, activity_type, description)
      VALUES (OLD.application_id, 'calendar_event_deleted',
        'Calendar event deleted: ' || OLD.title);
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for activity logging
CREATE TRIGGER calendar_events_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
  FOR EACH ROW EXECUTE PROCEDURE public.log_calendar_event_activity();