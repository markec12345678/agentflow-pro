/**
 * AgentFlow Pro - Google Calendar Integration
 * Two-way sync with Google Calendar and iCal feed generation
 */

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  calendarId: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
}

export interface CalendarEvent {
  eventId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  attendees: string[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'default';
  reminders: Reminder[];
  recurrence?: RecurrenceRule[];
  attachments?: Attachment[];
  metadata?: {
    bookingId?: string;
    guestName?: string;
    channelId?: string;
    propertyId?: string;
  };
}

export interface Reminder {
  method: 'email' | 'popup' | 'sms';
  minutes: number;
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonthDay?: number[];
}

export interface Attachment {
  title: string;
  fileUrl: string;
  mimeType: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: Array<{ eventId: string; error: string }>;
  lastSync: Date;
}

export interface ICalFeed {
  url: string;
  propertyId: string;
  timezone: string;
  includeBookings: boolean;
  includeBlockedDates: boolean;
  includeAvailability: boolean;
  lastUpdated: Date;
}

export class GoogleCalendarIntegration {
  private config: GoogleCalendarConfig;
  private accessToken?: string;
  private refreshToken?: string;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
  }

  /**
   * Authenticate with Google OAuth
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  /**
   * Push booking to Google Calendar
   */
  async createEvent(booking: {
    bookingId: string;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    propertyId: string;
    channelId?: string;
  }): Promise<CalendarEvent> {
    await this.ensureAuthenticated();

    const event: gapi.client.calendar.Event = {
      summary: `Booking: ${booking.guestName}`,
      description: `Booking ID: ${booking.bookingId}\nProperty: ${booking.propertyId}\nChannel: ${booking.channelId || 'Direct'}`,
      location: booking.propertyId,
      start: {
        date: booking.checkIn.toISOString().split('T')[0],
        timeZone: 'Europe/Ljubljana',
      },
      end: {
        date: booking.checkOut.toISOString().split('T')[0],
        timeZone: 'Europe/Ljubljana',
      },
      transparency: 'opaque',
      status: 'confirmed',
      visibility: 'private',
      extendedProperties: {
        private: {
          bookingId: booking.bookingId,
          propertyId: booking.propertyId,
          channelId: booking.channelId || 'direct',
          type: 'booking',
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 1 day before
          { method: 'popup', minutes: 60 },   // 1 hour before
        ],
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const data = await response.json();
    return this.convertToCalendarEvent(data);
  }

  /**
   * Update booking in Google Calendar
   */
  async updateEvent(
    eventId: string,
    updates: Partial<{
      guestName: string;
      checkIn: Date;
      checkOut: Date;
      status: 'confirmed' | 'cancelled';
    }>
  ): Promise<CalendarEvent> {
    await this.ensureAuthenticated();

    // Fetch existing event
    const existingEvent = await this.getEvent(eventId);

    const updatedEvent: gapi.client.calendar.Event = {
      ...existingEvent,
      summary: updates.guestName ? `Booking: ${updates.guestName}` : existingEvent.summary,
      start: updates.checkIn
        ? {
            date: updates.checkIn.toISOString().split('T')[0],
            timeZone: 'Europe/Ljubljana',
          }
        : existingEvent.start,
      end: updates.checkOut
        ? {
            date: updates.checkOut.toISOString().split('T')[0],
            timeZone: 'Europe/Ljubljana',
          }
        : existingEvent.end,
      status: updates.status === 'cancelled' ? 'cancelled' : existingEvent.status,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    const data = await response.json();
    return this.convertToCalendarEvent(data);
  }

  /**
   * Delete booking from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.ensureAuthenticated();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Get events from Google Calendar
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    await this.ensureAuthenticated();

    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items.map((item: any) => this.convertToCalendarEvent(item));
  }

  /**
   * Get single event
   */
  async getEvent(eventId: string): Promise<gapi.client.calendar.Event> {
    await this.ensureAuthenticated();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(this.config.calendarId)}/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }

    return response.json();
  }

  /**
   * Generate iCal feed URL
   */
  generateICalFeed(propertyId: string, options?: {
    includeBookings?: boolean;
    includeBlockedDates?: boolean;
    includeAvailability?: boolean;
  }): ICalFeed {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentflow.pro';
    const params = new URLSearchParams({
      propertyId,
      includeBookings: options?.includeBookings?.toString() || 'true',
      includeBlockedDates: options?.includeBlockedDates?.toString() || 'true',
      includeAvailability: options?.includeAvailability?.toString() || 'false',
    });

    return {
      url: `${baseUrl}/api/calendar/ical?${params}`,
      propertyId,
      timezone: 'Europe/Ljubljana',
      includeBookings: options?.includeBookings ?? true,
      includeBlockedDates: options?.includeBlockedDates ?? true,
      includeAvailability: options?.includeAvailability ?? false,
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate iCal file content
   */
  generateICalContent(events: CalendarEvent[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AgentFlow Pro//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AgentFlow Pro - Property Calendar',
      'X-WR-TIMEZONE:Europe/Ljubljana',
    ];

    events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.eventId}@agentflow.pro`);
      lines.push(`DTSTAMP:${this.formatICalDate(new Date())}`);
      lines.push(`DTSTART:${this.formatICalDate(event.start, event.allDay)}`);
      lines.push(`DTEND:${this.formatICalDate(event.end, event.allDay)}`);
      lines.push(`SUMMARY:${this.escapeICalText(event.title)}`);
      
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      }
      
      if (event.location) {
        lines.push(`LOCATION:${this.escapeICalText(event.location)}`);
      }
      
      lines.push(`STATUS:${event.status.toUpperCase()}`);
      lines.push(`TRANSP:${event.allDay ? 'TRANSPARENT' : 'OPAQUE'}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Sync bookings to Google Calendar
   */
  async syncBookings(bookings: Array<{
    bookingId: string;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    propertyId: string;
    channelId?: string;
    status: 'confirmed' | 'cancelled';
  }>): Promise<CalendarSyncResult> {
    const result: CalendarSyncResult = {
      success: true,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [],
      lastSync: new Date(),
    };

    for (const booking of bookings) {
      try {
        // Check if event exists
        const existingEvents = await this.getEvents(
          booking.checkIn,
          booking.checkOut
        );

        const existingEvent = existingEvents.find(
          e => e.metadata?.bookingId === booking.bookingId
        );

        if (booking.status === 'cancelled') {
          // Delete cancelled booking
          if (existingEvent) {
            await this.deleteEvent(existingEvent.eventId);
            result.eventsDeleted++;
          }
        } else if (existingEvent) {
          // Update existing booking
          await this.updateEvent(existingEvent.eventId, {
            guestName: booking.guestName,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: booking.status,
          });
          result.eventsUpdated++;
        } else {
          // Create new booking
          await this.createEvent(booking);
          result.eventsCreated++;
        }
      } catch (error) {
        result.errors.push({
          eventId: booking.bookingId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Import events from iCal URL
   */
  async importFromICal(url: string): Promise<CalendarEvent[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch iCal feed');
    }

    const icalData = await response.text();
    const events = this.parseICal(icalData);

    // Import to Google Calendar
    for (const event of events) {
      try {
        await this.createEvent({
          bookingId: event.eventId,
          guestName: event.title,
          checkIn: event.start,
          checkOut: event.end,
          propertyId: event.location || '',
        });
      } catch (error) {
        console.error('Failed to import event:', error);
      }
    }

    return events;
  }

  /**
   * Ensure authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    // Check if token is expired (simplified - in production check expiry)
    try {
      await this.refreshAccessToken();
    } catch (error) {
      throw new Error('Authentication failed. Please re-authenticate.');
    }
  }

  /**
   * Convert Google Calendar event to CalendarEvent
   */
  private convertToCalendarEvent(data: gapi.client.calendar.Event): CalendarEvent {
    return {
      eventId: data.id || '',
      calendarId: data.calendarId || this.config.calendarId,
      title: data.summary || 'Untitled Event',
      description: data.description,
      location: data.location,
      start: new Date(data.start?.date || data.start?.dateTime || ''),
      end: new Date(data.end?.date || data.end?.dateTime || ''),
      allDay: !!data.start?.date,
      attendees: data.attendees?.map(a => a.email) || [],
      status: (data.status as any) || 'confirmed',
      visibility: (data.visibility as any) || 'default',
      reminders: data.reminders?.overrides?.map(r => ({
        method: r.method as 'email' | 'popup' | 'sms',
        minutes: r.minutes,
      })) || [],
      recurrence: data.recurrence?.map(r => this.parseRecurrence(r)) || [],
      metadata: data.extendedProperties?.private,
    };
  }

  /**
   * Format date for iCal
   */
  private formatICalDate(date: Date, allDay: boolean = false): string {
    if (allDay) {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Escape text for iCal
   */
  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Parse iCal file
   */
  private parseICal(icalData: string): CalendarEvent[] {
    // Simplified iCal parser - in production use ical.js library
    const events: CalendarEvent[] = [];
    const lines = icalData.split('\r\n');
    let currentEvent: Partial<CalendarEvent> | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent) {
          events.push(currentEvent as CalendarEvent);
          currentEvent = null;
        }
      } else if (currentEvent && line.startsWith('UID:')) {
        currentEvent.eventId = line.substring(4);
      } else if (currentEvent && line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (currentEvent && line.startsWith('DTSTART:')) {
        currentEvent.start = new Date(line.substring(8));
      } else if (currentEvent && line.startsWith('DTEND:')) {
        currentEvent.end = new Date(line.substring(6));
      }
    }

    return events;
  }

  /**
   * Parse recurrence rule
   */
  private parseRecurrence(rrule: string): RecurrenceRule {
    // Simplified parser - in production use rrule library
    const parts = rrule.replace('RRULE:', '').split(';');
    const rule: RecurrenceRule = {
      frequency: 'DAILY',
    };

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'FREQ') {
        rule.frequency = value as any;
      } else if (key === 'INTERVAL') {
        rule.interval = parseInt(value);
      } else if (key === 'COUNT') {
        rule.count = parseInt(value);
      } else if (key === 'UNTIL') {
        rule.until = new Date(value);
      } else if (key === 'BYDAY') {
        rule.byDay = value.split(',');
      }
    });

    return rule;
  }
}

/**
 * Create Google Calendar integration instance
 */
export function createGoogleCalendarIntegration(
  config: GoogleCalendarConfig
): GoogleCalendarIntegration {
  return new GoogleCalendarIntegration(config);
}

export const googleCalendarIntegration = createGoogleCalendarIntegration({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  enabled: !!process.env.GOOGLE_CLIENT_ID,
  autoSync: true,
  syncInterval: 15,
});
