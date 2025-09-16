'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApplication } from '@/lib/hooks/useApplications';
import { ApplicationForm } from '@/components/forms/application-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditApplicationPage() {
  const params = useParams();
  const applicationId = params.id as string;

  const { data: application, isLoading, error } = useApplication(applicationId);

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
              The application you're trying to edit doesn't exist or has been deleted.
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
        <div className="flex items-center space-x-4">
          <Link href={`/applications/${application.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Application</h1>
            <p className="text-gray-600 mt-1">
              {application.job_title} at {application.company_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <ApplicationForm application={application} mode="edit" />
      </div>
    </DashboardLayout>
  );
}