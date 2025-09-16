'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useApplications, useApplicationStats } from '@/lib/hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function DashboardTestPage() {
  const [user, setUser] = useState<any>(null);
  const { data: applications = [] } = useApplications();
  const { data: stats } = useApplicationStats();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not authenticated</p>
          <Link href="/debug">
            <Button>Go to Debug Page</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Test</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user.user_metadata?.full_name || user.email}!
            </p>
          </div>
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Applications
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.total || 0}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Week
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.recentCount || 0}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <Link href="/applications">
              <Button variant="outline">View All Applications</Button>
            </Link>
            <Link href="/board">
              <Button variant="outline">Kanban Board</Button>
            </Link>
            <Link href="/applications/new">
              <Button>Add New Application</Button>
            </Link>
          </div>
        </div>

        {/* Test Data */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Data Test</h3>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Applications Count:</strong> {applications.length}</p>
            <p><strong>Database Connected:</strong> {stats ? 'Yes' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}