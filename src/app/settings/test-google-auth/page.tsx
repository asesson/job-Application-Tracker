'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestGoogleAuthPage() {
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/google-calendar/auth-test');
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        alert('Failed to generate auth URL');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Google Calendar</h1>
          <p className="text-gray-600 mt-1">
            Test the Google Calendar OAuth flow
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Google Calendar Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will test the Google Calendar OAuth flow using a test user ID.
              </p>
              <Button
                onClick={handleConnectGoogle}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Test Google Calendar Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}