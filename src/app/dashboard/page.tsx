'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApplications, useApplicationStats } from '@/lib/hooks/useApplications';
import {
  Briefcase,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

const statusColors = {
  applied: 'bg-blue-100 text-blue-800',
  interview_scheduled: 'bg-yellow-100 text-yellow-800',
  interview_completed: 'bg-purple-100 text-purple-800',
  offer_received: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  applied: 'Applied',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export default function DashboardPage() {
  const { data: applications = [], isLoading: applicationsLoading } = useApplications();
  const { data: stats, isLoading: statsLoading } = useApplicationStats();

  const recentApplications = applications.slice(0, 5);

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total || 0,
      icon: Briefcase,
      color: 'text-blue-600',
    },
    {
      title: 'This Week',
      value: stats?.recentCount || 0,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Success Rate',
      value: stats?.total ? `${Math.round(((stats.byStatus.offer_received || 0) / stats.total) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'In Progress',
      value: (stats?.byStatus.applied || 0) + (stats?.byStatus.interview_scheduled || 0) + (stats?.byStatus.interview_completed || 0),
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track your job application progress and performance
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '-' : stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(statusLabels).map(([status, label]) => {
                  const count = stats?.byStatus[status] || 0;
                  const percentage = stats?.total ? (count / stats.total) * 100 : 0;

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[status as keyof typeof statusColors]}>
                          {label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Link href="/applications">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationsLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : recentApplications.length > 0 ? (
                  recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.job_title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {application.company_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[application.status]}>
                          {statusLabels[application.status]}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(application.application_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No applications yet
                    </p>
                    <Link href="/applications/new">
                      <Button className="mt-2" size="sm">
                        Add your first application
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}