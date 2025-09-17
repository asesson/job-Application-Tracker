import { GoogleCalendarClient, GoogleCalendarEvent } from './google-calendar-client';
import { createServerSupabaseClient } from '../supabase/server';
import { CalendarEvent } from '../hooks/useCalendar';
import moment from 'moment';

export interface SyncSettings {
  userId: string;
  googleCalendarId: string;
  syncInterviews: boolean;
  syncDeadlines: boolean;
  syncApplications: boolean;
  syncFollowUps: boolean;
  syncCustomEvents: boolean;
}

export interface SyncResult {
  success: boolean;
  eventsProcessed: number;
  errorsCount: number;
  errors: string[];
  message: string;
}

export class CalendarSyncService {
  private googleClient: GoogleCalendarClient;

  constructor() {
    this.googleClient = new GoogleCalendarClient();
  }

  /**
   * Get sync settings for a user
   */
  async getSyncSettings(userId: string): Promise<SyncSettings | null> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('google_calendar_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.sync_enabled) {
      return null;
    }

    return {
      userId,
      googleCalendarId: data.google_calendar_id,
      syncInterviews: data.sync_interviews,
      syncDeadlines: data.sync_deadlines,
      syncApplications: data.sync_applications,
      syncFollowUps: data.sync_follow_ups,
      syncCustomEvents: data.sync_custom_events,
    };
  }

  /**
   * Convert app event to Google Calendar event format
   */
  private convertAppEventToGoogle(appEvent: CalendarEvent): Omit<GoogleCalendarEvent, 'id' | 'etag' | 'updated'> {
    const isAllDay = this.isAllDayEvent(appEvent);

    let colorId = '1'; // Default blue
    switch (appEvent.type) {
      case 'interview':
        colorId = '9'; // Blue
        break;
      case 'deadline':
        colorId = '5'; // Yellow
        break;
      case 'application':
        colorId = '2'; // Green
        break;
      case 'follow_up':
        colorId = '3'; // Purple
        break;
      case 'custom':
      default:
        colorId = '1'; // Blue
        break;
    }

    const event: Omit<GoogleCalendarEvent, 'id' | 'etag' | 'updated'> = {
      summary: appEvent.title,
      description: this.buildEventDescription(appEvent),
      colorId,
    };

    if (isAllDay) {
      event.start = {
        date: moment(appEvent.start).format('YYYY-MM-DD'),
      };
      event.end = {
        date: moment(appEvent.end).format('YYYY-MM-DD'),
      };
    } else {
      event.start = {
        dateTime: appEvent.start.toISOString(),
        timeZone: 'America/New_York', // Default timezone
      };
      event.end = {
        dateTime: appEvent.end.toISOString(),
        timeZone: 'America/New_York',
      };
    }

    if (appEvent.resource?.location) {
      event.location = appEvent.resource.location;
    }

    return event;
  }

  /**
   * Convert Google Calendar event to app event format
   */
  private convertGoogleEventToApp(googleEvent: GoogleCalendarEvent, userId: string): any {
    const isAllDay = !!googleEvent.start.date;

    let startDate: Date;
    let endDate: Date;

    if (isAllDay) {
      startDate = moment(googleEvent.start.date).toDate();
      endDate = moment(googleEvent.end.date).toDate();
    } else {
      startDate = new Date(googleEvent.start.dateTime!);
      endDate = new Date(googleEvent.end.dateTime!);
    }

    return {
      user_id: userId,
      title: googleEvent.summary,
      description: googleEvent.description,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      event_type: 'custom', // All imported events are custom
      all_day: isAllDay,
      location: googleEvent.location,
      google_event_id: googleEvent.id,
      sync_with_google: true,
    };
  }

  /**
   * Check if an event should be treated as all-day
   */
  private isAllDayEvent(appEvent: CalendarEvent): boolean {
    const duration = moment(appEvent.end).diff(moment(appEvent.start), 'hours');
    return appEvent.type === 'deadline' || appEvent.type === 'application' || duration >= 24;
  }

  /**
   * Build event description with job search context
   */
  private buildEventDescription(appEvent: CalendarEvent): string {
    let description = appEvent.description || '';

    if (appEvent.resource?.company_name) {
      description += `\n\nCompany: ${appEvent.resource.company_name}`;
    }

    if (appEvent.resource?.job_title) {
      description += `\nPosition: ${appEvent.resource.job_title}`;
    }

    if (appEvent.resource?.status) {
      description += `\nStatus: ${appEvent.resource.status.replace('_', ' ').toUpperCase()}`;
    }

    description += '\n\n📝 Created by Job Application Tracker';

    return description.trim();
  }

  /**
   * Sync app events to Google Calendar
   */
  async syncAppEventsToGoogle(userId: string): Promise<SyncResult> {
    const settings = await this.getSyncSettings(userId);
    if (!settings) {
      return {
        success: false,
        eventsProcessed: 0,
        errorsCount: 1,
        errors: ['Google Calendar sync not enabled for user'],
        message: 'Sync not enabled',
      };
    }

    const supabase = await createServerSupabaseClient();
    const errors: string[] = [];
    let eventsProcessed = 0;

    try {
      // Get app events that need syncing
      const appEvents = await this.getAppEventsToSync(userId, settings);

      for (const appEvent of appEvents) {
        try {
          await this.syncSingleAppEventToGoogle(userId, appEvent, settings.googleCalendarId);
          eventsProcessed++;
        } catch (error) {
          const errorMsg = `Failed to sync event "${appEvent.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      // Update last sync time
      await supabase
        .from('google_calendar_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId);

      return {
        success: errors.length === 0,
        eventsProcessed,
        errorsCount: errors.length,
        errors,
        message: `Synced ${eventsProcessed} events to Google Calendar`,
      };
    } catch (error) {
      const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        success: false,
        eventsProcessed,
        errorsCount: 1,
        errors: [errorMsg],
        message: errorMsg,
      };
    }
  }

  /**
   * Sync Google Calendar events to app
   */
  async syncGoogleEventsToApp(userId: string): Promise<SyncResult> {
    const settings = await this.getSyncSettings(userId);
    if (!settings) {
      return {
        success: false,
        eventsProcessed: 0,
        errorsCount: 1,
        errors: ['Google Calendar sync not enabled for user'],
        message: 'Sync not enabled',
      };
    }

    const errors: string[] = [];
    let eventsProcessed = 0;

    try {
      // Get events from Google Calendar from the last 30 days forward
      const timeMin = moment().subtract(30, 'days').toDate();
      const timeMax = moment().add(6, 'months').toDate();

      const googleEvents = await this.googleClient.getEvents(
        userId,
        settings.googleCalendarId,
        timeMin,
        timeMax
      );

      // Filter out events that originated from our app
      const externalEvents = googleEvents.filter(event =>
        !event.description?.includes('📝 Created by Job Application Tracker')
      );

      for (const googleEvent of externalEvents) {
        try {
          await this.syncSingleGoogleEventToApp(userId, googleEvent);
          eventsProcessed++;
        } catch (error) {
          const errorMsg = `Failed to sync Google event "${googleEvent.summary}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      return {
        success: errors.length === 0,
        eventsProcessed,
        errorsCount: errors.length,
        errors,
        message: `Synced ${eventsProcessed} events from Google Calendar`,
      };
    } catch (error) {
      const errorMsg = `Google sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return {
        success: false,
        eventsProcessed,
        errorsCount: 1,
        errors: [errorMsg],
        message: errorMsg,
      };
    }
  }

  /**
   * Perform bidirectional sync
   */
  async performBidirectionalSync(userId: string): Promise<SyncResult> {
    const [appToGoogleResult, googleToAppResult] = await Promise.all([
      this.syncAppEventsToGoogle(userId),
      this.syncGoogleEventsToApp(userId),
    ]);

    const combinedResult: SyncResult = {
      success: appToGoogleResult.success && googleToAppResult.success,
      eventsProcessed: appToGoogleResult.eventsProcessed + googleToAppResult.eventsProcessed,
      errorsCount: appToGoogleResult.errorsCount + googleToAppResult.errorsCount,
      errors: [...appToGoogleResult.errors, ...googleToAppResult.errors],
      message: `Bidirectional sync completed: ${appToGoogleResult.eventsProcessed} events to Google, ${googleToAppResult.eventsProcessed} events from Google`,
    };

    // Log sync activity
    await this.logSyncActivity(userId, 'bidirectional', combinedResult);

    return combinedResult;
  }

  /**
   * Get app events that need syncing to Google
   */
  private async getAppEventsToSync(userId: string, settings: SyncSettings): Promise<CalendarEvent[]> {
    const supabase = await createServerSupabaseClient();

    // Get applications for the user
    const { data: applications } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId);

    // Get interviews for the user
    const { data: interviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId);

    // Get custom calendar events
    const { data: customEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_with_google', true);

    const events: CalendarEvent[] = [];

    // Add interview events if enabled
    if (settings.syncInterviews && interviews) {
      interviews.forEach((interview) => {
        const application = applications?.find(app => app.id === interview.application_id);
        const startTime = moment(interview.scheduled_at).toDate();
        const endTime = moment(interview.scheduled_at)
          .add(interview.duration_minutes || 60, 'minutes')
          .toDate();

        events.push({
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
    }

    // Add deadline events if enabled
    if (settings.syncDeadlines && applications) {
      applications
        .filter(app => app.deadline)
        .forEach((application) => {
          const deadlineDate = moment(application.deadline, 'YYYY-MM-DD').startOf('day').toDate();
          const deadlineEndDate = moment(application.deadline, 'YYYY-MM-DD').startOf('day').add(1, 'hour').toDate();

          events.push({
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
        });
    }

    // Add custom events if enabled
    if (settings.syncCustomEvents && customEvents) {
      customEvents.forEach((customEvent) => {
        const application = customEvent.application_id
          ? applications?.find(app => app.id === customEvent.application_id)
          : null;

        events.push({
          id: `custom-${customEvent.id}`,
          title: customEvent.title,
          start: moment(customEvent.start_time).toDate(),
          end: moment(customEvent.end_time).toDate(),
          type: customEvent.event_type as any,
          description: customEvent.description,
          color: customEvent.color,
          resource: {
            id: customEvent.id,
            event_id: customEvent.id,
            application_id: customEvent.application_id,
            company_name: application?.company_name,
            job_title: application?.job_title,
            location: customEvent.location,
            notes: customEvent.notes,
            event_type: customEvent.event_type,
          },
        });
      });
    }

    return events;
  }

  /**
   * Sync a single app event to Google Calendar
   */
  private async syncSingleAppEventToGoogle(
    userId: string,
    appEvent: CalendarEvent,
    googleCalendarId: string
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    // Check if this event is already synced
    const { data: mapping } = await supabase
      .from('google_calendar_event_mappings')
      .select('*')
      .eq('user_id', userId)
      .eq('app_event_type', appEvent.type)
      .eq('app_event_reference_id', appEvent.resource?.id)
      .single();

    const googleEvent = this.convertAppEventToGoogle(appEvent);

    if (mapping && mapping.google_event_id) {
      // Update existing event
      try {
        const updatedEvent = await this.googleClient.updateEvent(
          userId,
          googleCalendarId,
          mapping.google_event_id,
          googleEvent
        );

        // Update mapping
        await supabase
          .from('google_calendar_event_mappings')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            etag: updatedEvent.etag,
          })
          .eq('id', mapping.id);
      } catch (error) {
        // Event might have been deleted in Google, create a new one
        const newEvent = await this.googleClient.createEvent(userId, googleCalendarId, googleEvent);

        await supabase
          .from('google_calendar_event_mappings')
          .update({
            google_event_id: newEvent.id,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            etag: newEvent.etag,
          })
          .eq('id', mapping.id);
      }
    } else {
      // Create new event
      const newEvent = await this.googleClient.createEvent(userId, googleCalendarId, googleEvent);

      // Create mapping
      await supabase
        .from('google_calendar_event_mappings')
        .insert({
          user_id: userId,
          app_event_type: appEvent.type,
          app_event_reference_id: appEvent.resource?.id,
          app_event_id: appEvent.resource?.event_id || null,
          google_calendar_id: googleCalendarId,
          google_event_id: newEvent.id,
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
          etag: newEvent.etag,
        });
    }
  }

  /**
   * Sync a single Google Calendar event to app
   */
  private async syncSingleGoogleEventToApp(
    userId: string,
    googleEvent: GoogleCalendarEvent
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    // Check if this Google event is already synced
    const { data: mapping } = await supabase
      .from('google_calendar_event_mappings')
      .select('*')
      .eq('user_id', userId)
      .eq('google_event_id', googleEvent.id)
      .single();

    if (mapping) {
      // Update existing app event if it's a custom event
      if (mapping.app_event_id) {
        const appEventData = this.convertGoogleEventToApp(googleEvent, userId);

        await supabase
          .from('calendar_events')
          .update({
            ...appEventData,
            last_google_sync: new Date().toISOString(),
          })
          .eq('id', mapping.app_event_id);
      }
    } else {
      // Create new custom event in app
      const appEventData = this.convertGoogleEventToApp(googleEvent, userId);

      const { data: newEvent } = await supabase
        .from('calendar_events')
        .insert(appEventData)
        .select()
        .single();

      if (newEvent) {
        // Create mapping
        await supabase
          .from('google_calendar_event_mappings')
          .insert({
            user_id: userId,
            app_event_type: 'custom',
            app_event_id: newEvent.id,
            google_calendar_id: 'primary', // Default calendar
            google_event_id: googleEvent.id!,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            last_modified_source: 'google',
            etag: googleEvent.etag,
          });
      }
    }
  }

  /**
   * Log sync activity for monitoring
   */
  private async logSyncActivity(
    userId: string,
    syncType: 'full' | 'partial' | 'single_event',
    result: SyncResult
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    await supabase
      .from('google_calendar_sync_logs')
      .insert({
        user_id: userId,
        sync_type: syncType,
        sync_direction: 'bidirectional',
        status: result.success ? 'success' : 'error',
        events_processed: result.eventsProcessed,
        errors_count: result.errorsCount,
        message: result.message,
        error_details: result.errors.length > 0 ? { errors: result.errors } : null,
        completed_at: new Date().toISOString(),
      });
  }
}