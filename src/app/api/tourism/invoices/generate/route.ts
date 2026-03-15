/**
 * POST /api/tourism/invoices/generate
 * Generate invoice from reservation
 * Body: { reservationId, dueDate?, taxRate?, language? }
 * 
 * GET /api/tourism/invoices/:id/html
 * Get invoice HTML for PDF generation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { prisma } from "@/database/schema";
import { invoiceGenerationService } from "@/lib/invoice-generation";

// Generate invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, dueDate, taxRate, language = 'sl' } = body;

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    // Verify property access
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { property: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(reservation.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate invoice
    const result = await invoiceGenerationService.generateInvoiceFromReservation(
      reservationId,
      {
        dueDate: dueDate ? new Date(dueDate) : undefined,
        taxRate,
        language,
      }
    );

    return NextResponse.json({
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      totalAmount: result.totalAmount,
    });
  } catch (error) {
    logger.error("[Generate Invoice] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
