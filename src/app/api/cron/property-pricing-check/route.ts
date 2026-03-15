/**
 * AgentFlow Pro - Property Pricing Check Cron
 * Suggests basePrice for properties with PMS connection but no basePrice.
 * Schedule: 0 4 * * * (daily 04:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { verifyCronAuth } from "@/lib/cron-auth";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = subDays(new Date(), 90);

    const connections = await prisma.pmsConnection.findMany({
      include: { property: { select: { id: true, name: true, basePrice: true } } },
    });

    const propertiesWithoutPrice = connections
      .map((c) => c.property)
      .filter((p) => p.basePrice == null);

    let created = 0;

    for (const property of propertiesWithoutPrice) {
      const reservations = await prisma.reservation.findMany({
        where: {
          propertyId: property.id,
          status: "confirmed",
          totalPrice: { not: null },
          checkOut: { gte: cutoff },
        },
        select: { totalPrice: true, checkIn: true, checkOut: true },
      });

      if (reservations.length < 3) continue;

      let totalNights = 0;
      let totalAmount = 0;
      for (const r of reservations) {
        const price = r.totalPrice ?? 0;
        const nights = Math.max(
          1,
          Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / (24 * 60 * 60 * 1000))
        );
        totalAmount += price;
        totalNights += nights;
      }

      const suggestedBasePrice =
        totalNights > 0 ? Math.round((totalAmount / totalNights) * 100) / 100 : 0;

      if (suggestedBasePrice <= 0) continue;

      await prisma.alertEvent.create({
        data: {
          type: "property_pricing_suggested",
          title: "Property Pricing Suggestion",
          message: `Suggested base price for ${property.name}: €${suggestedBasePrice}`,
          propertyId: property.id,
          metadata: {
            suggestedBasePrice,
            sampleCount: reservations.length,
            propertyName: property.name,
          },
        },
      });
      created++;
    }

    return NextResponse.json({
      success: true,
      checked: propertiesWithoutPrice.length,
      alertsCreated: created,
    });
  } catch (error) {
    logger.error("Property pricing check cron error:", error);
    return NextResponse.json(
      { error: "Property pricing check cron failed" },
      { status: 500 }
    );
  }
}
