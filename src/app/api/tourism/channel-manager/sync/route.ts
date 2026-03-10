/**
 * POST /api/tourism/channel-manager/sync
 * Trigger real-time sync with all connected OTAs
 * Body: { propertyId, syncType?: 'availability' | 'rates' | 'reservations' | 'full' }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { createBookingComService } from "@/lib/tourism/booking-com-service";
import { createAirbnbService } from "@/lib/tourism/airbnb-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, syncType = 'full' } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const results: Record<string, any> = {};
    const errors: string[] = [];

    // Sync with Booking.com
    const bookingService = createBookingComService(propertyId);
    if (bookingService) {
      try {
        if (syncType === 'full' || syncType === 'availability') {
          const result = await bookingService.fullSync();
          results.booking = result;
          if (!result.success) errors.push(...result.errors);
        }
      } catch (error: any) {
        errors.push(`Booking.com sync failed: ${error.message}`);
      }
    } else {
      results.booking = { skipped: true, reason: 'Not connected' };
    }

    // Sync with Airbnb
    const airbnbService = createAirbnbService(propertyId);
    if (airbnbService) {
      try {
        if (syncType === 'full' || syncType === 'availability') {
          const result = await airbnbService.fullSync();
          results.airbnb = result;
          if (!result.success) errors.push(...result.errors);
        }
      } catch (error: any) {
        errors.push(`Airbnb sync failed: ${error.message}`);
      }
    } else {
      results.airbnb = { skipped: true, reason: 'Not connected' };
    }

    // Return summary
    return NextResponse.json({
      success: errors.length === 0,
      syncType,
      propertyId,
      timestamp: new Date().toISOString(),
      results,
      errors,
      summary: {
        bookingConnected: !!bookingService,
        airbnbConnected: !!airbnbService,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error("[Channel Manager Sync] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync with OTAs" },
      { status: 500 }
    );
  }
}
