'use client';

import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { useCalendarEvents, CalendarEvent } from '@/lib/hooks/useCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  Clock,
  Building,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

// Import react-big-calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../app/calendar/calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  className?: string;
}

const eventTypeColors = {
  interview: {
    background: '#3B82F6',
    border: '#2563EB',
    text: '#FFFFFF',
  },
  deadline: {
    background: '#F59E0B',
    border: '#D97706',
    text: '#FFFFFF',
  },
  application: {
    background: '#10B981',
    border: '#059669',
    text: '#FFFFFF',
  },
  follow_up: {
    background: '#8B5CF6',
    border: '#7C3AED',
    text: '#FFFFFF',
  },
};

const eventTypeLabels = {
  interview: 'Interview',
  deadline: 'Deadline',
  application: 'Application',
  follow_up: 'Follow-up',
};

export function CalendarView({ className }: CalendarViewProps) {
  const { events } = useCalendarEvents();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.type === eventFilter);
  }, [events, eventFilter]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const colors = eventTypeColors[event.type];
    return (
      <div
        className="rbc-event-content"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.text,
          padding: '2px 4px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        <div className="truncate">{event.title}</div>
      </div>
    );
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-gray-900">{label}</h2>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('PREV')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('TODAY')}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('NEXT')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Event Type Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="interview">Interviews</SelectItem>
              <SelectItem value="deadline">Deadlines</SelectItem>
              <SelectItem value="application">Applications</SelectItem>
              <SelectItem value="follow_up">Follow-ups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Selector */}
        <div className="flex items-center space-x-1">
          <Button
            variant={view === Views.MONTH ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.MONTH)}
          >
            Month
          </Button>
          <Button
            variant={view === Views.WEEK ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.WEEK)}
          >
            Week
          </Button>
          <Button
            variant={view === Views.DAY ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.DAY)}
          >
            Day
          </Button>
          <Button
            variant={view === Views.AGENDA ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView(Views.AGENDA)}
          >
            Agenda
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Event Legend */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Event Types</h3>
            <div className="flex items-center space-x-4">
              {Object.entries(eventTypeColors).map(([type, colors]) => (
                <div key={type} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: colors.background }}
                  />
                  <span className="text-sm text-gray-600">
                    {eventTypeLabels[type as keyof typeof eventTypeLabels]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent,
              }}
              eventPropGetter={(event: CalendarEvent) => {
                const colors = eventTypeColors[event.type];
                return {
                  style: {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                    border: 'none',
                    borderRadius: '4px',
                  },
                };
              }}
              dayPropGetter={(date) => ({
                style: {
                  backgroundColor: moment(date).isSame(moment(), 'day') ? '#EFF6FF' : undefined,
                },
              })}
              min={new Date(2024, 0, 1, 8, 0, 0)} // 8:00 AM
              max={new Date(2024, 0, 1, 17, 0, 0)} // 5:00 PM
              formats={{
                timeGutterFormat: 'h:mm A',
                eventTimeRangeFormat: ({ start, end }) =>
                  `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
                dayHeaderFormat: 'dddd, MMMM DD',
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${moment(start).format('MMM DD')} - ${moment(end).format('MMM DD, YYYY')}`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: selectedEvent
                    ? eventTypeColors[selectedEvent.type].background
                    : '#gray',
                }}
              />
              <span>
                {selectedEvent
                  ? eventTypeLabels[selectedEvent.type as keyof typeof eventTypeLabels]
                  : 'Event'}
              </span>
            </DialogTitle>
            <DialogDescription>{selectedEvent?.title}</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Time */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {moment(selectedEvent.start).format('MMMM D, YYYY [at] h:mm A')}
                  {selectedEvent.type === 'interview' &&
                    ` - ${moment(selectedEvent.end).format('h:mm A')}`}
                </span>
              </div>

              {/* Company */}
              {selectedEvent.resource?.company_name && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedEvent.resource.company_name}</span>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="text-sm text-gray-600">
                  {selectedEvent.description}
                </div>
              )}

              {/* Status Badge */}
              {selectedEvent.resource?.status && (
                <div>
                  <Badge variant="outline">
                    {selectedEvent.resource.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4">
                {selectedEvent.resource?.application_id && (
                  <Link href={`/applications/${selectedEvent.resource.application_id}`}>
                    <Button size="sm" variant="outline">
                      View Application
                    </Button>
                  </Link>
                )}
                {selectedEvent.type === 'interview' && selectedEvent.resource?.interview_id && (
                  <Link href={`/applications/${selectedEvent.resource.application_id}?tab=interviews`}>
                    <Button size="sm">
                      View Interview
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}