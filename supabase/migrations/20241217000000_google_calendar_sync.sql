-- Create table to store Google Calendar OAuth tokens for users
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table to store Google Calendar sync settings for users
CREATE TABLE IF NOT EXISTS public.google_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  google_calendar_id VARCHAR, -- The Google Calendar ID to sync with
  sync_enabled BOOLEAN DEFAULT true,
  sync_interviews BOOLEAN DEFAULT true,
  sync_deadlines BOOLEAN DEFAULT true,
  sync_applications BOOLEAN DEFAULT false,
  sync_follow_ups BOOLEAN DEFAULT true,
  sync_custom_events BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 15, -- minutes
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table to map app events to Google Calendar events
CREATE TABLE IF NOT EXISTS public.google_calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_event_id UUID, -- ID from calendar_events table for custom events
  app_event_type VARCHAR NOT NULL CHECK (app_event_type IN ('interview', 'deadline', 'application', 'follow_up', 'custom')),
  app_event_reference_id UUID, -- Reference to interviews, applications, etc.
  google_calendar_id VARCHAR NOT NULL, -- Google Calendar ID
  google_event_id VARCHAR NOT NULL, -- Google Calendar Event ID
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_status VARCHAR DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'conflict')),
  last_modified_source VARCHAR DEFAULT 'app' CHECK (last_modified_source IN ('app', 'google')),
  etag VARCHAR, -- Google Calendar ETag for conflict detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, google_calendar_id, google_event_id)
);

-- Create table to store sync logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS public.google_calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type VARCHAR NOT NULL CHECK (sync_type IN ('full', 'partial', 'single_event')),
  sync_direction VARCHAR NOT NULL CHECK (sync_direction IN ('app_to_google', 'google_to_app', 'bidirectional')),
  status VARCHAR NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  events_processed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  message TEXT,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

-- Add RLS policies for google_calendar_tokens
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Calendar tokens" ON public.google_calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Calendar tokens" ON public.google_calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google Calendar tokens" ON public.google_calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google Calendar tokens" ON public.google_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for google_calendar_settings
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Calendar settings" ON public.google_calendar_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Calendar settings" ON public.google_calendar_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google Calendar settings" ON public.google_calendar_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google Calendar settings" ON public.google_calendar_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for google_calendar_event_mappings
ALTER TABLE public.google_calendar_event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Calendar event mappings" ON public.google_calendar_event_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Calendar event mappings" ON public.google_calendar_event_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google Calendar event mappings" ON public.google_calendar_event_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google Calendar event mappings" ON public.google_calendar_event_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for google_calendar_sync_logs
ALTER TABLE public.google_calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own Google Calendar sync logs" ON public.google_calendar_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Calendar sync logs" ON public.google_calendar_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER handle_google_calendar_tokens_updated_at
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_google_calendar_settings_updated_at
  BEFORE UPDATE ON public.google_calendar_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_google_calendar_event_mappings_updated_at
  BEFORE UPDATE ON public.google_calendar_event_mappings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS google_calendar_tokens_user_id_idx ON public.google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_settings_user_id_idx ON public.google_calendar_settings(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_event_mappings_user_id_idx ON public.google_calendar_event_mappings(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_event_mappings_google_event_id_idx ON public.google_calendar_event_mappings(google_event_id);
CREATE INDEX IF NOT EXISTS google_calendar_event_mappings_app_event_idx ON public.google_calendar_event_mappings(app_event_type, app_event_reference_id);
CREATE INDEX IF NOT EXISTS google_calendar_sync_logs_user_id_idx ON public.google_calendar_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS google_calendar_sync_logs_created_at_idx ON public.google_calendar_sync_logs(started_at);

-- Add columns to existing calendar_events table for Google sync
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS google_event_id VARCHAR,
ADD COLUMN IF NOT EXISTS google_calendar_id VARCHAR,
ADD COLUMN IF NOT EXISTS last_google_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_with_google BOOLEAN DEFAULT true;

-- Add index for Google sync fields on calendar_events
CREATE INDEX IF NOT EXISTS calendar_events_google_event_id_idx ON public.calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS calendar_events_sync_enabled_idx ON public.calendar_events(sync_with_google);