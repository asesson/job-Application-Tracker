import { z } from 'zod';
// import { ApplicationStatus, Priority } from '@/types/database';

export const applicationFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(100),
  job_title: z.string().min(1, 'Job title is required').max(100),
  description: z.string().optional(),
  application_date: z.string().min(1, 'Application date is required'),
  status: z.enum(['applied', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected', 'withdrawn'] as const),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  salary_currency: z.string().default('USD'),
  job_url: z.string().url().optional().or(z.literal('')),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high'] as const).default('medium'),
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_min <= data.salary_max;
  }
  return true;
}, {
  message: 'Minimum salary must be less than or equal to maximum salary',
  path: ['salary_max'],
});

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const interviewFormSchema = z.object({
  interview_type: z.enum(['phone_screen', 'video_call', 'in_person', 'technical', 'panel', 'final'] as const),
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().min(1).max(480).optional(),
  interviewer_names: z.array(z.string()).default([]),
  location: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal('')),
  preparation_notes: z.string().optional(),
  interview_notes: z.string().optional(),
  follow_up_sent: z.boolean().default(false),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled'] as const).default('scheduled'),
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type InterviewFormData = z.infer<typeof interviewFormSchema>;