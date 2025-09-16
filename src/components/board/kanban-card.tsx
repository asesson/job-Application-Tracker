'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { ApplicationWithDetails } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  DollarSign,
  MoreHorizontal,
  Edit,
  Eye,
  ExternalLink,
  Clock,
} from 'lucide-react';

interface KanbanCardProps {
  application: ApplicationWithDetails;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800',
};

export function KanbanCard({ application, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: application.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const upcomingInterviews = application.interviews?.filter(
    interview => interview.status === 'scheduled' && interview.scheduled_at
  ) || [];

  const nextInterview = upcomingInterviews.sort(
    (a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
  )[0];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        (isDragging || isSortableDragging) ? 'opacity-50 shadow-lg' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {application.job_title}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {application.company_name}
            </p>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Badge className={priorityColors[application.priority]}>
              {application.priority}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem asChild>
                  <Link href={`/applications/${application.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/applications/${application.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {application.job_url && (
                  <DropdownMenuItem asChild>
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Job Posting
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Application Date */}
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          Applied {new Date(application.application_date).toLocaleDateString()}
        </div>

        {/* Salary Range */}
        {application.salary_min && application.salary_max && (
          <div className="flex items-center text-xs text-gray-600">
            <DollarSign className="h-3 w-3 mr-1" />
            {application.salary_currency} {application.salary_min.toLocaleString()} - {application.salary_max.toLocaleString()}
          </div>
        )}

        {/* Next Interview */}
        {nextInterview && (
          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <Clock className="h-3 w-3 mr-1" />
            Interview: {new Date(nextInterview.scheduled_at!).toLocaleDateString()}
          </div>
        )}

        {/* Tags */}
        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {application.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {application.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{application.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {application.notes && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {application.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}