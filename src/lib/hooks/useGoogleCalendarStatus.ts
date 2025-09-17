'use client';

import { useState, useEffect } from 'react';

interface GoogleCalendarSettings {
  id?: string;
  google_calendar_id: string;
  sync_enabled: boolean;
  sync_interviews: boolean;
  sync_deadlines: boolean;
  sync_applications: boolean;
  sync_follow_ups: boolean;
  sync_custom_events: boolean;
  auto_sync_interval: number;
  last_sync_at?: string;
}

interface GoogleCalendarStatus {
  connected: boolean;
  settings: GoogleCalendarSettings | null;
  loading: boolean;
  error: string | null;
}

export function useGoogleCalendarStatus() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    settings: null,
    loading: true,
    error: null,
  });

  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/google-calendar/status');
      const data = await response.json();

      if (response.ok) {
        setStatus({
          connected: data.connected,
          settings: data.settings,
          loading: false,
          error: null,
        });
      } else {
        setStatus({
          connected: false,
          settings: null,
          loading: false,
          error: data.error || 'Failed to check Google Calendar status',
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        settings: null,
        loading: false,
        error: 'Failed to check Google Calendar status',
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return {
    ...status,
    refresh: checkStatus,
  };
}