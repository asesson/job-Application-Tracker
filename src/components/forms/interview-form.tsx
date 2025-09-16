'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInterview, useUpdateInterview, Interview } from '@/lib/hooks/useInterviews';
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
import { Loader2 } from 'lucide-react';

const interviewFormSchema = z.object({
  interview_type: z.enum(['phone_screen', 'technical', 'behavioral', 'panel', 'final', 'other']),
  scheduled_at: z.string().min(1, 'Scheduled time is required'),
  duration_minutes: z.number().min(15).max(480).optional(),
  location: z.string().optional(),
  interviewer_name: z.string().optional(),
  interviewer_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  outcome: z.enum(['pending', 'passed', 'failed', 'cancelled']).optional(),
});

type InterviewFormData = z.infer<typeof interviewFormSchema>;

interface InterviewFormProps {
  applicationId: string;
  interview?: Interview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const interviewTypes = [
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical Interview' },
  { value: 'behavioral', label: 'Behavioral Interview' },
  { value: 'panel', label: 'Panel Interview' },
  { value: 'final', label: 'Final Interview' },
  { value: 'other', label: 'Other' },
];

const outcomeOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function InterviewForm({
  applicationId,
  interview,
  open,
  onOpenChange,
  onSuccess,
}: InterviewFormProps) {
  const isEdit = !!interview;
  const createInterview = useCreateInterview();
  const updateInterview = useUpdateInterview();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      interview_type: interview?.interview_type || 'phone_screen',
      scheduled_at: interview?.scheduled_at
        ? new Date(interview.scheduled_at).toISOString().slice(0, 16)
        : '',
      duration_minutes: interview?.duration_minutes || 60,
      location: interview?.location || '',
      interviewer_name: interview?.interviewer_name || '',
      interviewer_email: interview?.interviewer_email || '',
      notes: interview?.notes || '',
      feedback: interview?.feedback || '',
      outcome: interview?.outcome || 'pending',
    },
  });

  const onSubmit = async (data: InterviewFormData) => {
    try {
      const formData = {
        ...data,
        application_id: applicationId,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        duration_minutes: data.duration_minutes || undefined,
        location: data.location || undefined,
        interviewer_name: data.interviewer_name || undefined,
        interviewer_email: data.interviewer_email || undefined,
        notes: data.notes || undefined,
        feedback: data.feedback || undefined,
      };

      if (isEdit && interview) {
        await updateInterview.mutateAsync({
          id: interview.id,
          ...formData,
        });
      } else {
        await createInterview.mutateAsync(formData);
      }

      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving interview:', error);
      alert(`Error saving interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Interview' : 'Schedule Interview'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the interview details and feedback.'
              : 'Add a new interview for this application.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Interview Type and Outcome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview_type">Interview Type *</Label>
              <Select
                value={watch('interview_type')}
                onValueChange={(value) => setValue('interview_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interview type" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.interview_type && (
                <p className="text-sm text-red-600">{errors.interview_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Select
                value={watch('outcome')}
                onValueChange={(value) => setValue('outcome', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Scheduled Date & Time *</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                {...register('scheduled_at')}
              />
              {errors.scheduled_at && (
                <p className="text-sm text-red-600">{errors.scheduled_at.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="15"
                max="480"
                step="15"
                {...register('duration_minutes', { valueAsNumber: true })}
                placeholder="60"
              />
              {errors.duration_minutes && (
                <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location/Meeting Link</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Office address, Zoom link, Google Meet, etc."
            />
          </div>

          {/* Interviewer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewer_name">Interviewer Name</Label>
              <Input
                id="interviewer_name"
                {...register('interviewer_name')}
                placeholder="e.g., John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewer_email">Interviewer Email</Label>
              <Input
                id="interviewer_email"
                type="email"
                {...register('interviewer_email')}
                placeholder="john.smith@company.com"
              />
              {errors.interviewer_email && (
                <p className="text-sm text-red-600">{errors.interviewer_email.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Preparation Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add notes about what to prepare, questions to ask, etc."
              rows={3}
            />
          </div>

          {/* Feedback (typically filled after interview) */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback & Results</Label>
            <Textarea
              id="feedback"
              {...register('feedback')}
              placeholder="Add feedback and results after the interview..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Interview' : 'Schedule Interview'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}