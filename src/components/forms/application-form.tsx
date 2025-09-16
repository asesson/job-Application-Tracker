'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApplicationFormData, applicationFormSchema } from '@/lib/validations/application';
import { useCreateApplication, useUpdateApplication } from '@/lib/hooks/useApplications';
import { ApplicationWithDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';

interface ApplicationFormProps {
  application?: ApplicationWithDetails;
  mode: 'create' | 'edit';
}

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Completed' },
  { value: 'offer_received', label: 'Offer Received' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function ApplicationForm({ application, mode }: ApplicationFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(application?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      company_name: application?.company_name || '',
      job_title: application?.job_title || '',
      description: application?.description || '',
      application_date: application?.application_date || new Date().toISOString().split('T')[0],
      status: application?.status || 'applied',
      salary_min: application?.salary_min || undefined,
      salary_max: application?.salary_max || undefined,
      salary_currency: application?.salary_currency || 'USD',
      job_url: application?.job_url || '',
      deadline: application?.deadline || '',
      notes: application?.notes || '',
      priority: application?.priority || 'medium',
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      const formData = {
        ...data,
        tags,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        deadline: data.deadline || null,
        job_url: data.job_url || null,
      } as ApplicationFormData;

      if (mode === 'create') {
        await createApplication.mutateAsync(formData);
      } else if (application) {
        await updateApplication.mutateAsync({
          id: application.id,
          ...formData,
        });
      }

      router.push('/applications');
    } catch (error) {
      console.error('Error saving application:', error);
      alert(`Error saving application: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Add New Application' : 'Edit Application'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                placeholder="e.g., Google"
              />
              {errors.company_name && (
                <p className="text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title *</Label>
              <Input
                id="job_title"
                {...register('job_title')}
                placeholder="e.g., Senior Software Engineer"
              />
              {errors.job_title && (
                <p className="text-sm text-red-600">{errors.job_title.message}</p>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="application_date">Application Date *</Label>
              <Input
                id="application_date"
                type="date"
                {...register('application_date')}
              />
              {errors.application_date && (
                <p className="text-sm text-red-600">{errors.application_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as ApplicationFormData['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as ApplicationFormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Minimum Salary</Label>
              <Input
                id="salary_min"
                type="number"
                {...register('salary_min', { valueAsNumber: true })}
                placeholder="e.g., 80000"
              />
              {errors.salary_min && (
                <p className="text-sm text-red-600">{errors.salary_min.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_max">Maximum Salary</Label>
              <Input
                id="salary_max"
                type="number"
                {...register('salary_max', { valueAsNumber: true })}
                placeholder="e.g., 120000"
              />
              {errors.salary_max && (
                <p className="text-sm text-red-600">{errors.salary_max.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_currency">Currency</Label>
              <Select
                value={watch('salary_currency')}
                onValueChange={(value) => setValue('salary_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* URLs and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="job_url">Job Posting URL</Label>
              <Input
                id="job_url"
                type="url"
                {...register('job_url')}
                placeholder="https://company.com/careers/job-id"
              />
              {errors.job_url && (
                <p className="text-sm text-red-600">{errors.job_url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                {...register('deadline')}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags (e.g., remote, startup, react)"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description and Notes */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Paste the job description or key requirements..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Add any personal notes, referrals, or additional information..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Application' : 'Update Application'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/applications')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}