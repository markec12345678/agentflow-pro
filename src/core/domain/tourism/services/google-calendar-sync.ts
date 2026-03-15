/**
 * AgentFlow Pro - Google Calendar Sync
 * Two-way sync with Google Calendar for external bookings
 */

import { google } from "googleapis";
import { prisma } from "@/database/schema";

const CALENDAR_ID = "primary";

export interface GoogleCalendarConfig {
  propertyId: string;
  calendarId?: string;
  accessToken: string;
  refreshToken: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
}

export class GoogleCalendarSync {
  private config: GoogleCalendarConfig;
  private oauth2Client: any;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });
  }

  /**
   * Get events from Google Calendar
   */
  async getEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
    try {
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: this.config.calendarId || CALENDAR_ID,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items
        ?.filter(event => event.status !== "cancelled")
        .map(event => ({
          id: event.id || "",
          summary: event.summary || "External Booking",
          description: event.description,
          start: new Date(event.start?.dateTime || event.start?.date || ""),
          end: new Date(event.end?.dateTime || event.end?.date || ""),
          attendees: event.attendees?.map(a => a.email) || [],
          location: event.location,
        })) || [];
    } catch (error) {
      logger.error("[Google Calendar] Error fetching events:", error);
      throw new Error(`Failed to fetch Google Calendar events: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    attendees?: string[];
    location?: string;
  }): Promise<string> {
    try {
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      
      const response = await calendar.events.insert({
        calendarId: this.config.calendarId || CALENDAR_ID,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: "Europe/Ljubljana",
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: "Europe/Ljubljana",
          },
          attendees: event.attendees?.map(email => ({ email })),
          location: event.location,
        },
      });

      return response.data.id || "";
    } catch (error) {
      logger.error("[Google Calendar] Error creating event:", error);
      throw new Error(`Failed to create Google Calendar event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      start?: Date;
      end?: Date;
      attendees?: string[];
    }
  ): Promise<void> {
    try {
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      
      const existingEvent = await calendar.events.get({
        calendarId: this.config.calendarId || CALENDAR_ID,
        eventId,
      });

      await calendar.events.update({
        calendarId: this.config.calendarId || CALENDAR_ID,
        eventId,
        requestBody: {
          ...existingEvent.data,
          ...updates,
          start: updates.start ? {
            dateTime: updates.start.toISOString(),
            timeZone: "Europe/Ljubljana",
          } : existingEvent.data.start,
          end: updates.end ? {
            dateTime: updates.end.toISOString(),
            timeZone: "Europe/Ljubljana",
          } : existingEvent.data.end,
        },
      });
    } catch (error) {
      logger.error("[Google Calendar] Error updating event:", error);
      throw new Error(`Failed to update Google Calendar event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
      
      await calendar.events.delete({
        calendarId: this.config.calendarId || CALENDAR_ID,
        eventId,
      });
    } catch (error) {
      logger.error("[Google Calendar] Error deleting event:", error);
      throw new Error(`Failed to delete Google Calendar event: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Sync reservations to Google Calendar
   */
  async syncReservationsToCalendar(reservations: Array<{
    id: string;
    guestName: string;
    guestEmail?: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
  }>): Promise<{ created: number; updated: number; errors: string[] }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    for (const reservation of reservations) {
      try {
        // Check if event exists (store reservation ID in event description)
        const events = await this.getEvents(
          new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
          new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)
        );

        const existingEvent = events.find(e => 
          e.description?.includes(`Reservation ID: ${reservation.id}`)
        );

        if (existingEvent) {
          // Update existing event
          await this.updateEvent(existingEvent.id, {
            summary: `${reservation.guestName} - ${reservation.status === "cancelled" ? "[CANCELLED]" : "Reserved"}`,
            start: reservation.checkIn,
            end: reservation.checkOut,
          });
          result.updated++;
        } else if (reservation.status !== "cancelled") {
          // Create new event
          await this.createEvent({
            summary: `${reservation.guestName} - Reserved`,
            description: `Reservation ID: ${reservation.id}\nGuest: ${reservation.guestName}\nEmail: ${reservation.guestEmail || "N/A"}`,
            start: reservation.checkIn,
            end: reservation.checkOut,
            attendees: reservation.guestEmail ? [reservation.guestEmail] : undefined,
          });
          result.created++;
        }
      } catch (error) {
        logger.error("[Google Calendar Sync] Error:", error);
        result.errors.push(`Failed to sync reservation ${reservation.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return result;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update database with new token
      await prisma.pmsConnection.updateMany({
        where: {
          propertyId: this.config.propertyId,
          provider: "google_calendar",
        },
        data: {
          credentials: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token || this.config.refreshToken,
          },
        },
      });

      return credentials.access_token || "";
    } catch (error) {
      logger.error("[Google Calendar] Error refreshing token:", error);
      throw new Error(`Failed to refresh Google access token: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

/**
 * Factory function to create Google Calendar sync instance
 */
export function createGoogleCalendarSync(propertyId: string): GoogleCalendarSync | null {
  const connection = prisma.pmsConnection.findFirstSync({
    where: { propertyId, provider: "google_calendar" },
  });

  if (!connection) {
    return null;
  }

  const credentials = connection.credentials as any;
  if (!credentials.accessToken || !credentials.refreshToken) {
    return null;
  }

  return new GoogleCalendarSync({
    propertyId,
    calendarId: credentials.calendarId,
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
  });
}
