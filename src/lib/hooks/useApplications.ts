'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ApplicationWithDetails } from '@/types';
import { ApplicationFormData } from '@/lib/validations/application';

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async (): Promise<ApplicationWithDetails[]> => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          contacts(*),
          interviews(*),
          documents(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async (): Promise<ApplicationWithDetails | null> => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          contacts(*),
          interviews(*),
          documents(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Transform data to match database schema
      const insertData = {
        user_id: user.id, // This was missing!
        company_name: data.company_name,
        job_title: data.job_title,
        description: data.description || null,
        application_date: data.application_date,
        status: data.status,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        salary_currency: data.salary_currency,
        job_url: data.job_url || null,
        deadline: data.deadline || null,
        notes: data.notes || null,
        tags: data.tags,
        priority: data.priority,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as any)
        .from('applications')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ApplicationFormData> & { id: string }) => {
      // Transform data to match database schema
      const updateData: Record<string, unknown> = {};

      if (data.company_name !== undefined) updateData.company_name = data.company_name;
      if (data.job_title !== undefined) updateData.job_title = data.job_title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.application_date !== undefined) updateData.application_date = data.application_date;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.salary_min !== undefined) updateData.salary_min = data.salary_min || null;
      if (data.salary_max !== undefined) updateData.salary_max = data.salary_max || null;
      if (data.salary_currency !== undefined) updateData.salary_currency = data.salary_currency;
      if (data.job_url !== undefined) updateData.job_url = data.job_url || null;
      if (data.deadline !== undefined) updateData.deadline = data.deadline || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.priority !== undefined) updateData.priority = data.priority;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as any)
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', data.id] });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ['application-stats'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: applications, error } = await (supabase as any)
        .from('applications')
        .select('status, created_at');

      if (error) throw error;

      const stats = {
        total: applications?.length || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byStatus: applications?.reduce((acc: Record<string, number>, app: any) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        recentCount: applications?.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (app: any) => new Date(app.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
      };

      return stats;
    },
  });
}