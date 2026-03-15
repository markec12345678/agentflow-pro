/**
 * API Route - iCal Feed
 * GET: Generate iCal feed for property
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarIntegration } from '@/integrations/google-calendar';

export interface ICalRequest {
  propertyId: string;
  includeBookings?: boolean;
  includeBlockedDates?: boolean;
  includeAvailability?: boolean;
}

/**
 * GET /api/calendar/ical
 * Generate iCal feed for property
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('propertyId');
    const includeBookings = searchParams.get('includeBookings') !== 'false';
    const includeBlockedDates = searchParams.get('includeBlockedDates') !== 'false';
    const includeAvailability = searchParams.get('includeAvailability') === 'true';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId is required' },
        { status: 400 }
      );
    }

    // Fetch events from database (in production, fetch from Prisma)
    const events = await fetchPropertyEvents(
      propertyId,
      includeBookings,
      includeBlockedDates,
      includeAvailability
    );

    // Generate iCal content
    const icalContent = googleCalendarIntegration.generateICalContent(events);

    // Return iCal file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${propertyId}-calendar.ics"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate iCal feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate iCal feed' },
      { status: 500 }
    );
  }
}

/**
 * Fetch property events
 */
async function fetchPropertyEvents(
  propertyId: string,
  includeBookings: boolean,
  includeBlockedDates: boolean,
  includeAvailability: boolean
) {
  // In production, fetch from Prisma
  // Mock implementation
  const events = [];

  if (includeBookings) {
    // Fetch bookings from database
    events.push(
      ...[
        {
          eventId: 'booking-1',
          calendarId: propertyId,
          title: 'Booking: John Doe',
          description: 'Booking ID: BK-123\nChannel: Booking.com',
          location: propertyId,
          start: new Date('2026-03-15'),
          end: new Date('2026-03-20'),
          allDay: true,
          attendees: ['john@example.com'],
          status: 'confirmed' as const,
          visibility: 'private' as const,
          reminders: [],
          metadata: {
            bookingId: 'BK-123',
            guestName: 'John Doe',
            channelId: 'booking.com',
            propertyId,
          },
        },
      ]
    );
  }

  if (includeBlockedDates) {
    // Fetch blocked dates from database
    events.push({
      eventId: 'blocked-1',
      calendarId: propertyId,
      title: 'Blocked: Maintenance',
      description: 'Property maintenance',
      location: propertyId,
      start: new Date('2026-03-25'),
      end: new Date('2026-03-27'),
      allDay: true,
      attendees: [],
      status: 'confirmed' as const,
      visibility: 'public' as const,
      reminders: [],
      metadata: {
        type: 'blocked',
        reason: 'maintenance',
        propertyId,
      },
    });
  }

  return events;
}
