import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApplicationForm } from '@/components/forms/application-form';

export default function NewApplicationPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <ApplicationForm mode="create" />
      </div>
    </DashboardLayout>
  );
}