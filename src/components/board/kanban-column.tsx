'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ApplicationWithDetails, ApplicationStatus } from '@/types';
import { KanbanCard } from './kanban-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  id: ApplicationStatus;
  title: string;
  color: string;
  applications: ApplicationWithDetails[];
}

export function KanbanColumn({ id, title, color, applications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card className={`${color} ${isOver ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          <Badge variant="secondary" className="ml-2">
            {applications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="space-y-3 min-h-[500px] pb-4"
      >
        <SortableContext
          items={applications.map(app => app.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((application) => (
            <KanbanCard key={application.id} application={application} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Drop applications here
          </div>
        )}
      </CardContent>
    </Card>
  );
}