'use client';

import { useMemo } from 'react';
import { useApplications } from './useApplications';
import { useInterviews } from './useInterviews';
import moment from 'moment';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'interview' | 'deadline' | 'application' | 'follow_up';
  description?: string;
  resource?: {
    id: string;
    application_id?: string;
    interview_id?: string;
    status?: string;
    priority?: string;
    company_name?: string;
    job_title?: string;
  };
}

export function useCalendarEvents() {
  const { data: applications = [] } = useApplications();
  const { data: interviews = [] } = useInterviews();

  const events = useMemo((): CalendarEvent[] => {
    const calendarEvents: CalendarEvent[] = [];

    // Add interview events
    interviews.forEach((interview) => {
      const application = applications.find(app => app.id === interview.application_id);
      const startTime = moment(interview.scheduled_at).toDate();
      const endTime = moment(interview.scheduled_at)
        .add(interview.duration_minutes || 60, 'minutes')
        .toDate();

      calendarEvents.push({
        id: `interview-${interview.id}`,
        title: `${interview.interview_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${application?.company_name || 'Interview'}`,
        start: startTime,
        end: endTime,
        type: 'interview',
        description: `${application?.job_title || 'Position'} at ${application?.company_name || 'Company'}`,
        resource: {
          id: interview.id,
          interview_id: interview.id,
          application_id: interview.application_id,
          status: interview.outcome || 'pending',
          company_name: application?.company_name,
          job_title: application?.job_title,
        },
      });
    });

    // Add application deadline events
    applications.forEach((application) => {
      if (application.deadline) {
        const deadlineDate = moment(application.deadline).toDate();
        const deadlineEndDate = moment(application.deadline).add(1, 'hour').toDate();

        calendarEvents.push({
          id: `deadline-${application.id}`,
          title: `Deadline: ${application.job_title} at ${application.company_name}`,
          start: deadlineDate,
          end: deadlineEndDate,
          type: 'deadline',
          description: `Application deadline for ${application.job_title}`,
          resource: {
            id: application.id,
            application_id: application.id,
            status: application.status,
            priority: application.priority,
            company_name: application.company_name,
            job_title: application.job_title,
          },
        });
      }
    });

    // Add application submission dates
    applications.forEach((application) => {
      const applicationDate = moment(application.application_date).toDate();
      const applicationEndDate = moment(application.application_date).add(1, 'hour').toDate();

      calendarEvents.push({
        id: `application-${application.id}`,
        title: `Applied: ${application.job_title} at ${application.company_name}`,
        start: applicationDate,
        end: applicationEndDate,
        type: 'application',
        description: `Submitted application for ${application.job_title}`,
        resource: {
          id: application.id,
          application_id: application.id,
          status: application.status,
          priority: application.priority,
          company_name: application.company_name,
          job_title: application.job_title,
        },
      });
    });

    // Add follow-up reminders (for applications that need follow-up)
    applications
      .filter(app => app.status === 'applied' && moment().diff(moment(app.application_date), 'days') >= 7)
      .forEach((application) => {
        const followUpDate = moment(application.application_date).add(2, 'weeks').toDate();
        const followUpEndDate = moment(followUpDate).add(1, 'hour').toDate();

        calendarEvents.push({
          id: `follow-up-${application.id}`,
          title: `Follow up: ${application.job_title} at ${application.company_name}`,
          start: followUpDate,
          end: followUpEndDate,
          type: 'follow_up',
          description: `Follow up on application for ${application.job_title}`,
          resource: {
            id: application.id,
            application_id: application.id,
            status: application.status,
            priority: application.priority,
            company_name: application.company_name,
            job_title: application.job_title,
          },
        });
      });

    return calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [applications, interviews]);

  return { events };
}

export function useUpcomingEvents(limit = 5) {
  const { events } = useCalendarEvents();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => event.start > now)
      .slice(0, limit);
  }, [events, limit]);

  return { upcomingEvents };
}

export function useEventsByType() {
  const { events } = useCalendarEvents();

  const eventsByType = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = [];
      }
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  return { eventsByType };
}

export function useTodaysEvents() {
  const { events } = useCalendarEvents();

  const todaysEvents = useMemo(() => {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');

    return events.filter(event => {
      const eventStart = moment(event.start);
      return eventStart.isSameOrAfter(today) && eventStart.isBefore(tomorrow);
    });
  }, [events]);

  return { todaysEvents };
}