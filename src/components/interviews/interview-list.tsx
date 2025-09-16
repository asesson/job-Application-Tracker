'use client';

import { useState } from 'react';
import { useInterviews, useDeleteInterview, Interview } from '@/lib/hooks/useInterviews';
import { InterviewForm } from '@/components/forms/interview-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Video,
} from 'lucide-react';
import { format } from 'date-fns';

interface InterviewListProps {
  applicationId: string;
}

const interviewTypeLabels = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  panel: 'Panel',
  final: 'Final',
  other: 'Other',
};

const outcomeColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const outcomeLabels = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function InterviewList({ applicationId }: InterviewListProps) {
  const { data: interviews = [], isLoading } = useInterviews(applicationId);
  const deleteInterview = useDeleteInterview();

  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | undefined>();

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      try {
        await deleteInterview.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting interview:', error);
        alert('Failed to delete interview');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInterview(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Interviews</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Interview List */}
      {interviews.length > 0 ? (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card key={interview.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header with type and outcome */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {interviewTypeLabels[interview.interview_type]}
                        </h4>
                        <Badge className={outcomeColors[interview.outcome || 'pending']} variant="secondary">
                          {outcomeLabels[interview.outcome || 'pending']}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(interview)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(interview.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {format(new Date(interview.scheduled_at), 'PPP')} at{' '}
                        {format(new Date(interview.scheduled_at), 'p')}
                      </span>
                      {interview.duration_minutes && (
                        <>
                          <Clock className="ml-4 mr-2 h-4 w-4" />
                          <span>{interview.duration_minutes} min</span>
                        </>
                      )}
                    </div>

                    {/* Location */}
                    {interview.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span className="truncate">{interview.location}</span>
                      </div>
                    )}

                    {/* Interviewer */}
                    {(interview.interviewer_name || interview.interviewer_email) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="mr-2 h-4 w-4" />
                        <span>
                          {interview.interviewer_name}
                          {interview.interviewer_name && interview.interviewer_email && ' • '}
                          {interview.interviewer_email && (
                            <a
                              href={`mailto:${interview.interviewer_email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {interview.interviewer_email}
                            </a>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Notes Preview */}
                    {interview.notes && (
                      <div className="text-sm text-gray-600">
                        <p className="line-clamp-2">{interview.notes}</p>
                      </div>
                    )}

                    {/* Feedback Preview */}
                    {interview.feedback && (
                      <div className="text-sm">
                        <p className="font-medium text-gray-700 mb-1">Feedback:</p>
                        <p className="text-gray-600 line-clamp-2">{interview.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No interviews scheduled
          </h3>
          <p className="text-gray-500 mb-4">
            Track phone screens, technical interviews, and final rounds.
          </p>
          <Button onClick={() => setShowForm(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Schedule First Interview
          </Button>
        </div>
      )}

      {/* Interview Form Dialog */}
      <InterviewForm
        applicationId={applicationId}
        interview={editingInterview}
        open={showForm}
        onOpenChange={handleFormClose}
        onSuccess={handleFormClose}
      />
    </div>
  );
}