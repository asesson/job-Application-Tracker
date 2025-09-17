'use client';

import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { useAllCalendarEvents, CalendarEvent } from '@/lib/hooks/useCalendar';
import { useDeleteCalendarEvent } from '@/lib/hooks/useCalendarEvents';
import { useGoogleCalendarStatus } from '@/lib/hooks/useGoogleCalendarStatus';
import { QuickEventForm } from './quick-event-form';
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
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
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
  custom: {
    background: '#3B82F6',
    border: '#2563EB',
    text: '#FFFFFF',
  },
  interview_prep: {
    background: '#8B5CF6',
    border: '#7C3AED',
    text: '#FFFFFF',
  },
  networking: {
    background: '#10B981',
    border: '#059669',
    text: '#FFFFFF',
  },
  meeting: {
    background: '#EF4444',
    border: '#DC2626',
    text: '#FFFFFF',
  },
  reminder: {
    background: '#6B7280',
    border: '#4B5563',
    text: '#FFFFFF',
  },
  other: {
    background: '#14B8A6',
    border: '#0F766E',
    text: '#FFFFFF',
  },
};

const eventTypeLabels = {
  interview: 'Interview',
  deadline: 'Deadline',
  application: 'Application',
  follow_up: 'Follow-up',
  custom: 'Job Search Activities',
  interview_prep: 'Interview Prep',
  networking: 'Networking',
  meeting: 'Meeting',
  reminder: 'Reminder',
  other: 'Other',
};

export function CalendarView({ className }: CalendarViewProps) {
  const { events } = useAllCalendarEvents();
  const deleteEvent = useDeleteCalendarEvent();
  const { connected: googleConnected, settings: googleSettings } = useGoogleCalendarStatus();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [showQuickEventForm, setShowQuickEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEventSlot, setNewEventSlot] = useState<{ start: Date; end: Date } | null>(null);

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

  // Handle clicking on empty calendar space to create new event
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setNewEventSlot({ start: slotInfo.start, end: slotInfo.end });
    setEditingEvent(null);
    setShowQuickEventForm(true);
  }, []);

  // Handle editing custom events
  const handleEditEvent = (event: CalendarEvent) => {
    if (event.resource?.event_id) {
      // This is a custom event, we can edit it
      setEditingEvent({
        id: event.resource.event_id,
        title: event.title,
        description: event.description,
        start_time: event.start.toISOString(),
        end_time: event.end.toISOString(),
        event_type: event.type,
        color: event.color,
        application_id: event.resource.application_id,
        location: event.resource.location,
        notes: event.resource.notes,
      });
      setNewEventSlot(null);
      setShowQuickEventForm(true);
    }
  };

  // Handle deleting custom events
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (event.resource?.event_id && confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent.mutateAsync(event.resource.event_id);
        setShowEventDialog(false);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const colors = event.color ? {
      background: event.color,
      border: event.color,
      text: '#FFFFFF',
    } : eventTypeColors[event.type] || eventTypeColors.custom;

    // Determine if this event type should be synced based on settings
    const shouldSync = googleConnected && googleSettings && (
      (event.type === 'interview' && googleSettings.sync_interviews) ||
      (event.type === 'deadline' && googleSettings.sync_deadlines) ||
      (event.type === 'application' && googleSettings.sync_applications) ||
      (event.type === 'follow_up' && googleSettings.sync_follow_ups) ||
      (event.type === 'custom' && googleSettings.sync_custom_events) ||
      (event.type === 'interview_prep' && googleSettings.sync_custom_events) ||
      (event.type === 'networking' && googleSettings.sync_custom_events) ||
      (event.type === 'meeting' && googleSettings.sync_custom_events) ||
      (event.type === 'reminder' && googleSettings.sync_custom_events) ||
      (event.type === 'other' && googleSettings.sync_custom_events)
    );

    // Check if event is synced (has google_event_id in resource)
    const isSynced = event.resource?.google_event_id ||
      (event.id.startsWith('custom-') && event.resource?.event_id);

    return (
      <div
        className="rbc-event-content relative"
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
        <div className="flex items-center">
          <div className="truncate flex-1">{event.title}</div>
          {googleConnected && shouldSync && (
            <div className="ml-1 flex-shrink-0">
              {isSynced ? (
                <Cloud className="h-3 w-3 opacity-75" />
              ) : (
                <CloudOff className="h-3 w-3 opacity-75" />
              )}
            </div>
          )}
        </div>
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
        {/* Google Calendar Status */}
        {googleConnected && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Cloud className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Google Calendar</span>
            {googleSettings?.last_sync_at && (
              <span className="text-xs text-green-600">
                • Last sync: {moment(googleSettings.last_sync_at).fromNow()}
              </span>
            )}
          </div>
        )}

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
              onSelectSlot={handleSelectSlot}
              selectable={true}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent,
              }}
              eventPropGetter={(event: CalendarEvent) => {
                const colors = event.color ? {
                  background: event.color,
                  border: event.color,
                  text: '#FFFFFF',
                } : eventTypeColors[event.type] || eventTypeColors.custom;

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
              scrollToTime={new Date(2024, 0, 1, 8, 0, 0)} // Scroll to 8:00 AM by default
              // No min/max to allow full 24-hour access
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

              {/* Google Calendar Sync Status */}
              {googleConnected && (
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const shouldSync = googleSettings && (
                        (selectedEvent.type === 'interview' && googleSettings.sync_interviews) ||
                        (selectedEvent.type === 'deadline' && googleSettings.sync_deadlines) ||
                        (selectedEvent.type === 'application' && googleSettings.sync_applications) ||
                        (selectedEvent.type === 'follow_up' && googleSettings.sync_follow_ups) ||
                        (selectedEvent.type === 'custom' && googleSettings.sync_custom_events) ||
                        (selectedEvent.type === 'interview_prep' && googleSettings.sync_custom_events) ||
                        (selectedEvent.type === 'networking' && googleSettings.sync_custom_events) ||
                        (selectedEvent.type === 'meeting' && googleSettings.sync_custom_events) ||
                        (selectedEvent.type === 'reminder' && googleSettings.sync_custom_events) ||
                        (selectedEvent.type === 'other' && googleSettings.sync_custom_events)
                      );

                      const isSynced = selectedEvent.resource?.google_event_id ||
                        (selectedEvent.id.startsWith('custom-') && selectedEvent.resource?.event_id);

                      if (!googleSettings?.sync_enabled) {
                        return (
                          <>
                            <CloudOff className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Google Calendar sync disabled</span>
                          </>
                        );
                      } else if (!shouldSync) {
                        return (
                          <>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">This event type is not synced</span>
                          </>
                        );
                      } else if (isSynced) {
                        return (
                          <>
                            <Cloud className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">Synced with Google Calendar</span>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <RefreshCw className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600">Pending sync to Google Calendar</span>
                          </>
                        );
                      }
                    })()}
                  </div>
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
                    <Button size="sm" variant="outline">
                      View Interview
                    </Button>
                  </Link>
                )}
                {selectedEvent.resource?.event_id && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(selectedEvent)}
                    >
                      Edit Event
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEvent(selectedEvent)}
                    >
                      Delete Event
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Event Form Dialog */}
      <QuickEventForm
        open={showQuickEventForm}
        onOpenChange={setShowQuickEventForm}
        defaultStart={newEventSlot?.start}
        defaultEnd={newEventSlot?.end}
        event={editingEvent}
        onSuccess={() => {
          setShowQuickEventForm(false);
          setEditingEvent(null);
          setNewEventSlot(null);
        }}
      />
    </div>
  );
}