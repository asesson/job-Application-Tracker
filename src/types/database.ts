export type ApplicationStatus =
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn';

export type InterviewType =
  | 'phone_screen'
  | 'video_call'
  | 'in_person'
  | 'technical'
  | 'panel'
  | 'final';

export type DocumentType =
  | 'resume'
  | 'cover_letter'
  | 'portfolio'
  | 'reference'
  | 'other';

export type Priority = 'low' | 'medium' | 'high';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          job_search_goals: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          job_title: string;
          description: string | null;
          application_date: string;
          status: ApplicationStatus;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string;
          job_url: string | null;
          deadline: string | null;
          notes: string | null;
          tags: string[] | null;
          priority: Priority;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
      contacts: {
        Row: {
          id: string;
          application_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          linkedin_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };
      interviews: {
        Row: {
          id: string;
          application_id: string;
          interview_type: InterviewType;
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
        };
        Insert: Omit<Database['public']['Tables']['interviews']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['interviews']['Insert']>;
      };
      documents: {
        Row: {
          id: string;
          application_id: string | null;
          user_id: string;
          name: string;
          type: DocumentType;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          is_template: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      activity_logs: {
        Row: {
          id: string;
          application_id: string;
          activity_type: string;
          description: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>;
      };
    };
  };
}