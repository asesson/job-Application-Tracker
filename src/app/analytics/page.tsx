'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApplications } from '@/lib/hooks/useApplications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

const statusLabels = {
  applied: 'Applied',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const statusColors = {
  applied: '#3B82F6',
  interview_scheduled: '#F59E0B',
  interview_completed: '#8B5CF6',
  offer_received: '#10B981',
  rejected: '#EF4444',
  withdrawn: '#6B7280',
};

const COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#6B7280'];

export default function AnalyticsPage() {
  const { data: applications = [], isLoading } = useApplications();

  const analytics = useMemo(() => {
    if (!applications.length) return null;

    // Status distribution
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels],
      value: count,
      color: statusColors[status as keyof typeof statusColors],
    }));

    // Applications over time (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    const timeData = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const count = applications.filter(app => {
        const appDate = new Date(app.application_date);
        return appDate >= monthStart && appDate <= monthEnd;
      }).length;

      timeData.push({
        month: format(month, 'MMM yyyy'),
        applications: count,
      });
    }

    // Company application counts
    const companyCounts = applications.reduce((acc, app) => {
      acc[app.company_name] = (acc[app.company_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const companyData = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([company, count]) => ({
        company,
        applications: count,
      }));

    // Response rate calculation
    const totalApplications = applications.length;
    const responses = applications.filter(app =>
      ['interview_scheduled', 'interview_completed', 'offer_received'].includes(app.status)
    ).length;
    const responseRate = totalApplications > 0 ? (responses / totalApplications * 100) : 0;

    // Success rate (offers received)
    const offers = applications.filter(app => app.status === 'offer_received').length;
    const successRate = totalApplications > 0 ? (offers / totalApplications * 100) : 0;

    // Average time to response (placeholder - would need interview dates)
    const avgResponseTime = 7; // days - placeholder

    // Salary insights
    const salaryData = applications
      .filter(app => app.salary_min && app.salary_max)
      .map(app => ({
        company: app.company_name,
        min: app.salary_min!,
        max: app.salary_max!,
        avg: (app.salary_min! + app.salary_max!) / 2,
      }));

    const avgSalary = salaryData.length > 0
      ? salaryData.reduce((sum, item) => sum + item.avg, 0) / salaryData.length
      : 0;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentApplications = applications.filter(app =>
      new Date(app.created_at) >= thirtyDaysAgo
    ).length;

    return {
      statusData,
      timeData,
      companyData,
      responseRate,
      successRate,
      avgResponseTime,
      avgSalary,
      recentApplications,
      salaryData: salaryData.slice(0, 10),
    };
  }, [applications]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics || applications.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No data available
            </h3>
            <p className="text-gray-500">
              Start adding job applications to see analytics and insights.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and statistics about your job search progress
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.responseRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.successRate.toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.avgResponseTime} days
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.recentApplications}
                  </p>
                  <p className="text-xs text-gray-500">last 30 days</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Applications Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5" />
                Application Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Applications by Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.companyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="company" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Salary Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Salary Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.salaryData.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Average Salary Range</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${analytics.avgSalary.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.salaryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="company" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="min" fill="#93C5FD" name="Min Salary" />
                        <Bar dataKey="max" fill="#3B82F6" name="Max Salary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Add salary information to your applications to see salary insights.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {applications.filter(app => app.status === 'offer_received').length}
                </p>
                <p className="text-sm text-gray-600">Offers Received</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  {applications.filter(app =>
                    ['interview_scheduled', 'interview_completed'].includes(app.status)
                  ).length}
                </p>
                <p className="text-sm text-gray-600">Interviews in Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}