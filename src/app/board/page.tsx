'use client';

import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
// import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApplications, useUpdateApplication } from '@/lib/hooks/useApplications';
import { ApplicationWithDetails, ApplicationStatus } from '@/types';
import { KanbanColumn } from '@/components/board/kanban-column';
import { KanbanCard } from '@/components/board/kanban-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const columns: { id: ApplicationStatus; title: string; color: string }[] = [
  { id: 'applied', title: 'Applied', color: 'bg-blue-50 border-blue-200' },
  { id: 'interview_scheduled', title: 'Interview Scheduled', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'interview_completed', title: 'Interview Completed', color: 'bg-purple-50 border-purple-200' },
  { id: 'offer_received', title: 'Offer Received', color: 'bg-green-50 border-green-200' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-50 border-red-200' },
  { id: 'withdrawn', title: 'Withdrawn', color: 'bg-gray-50 border-gray-200' },
];

export default function BoardPage() {
  const { data: applications = [], isLoading } = useApplications();
  const updateApplication = useUpdateApplication();
  const [activeId, setActiveId] = useState<string | null>(null);

  const applicationsByStatus = useMemo(() => {
    const grouped = columns.reduce((acc, column) => {
      acc[column.id] = [];
      return acc;
    }, {} as Record<ApplicationStatus, ApplicationWithDetails[]>);

    applications.forEach((app) => {
      if (grouped[app.status]) {
        grouped[app.status].push(app);
      }
    });

    return grouped;
  }, [applications]);

  const activeApplication = useMemo(() => {
    if (!activeId) return null;
    return applications.find(app => app.id === activeId) || null;
  }, [activeId, applications]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the application being moved
    const application = applications.find(app => app.id === activeId);
    if (!application) return;

    // Determine the new status
    let newStatus: ApplicationStatus;

    // Check if dropped on a column or on a card
    if (columns.some(col => col.id === overId)) {
      // Dropped on a column
      newStatus = overId as ApplicationStatus;
    } else {
      // Dropped on a card, find the column containing that card
      const targetApplication = applications.find(app => app.id === overId);
      if (!targetApplication) return;
      newStatus = targetApplication.status;
    }

    // Only update if status actually changed
    if (application.status !== newStatus) {
      try {
        await updateApplication.mutateAsync({
          id: activeId,
          status: newStatus,
        });
      } catch (error) {
        console.error('Error updating application status:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading kanban board...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600 mt-1">
              Drag and drop applications to update their status
            </p>
          </div>
          <Link href="/applications/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Kanban Board */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[600px]">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                applications={applicationsByStatus[column.id]}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApplication ? (
              <KanbanCard application={activeApplication} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Plus className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first job application to see it on the board.
            </p>
            <Link href="/applications/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add First Application
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}