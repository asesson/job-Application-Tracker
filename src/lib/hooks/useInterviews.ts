'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface Interview {
  id: string;
  application_id: string;
  interview_type: 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'final' | 'other';
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  interviewer_name?: string;
  interviewer_email?: string;
  notes?: string;
  feedback?: string;
  outcome?: 'pending' | 'passed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface InterviewFormData {
  application_id: string;
  interview_type: Interview['interview_type'];
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  interviewer_name?: string;
  interviewer_email?: string;
  notes?: string;
  feedback?: string;
  outcome?: Interview['outcome'];
}

export function useInterviews(applicationId?: string) {
  return useQuery({
    queryKey: ['interviews', applicationId],
    queryFn: async (): Promise<Interview[]> => {
      let query = supabase
        .from('interviews')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: async (): Promise<Interview | null> => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const { data: result, error } = await supabase
        .from('interviews')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.application_id] });
      queryClient.invalidateQueries({ queryKey: ['application', data.application_id] });
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InterviewFormData> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('interviews')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', data.application_id] });
      queryClient.invalidateQueries({ queryKey: ['interview', data.id] });
      queryClient.invalidateQueries({ queryKey: ['application', data.application_id] });
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}