export * from './database';

export interface ApplicationWithDetails {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  description: string | null;
  application_date: string;
  status: import('./database').ApplicationStatus;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  job_url: string | null;
  deadline: string | null;
  notes: string | null;
  tags: string[] | null;
  priority: import('./database').Priority;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  interviews?: Interview[];
  documents?: Document[];
}

export interface Contact {
  id: string;
  application_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interview_type: import('./database').InterviewType;
  scheduled_at: string | null;
  duration_minutes: number | null;
  interviewer_names: string[] | null;
  location: string | null;
  meeting_link: string | null;
  preparation_notes: string | null;
  interview_notes: string | null;
  follow_up_sent: boolean;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  application_id: string | null;
  user_id: string;
  name: string;
  type: import('./database').DocumentType;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  is_template: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  application_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  totalApplications: number;
  applicationsByStatus: Record<import('./database').ApplicationStatus, number>;
  recentApplications: ApplicationWithDetails[];
  upcomingInterviews: Interview[];
  applicationTrend: { date: string; count: number }[];
}