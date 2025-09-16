'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCalendarEvent, useUpdateCalendarEvent } from '@/lib/hooks/useCalendarEvents';
import { useApplications } from '@/lib/hooks/useApplications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Calendar, Clock } from 'lucide-react';
import moment from 'moment';

const quickEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  event_type: z.enum(['custom', 'interview_prep', 'networking', 'follow_up', 'meeting', 'reminder', 'other']),
  all_day: z.boolean().optional(),
  color: z.string().optional(),
  application_id: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type QuickEventFormData = z.infer<typeof quickEventSchema>;

interface QuickEventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultStart?: Date;
  defaultEnd?: Date;
  event?: any; // For editing existing events
}

const eventTypes = [
  { value: 'custom', label: 'Job Search Activities', color: '#3B82F6' },
  { value: 'interview_prep', label: 'Interview Preparation', color: '#8B5CF6' },
  { value: 'networking', label: 'Networking Event', color: '#10B981' },
  { value: 'follow_up', label: 'Follow-up', color: '#F59E0B' },
  { value: 'meeting', label: 'Meeting', color: '#EF4444' },
  { value: 'reminder', label: 'Reminder', color: '#6B7280' },
  { value: 'other', label: 'Other', color: '#14B8A6' },
];

export function QuickEventForm({
  open,
  onOpenChange,
  onSuccess,
  defaultStart,
  defaultEnd,
  event,
}: QuickEventFormProps) {
  const isEdit = !!event;
  const { data: applications = [] } = useApplications();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  const [selectedEventType, setSelectedEventType] = useState(
    event?.event_type || 'custom'
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickEventFormData>({
    resolver: zodResolver(quickEventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      start_time: event?.start_time
        ? moment(event.start_time).format('YYYY-MM-DDTHH:mm')
        : defaultStart
          ? moment(defaultStart).format('YYYY-MM-DDTHH:mm')
          : moment().format('YYYY-MM-DDTHH:mm'),
      end_time: event?.end_time
        ? moment(event.end_time).format('YYYY-MM-DDTHH:mm')
        : defaultEnd
          ? moment(defaultEnd).format('YYYY-MM-DDTHH:mm')
          : moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      event_type: event?.event_type || 'custom',
      all_day: event?.all_day || false,
      color: event?.color || '#3B82F6',
      application_id: event?.application_id || undefined,
      location: event?.location || '',
      notes: event?.notes || '',
    },
  });

  const onSubmit = async (data: QuickEventFormData) => {
    try {
      const formData = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
        application_id: data.application_id || undefined,
        color: eventTypes.find(type => type.value === data.event_type)?.color || data.color,
      };

      if (isEdit && event) {
        await updateEvent.mutateAsync({
          id: event.id,
          ...formData,
        });
      } else {
        await createEvent.mutateAsync(formData);
      }

      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Error saving event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const handleEventTypeChange = (value: string) => {
    setSelectedEventType(value);
    setValue('event_type', value as any);
    const eventType = eventTypes.find(type => type.value === value);
    if (eventType) {
      setValue('color', eventType.color);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{isEdit ? 'Edit Event' : 'Create Event'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your calendar event details.'
              : 'Add a new event to your calendar.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Interview prep for Google"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={selectedEventType}
              onValueChange={handleEventTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                {...register('end_time')}
              />
              {errors.end_time && (
                <p className="text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {/* Related Application */}
          <div className="space-y-2">
            <Label htmlFor="application_id">Related Application (Optional)</Label>
            <Select
              value={watch('application_id') || undefined}
              onValueChange={(value) => setValue('application_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Link to an application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No application</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.job_title} at {app.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Coffee shop, Zoom, Office"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Add details about this event..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes or reminders..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Event' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}