'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CalendarView } from '@/components/calendar/calendar-view';
import { useUpcomingEvents, useTodaysEvents } from '@/lib/hooks/useCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  TrendingUp,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import moment from 'moment';

export default function CalendarPage() {
  const { upcomingEvents } = useUpcomingEvents(5);
  const { todaysEvents } = useTodaysEvents();

  const eventTypeColors = {
    interview: 'bg-blue-100 text-blue-800',
    deadline: 'bg-yellow-100 text-yellow-800',
    application: 'bg-green-100 text-green-800',
    follow_up: 'bg-purple-100 text-purple-800',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">
              Track your interviews, deadlines, and job search activities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/applications/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Events & Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysEvents.length > 0 ? (
                <div className="space-y-3">
                  {todaysEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                event.type === 'interview' ? '#3B82F6' :
                                event.type === 'deadline' ? '#F59E0B' :
                                event.type === 'application' ? '#10B981' : '#8B5CF6'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3" />
                            {moment(event.start).format('h:mm A')}
                            {event.type === 'interview' &&
                              ` - ${moment(event.end).format('h:mm A')}`
                            }
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={eventTypeColors[event.type]}
                        variant="secondary"
                      >
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No events scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                event.type === 'interview' ? '#3B82F6' :
                                event.type === 'deadline' ? '#F59E0B' :
                                event.type === 'application' ? '#10B981' : '#8B5CF6'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3" />
                            {moment(event.start).format('MMM D, h:mm A')}
                            {event.resource?.company_name && (
                              <>
                                <Building className="ml-2 mr-1 h-3 w-3" />
                                {event.resource.company_name}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={eventTypeColors[event.type]}
                        variant="secondary"
                      >
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <CalendarView />
      </div>
    </DashboardLayout>
  );
}