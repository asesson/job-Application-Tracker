import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './google-auth';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  etag?: string;
  updated?: string;
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export class GoogleCalendarClient {
  private authService: GoogleAuthService;

  constructor() {
    this.authService = new GoogleAuthService();
  }

  /**
   * Get authenticated calendar client for a user
   */
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    const authClient = await this.authService.getAuthenticatedClientForUser(userId);

    if (!authClient) {
      return null;
    }

    return google.calendar({ version: 'v3', auth: authClient });
  }

  /**
   * Get list of user's calendars
   */
  async getCalendars(userId: string): Promise<GoogleCalendar[]> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.calendarList.list({
        minAccessRole: 'writer', // Only calendars user can write to
      });

      return (response.data.items || []).map(item => ({
        id: item.id!,
        summary: item.summary!,
        description: item.description,
        primary: item.primary,
        accessRole: item.accessRole!,
      }));
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw new Error('Failed to fetch Google calendars');
    }
  }

  /**
   * Get primary calendar for a user
   */
  async getPrimaryCalendar(userId: string): Promise<GoogleCalendar | null> {
    const calendars = await this.getCalendars(userId);
    return calendars.find(cal => cal.primary) || calendars[0] || null;
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(
    userId: string,
    calendarId: string,
    event: Omit<GoogleCalendarEvent, 'id' | 'etag' | 'updated'>
  ): Promise<GoogleCalendarEvent> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
      });

      return {
        id: response.data.id!,
        summary: response.data.summary!,
        description: response.data.description,
        start: response.data.start!,
        end: response.data.end!,
        location: response.data.location,
        colorId: response.data.colorId,
        etag: response.data.etag,
        updated: response.data.updated,
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    event: Omit<GoogleCalendarEvent, 'id' | 'etag' | 'updated'>
  ): Promise<GoogleCalendarEvent> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
      });

      return {
        id: response.data.id!,
        summary: response.data.summary!,
        description: response.data.description,
        start: response.data.start!,
        end: response.data.end!,
        location: response.data.location,
        colorId: response.data.colorId,
        etag: response.data.etag,
        updated: response.data.updated,
      };
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update Google Calendar event');
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete Google Calendar event');
    }
  }

  /**
   * Get an event from Google Calendar
   */
  async getEvent(
    userId: string,
    calendarId: string,
    eventId: string
  ): Promise<GoogleCalendarEvent | null> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.events.get({
        calendarId,
        eventId,
      });

      return {
        id: response.data.id!,
        summary: response.data.summary!,
        description: response.data.description,
        start: response.data.start!,
        end: response.data.end!,
        location: response.data.location,
        colorId: response.data.colorId,
        etag: response.data.etag,
        updated: response.data.updated,
      };
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) {
        return null; // Event not found
      }
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch Google Calendar event');
    }
  }

  /**
   * Get events from Google Calendar within a date range
   */
  async getEvents(
    userId: string,
    calendarId: string,
    timeMin?: Date,
    timeMax?: Date,
    maxResults = 250
  ): Promise<GoogleCalendarEvent[]> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (response.data.items || []).map(item => ({
        id: item.id!,
        summary: item.summary || 'Untitled Event',
        description: item.description,
        start: item.start!,
        end: item.end!,
        location: item.location,
        colorId: item.colorId,
        etag: item.etag,
        updated: item.updated,
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch Google Calendar events');
    }
  }

  /**
   * Watch for changes to a calendar (for webhooks)
   */
  async watchCalendar(
    userId: string,
    calendarId: string,
    webhookUrl: string,
    channelId: string
  ): Promise<{ id: string; resourceId: string; expiration: string }> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      const response = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
        },
      });

      return {
        id: response.data.id!,
        resourceId: response.data.resourceId!,
        expiration: response.data.expiration!,
      };
    } catch (error) {
      console.error('Error setting up calendar watch:', error);
      throw new Error('Failed to set up Google Calendar watch');
    }
  }

  /**
   * Stop watching a calendar
   */
  async stopWatchingCalendar(
    userId: string,
    channelId: string,
    resourceId: string
  ): Promise<void> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      throw new Error('User not authenticated with Google Calendar');
    }

    try {
      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
        },
      });
    } catch (error) {
      console.error('Error stopping calendar watch:', error);
      throw new Error('Failed to stop Google Calendar watch');
    }
  }
}