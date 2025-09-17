'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Unlink,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface ConnectionStatus {
  connected: boolean;
  settings: GoogleCalendarSettings | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    settings: null,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkConnectionStatus();

    // Handle URL parameters for success/error messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_calendar_connected') {
      setMessage({ type: 'success', text: 'Google Calendar connected successfully!' });
    } else if (error) {
      const errorMessages = {
        google_auth_cancelled: 'Google authorization was cancelled.',
        missing_auth_parameters: 'Missing authorization parameters.',
        unauthorized: 'Unauthorized access.',
        connection_failed: 'Failed to connect to Google Calendar.',
      };
      setMessage({
        type: 'error',
        text: errorMessages[error as keyof typeof errorMessages] || 'An error occurred.'
      });
    }

    // Clear URL parameters
    if (success || error) {
      router.replace('/settings');
    }
  }, [searchParams, router]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-calendar/status');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      setMessage({ type: 'error', text: 'Failed to start Google Calendar connection.' });
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? This will stop all syncing.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnectionStatus({ connected: false, settings: null });
        setMessage({ type: 'success', text: 'Google Calendar disconnected successfully.' });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect Google Calendar.' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<GoogleCalendarSettings>) => {
    try {
      const response = await fetch('/api/google-calendar/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(prev => ({
          ...prev,
          settings: data.settings,
        }));
        setMessage({ type: 'success', text: 'Settings updated successfully.' });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    }
  };

  const performSync = async (direction: 'app_to_google' | 'google_to_app' | 'bidirectional' = 'bidirectional') => {
    try {
      setSyncing(true);
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ syncDirection: direction }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Sync completed: ${result.eventsProcessed} events processed.`
        });
        // Refresh connection status to update last sync time
        await checkConnectionStatus();
      } else {
        setMessage({
          type: 'error',
          text: `Sync failed: ${result.message}`
        });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setMessage({ type: 'error', text: 'Sync failed due to an error.' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your application preferences and integrations
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <Card className={`border-l-4 ${
            message.type === 'success' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Google Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus.connected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-gray-600">
                    {connectionStatus.connected ? 'Connected' : 'Not connected'}
                  </p>
                  {connectionStatus.settings?.last_sync_at && (
                    <p className="text-xs text-gray-500">
                      Last sync: {new Date(connectionStatus.settings.last_sync_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus.connected ? (
                  <>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectGoogleCalendar}
                      disabled={loading}
                    >
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button onClick={connectGoogleCalendar} disabled={loading}>
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </div>

            {/* Sync Settings */}
            {connectionStatus.connected && connectionStatus.settings && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sync Settings</h3>

                {/* Main Sync Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="sync-enabled" className="text-base font-medium">
                      Enable Sync
                    </Label>
                    <p className="text-sm text-gray-600">
                      Automatically sync events between your job tracker and Google Calendar
                    </p>
                  </div>
                  <Switch
                    id="sync-enabled"
                    checked={connectionStatus.settings.sync_enabled}
                    onCheckedChange={(checked) => updateSettings({ sync_enabled: checked })}
                  />
                </div>

                {/* Event Type Settings */}
                {connectionStatus.settings.sync_enabled && (
                  <div className="space-y-3">
                    <h4 className="font-medium">What to sync</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label htmlFor="sync-interviews">Interviews</Label>
                        <Switch
                          id="sync-interviews"
                          checked={connectionStatus.settings.sync_interviews}
                          onCheckedChange={(checked) => updateSettings({ sync_interviews: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label htmlFor="sync-deadlines">Deadlines</Label>
                        <Switch
                          id="sync-deadlines"
                          checked={connectionStatus.settings.sync_deadlines}
                          onCheckedChange={(checked) => updateSettings({ sync_deadlines: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label htmlFor="sync-applications">Applications</Label>
                        <Switch
                          id="sync-applications"
                          checked={connectionStatus.settings.sync_applications}
                          onCheckedChange={(checked) => updateSettings({ sync_applications: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label htmlFor="sync-follow-ups">Follow-ups</Label>
                        <Switch
                          id="sync-follow-ups"
                          checked={connectionStatus.settings.sync_follow_ups}
                          onCheckedChange={(checked) => updateSettings({ sync_follow_ups: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label htmlFor="sync-custom-events">Custom Events</Label>
                        <Switch
                          id="sync-custom-events"
                          checked={connectionStatus.settings.sync_custom_events}
                          onCheckedChange={(checked) => updateSettings({ sync_custom_events: checked })}
                        />
                      </div>
                    </div>

                    {/* Sync Interval */}
                    <div className="flex items-center justify-between p-3 border rounded">
                      <Label htmlFor="sync-interval">Auto-sync interval</Label>
                      <Select
                        value={connectionStatus.settings.auto_sync_interval.toString()}
                        onValueChange={(value) => updateSettings({ auto_sync_interval: parseInt(value) })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Manual Sync */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium">Manual Sync</p>
                        <p className="text-sm text-gray-600">
                          Sync events immediately between your job tracker and Google Calendar
                        </p>
                      </div>
                      <Button
                        onClick={() => performSync('bidirectional')}
                        disabled={syncing}
                        size="sm"
                      >
                        {syncing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sync Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}