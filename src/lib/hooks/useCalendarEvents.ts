'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: 'custom' | 'interview_prep' | 'networking' | 'follow_up' | 'meeting' | 'reminder' | 'other';
  all_day: boolean;
  color: string;
  application_id?: string;
  is_recurring: boolean;
  recurrence_rule?: any;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: CalendarEvent['event_type'];
  all_day?: boolean;
  color?: string;
  application_id?: string;
  location?: string;
  notes?: string;
}

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar-events'],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: ['calendar-event', id],
    queryFn: async (): Promise<CalendarEvent | null> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CalendarEventFormData) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        start_time: data.start_time,
        end_time: data.end_time,
        event_type: data.event_type,
        all_day: data.all_day || false,
        color: data.color || '#3B82F6',
        application_id: data.application_id || null,
        location: data.location || null,
        notes: data.notes || null,
      };

      const { data: result, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      // Also invalidate the main calendar data to refresh the view
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CalendarEventFormData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.start_time !== undefined) updateData.start_time = data.start_time;
      if (data.end_time !== undefined) updateData.end_time = data.end_time;
      if (data.event_type !== undefined) updateData.event_type = data.event_type;
      if (data.all_day !== undefined) updateData.all_day = data.all_day;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.application_id !== undefined) updateData.application_id = data.application_id || null;
      if (data.location !== undefined) updateData.location = data.location || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { data: result, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useCalendarEventsByApplication(applicationId: string) {
  return useQuery({
    queryKey: ['calendar-events', 'application', applicationId],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('application_id', applicationId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!applicationId,
  });
}