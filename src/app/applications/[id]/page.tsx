'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApplication, useDeleteApplication } from '@/lib/hooks/useApplications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Building,
  Briefcase,
  Tag,
  FileText,
  Users,
  Video,
  Activity,
} from 'lucide-react';
import { InterviewList } from '@/components/interviews/interview-list';
import { DocumentList } from '@/components/documents/document-list';

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

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800',
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const { data: application, isLoading, error } = useApplication(applicationId);
  const deleteApplication = useDeleteApplication();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteApplication.mutateAsync(applicationId);
        router.push('/applications');
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Failed to delete application');
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading application...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !application) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Application not found
            </h3>
            <p className="text-gray-500 mb-4">
              The application you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/applications">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Applications
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/applications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {application.job_title}
              </h1>
              <p className="text-gray-600 mt-1 flex items-center">
                <Building className="mr-2 h-4 w-4" />
                {application.company_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/applications/${application.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex items-center space-x-4">
          <Badge className={statusColors[application.status]} variant="secondary">
            {statusLabels[application.status]}
          </Badge>
          <Badge className={priorityColors[application.priority]} variant="secondary">
            {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)} Priority
          </Badge>
          {application.tags && application.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {application.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Applied</p>
                  <p className="text-lg font-semibold">
                    {new Date(application.application_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(application.salary_min || application.salary_max) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salary Range</p>
                    <p className="text-lg font-semibold">
                      {application.salary_currency} {application.salary_min?.toLocaleString()} - {application.salary_max?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {application.deadline && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Deadline</p>
                    <p className="text-lg font-semibold">
                      {new Date(application.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-lg font-semibold">
                    {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Title</label>
                    <p className="text-base">{application.job_title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="text-base">{application.company_name}</p>
                  </div>
                  {application.job_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Job Posting</label>
                      <div className="flex items-center space-x-2">
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View Original Posting
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  {application.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Job Description</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{application.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Notes & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {application.notes ? (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No contacts added yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Keep track of recruiters, hiring managers, and other contacts for this application.
                  </p>
                  <Button variant="outline" disabled>
                    Add Contact (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewList applicationId={application.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList applicationId={application.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No activity recorded
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Track all changes and updates to this application over time.
                  </p>
                  <Button variant="outline" disabled>
                    View Full History (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}