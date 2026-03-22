/**
 * iCal Two-Way Sync Service
 * Handles: Import from iCal URLs, export iCal feeds, sync with OTAs
 */

import ICAL from 'ical.js';

interface CalendarEvent {
  uid: string;
  summary: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  url?: string;
  created: Date;
  lastModified: Date;
}

interface SyncResult {
  imported: number;
  updated: number;
  deleted: number;
  errors: string[];
}

export class iCalSyncService {
  /**
   * Parse iCal/ICS data
   */
  parseICalData(icalData: string): CalendarEvent[] {
    try {
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');
      
      const events: CalendarEvent[] = [];
      
      for (const vevent of vevents) {
        const event = new ICAL.Event(vevent);
        
        events.push({
          uid: event.uid,
          summary: event.summary,
          startDate: event.startDate.toJSDate(),
          endDate: event.endDate.toJSDate(),
          location: event.location || undefined,
          description: event.description || undefined,
          url: event.url || undefined,
          created: event.created.toJSDate(),
          lastModified: event.lastModified.toJSDate(),
        });
      }
      
      return events;
    } catch (error) {
      console.error('iCal parse error:', error);
      throw new Error(`Failed to parse iCal data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch and parse iCal from URL
   */
  async fetchFromUrl(url: string): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.statusText}`);
      }
      
      const icalData = await response.text();
      return this.parseICalData(icalData);
    } catch (error) {
      console.error('iCal fetch error:', error);
      throw new Error(`Failed to fetch iCal from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync iCal with database reservations
   */
  async syncWithReservations(
    propertyId: string,
    icalUrls: string[]
  ): Promise<SyncResult> {
    const { prisma } = await import('@/lib/prisma');
    const result: SyncResult = {
      imported: 0,
      updated: 0,
      deleted: 0,
      errors: [],
    };

    for (const url of icalUrls) {
      try {
        const events = await this.fetchFromUrl(url);
        
        for (const event of events) {
          // Check if reservation exists
          const existing = await prisma.reservation.findFirst({
            where: {
              externalId: event.uid,
              propertyId,
            },
          });

          if (existing) {
            // Update existing
            await prisma.reservation.update({
              where: { id: existing.id },
              data: {
                checkIn: event.startDate,
                checkOut: event.endDate,
                status: 'confirmed',
                source: 'ical',
                updatedAt: new Date(),
              },
            });
            result.updated++;
          } else {
            // Create new
            await prisma.reservation.create({
              data: {
                propertyId,
                externalId: event.uid,
                checkIn: event.startDate,
                checkOut: event.endDate,
                status: 'confirmed',
                source: 'ical',
                guestName: event.summary || 'iCal Booking',
                notes: event.description,
              },
            });
            result.imported++;
          }
        }
      } catch (error) {
        result.errors.push(`Error syncing ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Generate iCal feed for property
   */
  async generateICalFeed(propertyId: string): Promise<string> {
    const { prisma } = await import('@/lib/prisma');
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        reservations: {
          where: {
            status: { in: ['confirmed', 'checked-in', 'checked-out'] },
            checkOut: { gte: new Date() },
          },
          orderBy: { checkIn: 'asc' },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Create iCal component
    const vcalendar = new ICAL.Component('vcalendar');
    vcalendar.addPropertyWithValue('prodid', '-//AgentFlow Pro//iCal Feed//EN');
    vcalendar.addPropertyWithValue('version', '2.0');
    vcalendar.addPropertyWithValue('calscale', 'GREGORIAN');
    vcalendar.addPropertyWithValue('method', 'PUBLISH');

    // Add events for each reservation
    for (const reservation of property.reservations) {
      const vevent = new ICAL.Component('vevent');
      
      vevent.addPropertyWithValue('uid', reservation.externalId || `res-${reservation.id}`);
      vevent.addPropertyWithValue('summary', `${property.name} - Reserved`);
      vevent.addPropertyWithValue('dtstart', reservation.checkIn.toISOString().replace(/-|:|\.\d\d\d/g, ''));
      vevent.addPropertyWithValue('dtend', reservation.checkOut.toISOString().replace(/-|:|\.\d\d\d/g, ''));
      vevent.addPropertyWithValue('dtstamp', new Date().toISOString().replace(/-|:|\.\d\d\d/g, ''));
      vevent.addPropertyWithValue('created', reservation.createdAt.toISOString().replace(/-|:|\.\d\d\d/g, ''));
      vevent.addPropertyWithValue('last-modified', reservation.updatedAt.toISOString().replace(/-|:|\.\d\d\d/g, ''));
      
      if (reservation.guestName) {
        vevent.addPropertyWithValue('description', `Guest: ${reservation.guestName}`);
      }
      
      vcalendar.addSubcomponent(vevent);
    }

    return vcalendar.toString();
  }

  /**
   * Create iCal feed endpoint URL
   */
  generateFeedUrl(propertyId: string, token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    return `${baseUrl}/api/tourism/ical/${propertyId}?token=${token}`;
  }

  /**
   * Detect conflicts between iCal events and existing reservations
   */
  async detectConflicts(
    propertyId: string,
    events: CalendarEvent[]
  ): Promise<Array<{
    event: CalendarEvent;
    conflictingReservation: any;
    overlapDays: number;
  }>> {
    const { prisma } = await import('@/lib/prisma');
    
    const conflicts: any[] = [];
    
    for (const event of events) {
      const overlapping = await prisma.reservation.findFirst({
        where: {
          propertyId,
          id: { not: undefined },
          OR: [
            {
              checkIn: { lte: event.endDate },
              checkOut: { gte: event.startDate },
            },
          ],
        },
      });

      if (overlapping) {
        const overlapDays = Math.min(
          event.endDate.getTime(),
          overlapping.checkOut.getTime()
        ) - Math.max(
          event.startDate.getTime(),
          overlapping.checkIn.getTime()
        );
        
        conflicts.push({
          event,
          conflictingReservation: overlapping,
          overlapDays: Math.ceil(overlapDays / (1000 * 60 * 60 * 24)),
        });
      }
    }

    return conflicts;
  }

  /**
   * Auto-resolve conflicts (block dates)
   */
  async autoResolveConflicts(
    propertyId: string,
    events: CalendarEvent[]
  ): Promise<number> {
    const { prisma } = await import('@/lib/prisma');
    let blockedCount = 0;

    for (const event of events) {
      // Check if dates are already blocked
      const existingBlock = await prisma.blockedDate.findFirst({
        where: {
          propertyId,
          startDate: event.startDate,
          endDate: event.endDate,
        },
      });

      if (!existingBlock) {
        await prisma.blockedDate.create({
          data: {
            propertyId,
            startDate: event.startDate,
            endDate: event.endDate,
            reason: 'iCal Sync - External Booking',
            source: 'ical',
            externalId: event.uid,
          },
        });
        blockedCount++;
      }
    }

    return blockedCount;
  }

  /**
   * Schedule periodic sync
   */
  async scheduleSync(
    propertyId: string,
    icalUrls: string[],
    intervalMinutes: number = 60
  ): Promise<void> {
    const { prisma } = await import('@/lib/prisma');
    
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        metadata: {
          icalSync: {
            enabled: true,
            urls: icalUrls,
            intervalMinutes,
            lastSync: null,
            nextSync: new Date(Date.now() + intervalMinutes * 60 * 1000),
          },
        },
      },
    });

    // Note: In production, use a job scheduler like Bull or node-cron
    console.log(`Scheduled iCal sync for property ${propertyId} every ${intervalMinutes} minutes`);
  }
}

export const iCalSyncService = new iCalSyncService();
