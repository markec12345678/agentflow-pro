/**
 * POST /api/tourism/revenue/export
 * Export revenue analytics to PDF or Excel
 * Body: { propertyId, startDate, endDate, format: 'pdf' | 'excel' }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO, startOfDay, endOfDay, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, startDate: startStr, endDate: endStr, format: exportFormat } = body;

    if (!propertyId || !startStr || !endStr || !exportFormat) {
      return NextResponse.json(
        { error: "propertyId, startDate, endDate, and format are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const startDate = startOfDay(parseISO(startStr));
    const endDate = endOfDay(parseISO(endStr));

    // Fetch revenue data
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { lte: endDate },
        checkOut: { gte: startDate },
        status: { in: ["confirmed", "checked_in", "checked_out"] },
      },
      include: {
        room: true,
        guest: true,
        payments: true,
      },
    });

    // Calculate metrics
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const totalNights = reservations.reduce((sum, r) => {
      const nights = Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(1, nights);
    }, 0);

    const rooms = await prisma.room.findMany({ where: { propertyId } });
    const totalRooms = rooms.length;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const roomNightsAvailable = totalRooms * days;
    const occupiedRoomNights = totalNights;
    const occupancyRate = roomNightsAvailable > 0 ? (occupiedRoomNights / roomNightsAvailable) * 100 : 0;
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
    const revpar = roomNightsAvailable > 0 ? totalRevenue / roomNightsAvailable : 0;

    // Revenue by channel
    const revenueByChannel = reservations.reduce(
      (acc, r) => {
        const channel = r.channel || "direct";
        if (!acc[channel]) acc[channel] = { revenue: 0, bookings: 0 };
        acc[channel].revenue += r.totalPrice || 0;
        acc[channel].bookings++;
        return acc;
      },
      {} as Record<string, { revenue: number; bookings: number }>
    );

    if (exportFormat === "excel") {
      // Generate Excel CSV
      const csvRows = [
        ["Revenue Report", ""],
        ["Property", property.name],
        ["Period", `${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`],
        ["", ""],
        ["Key Metrics", ""],
        ["Total Revenue", `€${totalRevenue.toFixed(2)}`],
        ["Occupancy Rate", `${occupancyRate.toFixed(2)}%`],
        ["ADR", `€${adr.toFixed(2)}`],
        ["RevPAR", `€${revpar.toFixed(2)}`],
        ["Total Nights", totalNights],
        ["Total Bookings", reservations.length],
        ["", ""],
        ["Revenue by Channel", ""],
        ["Channel", "Revenue", "Bookings"],
      ];

      Object.entries(revenueByChannel).forEach(([channel, data]) => {
        csvRows.push([channel, `€${data.revenue.toFixed(2)}`, data.bookings.toString()]);
      });

      csvRows.push(["", ""]);
      csvRows.push(["Reservation Details", ""]);
      csvRows.push([
        "Guest Name",
        "Check-in",
        "Check-out",
        "Nights",
        "Room",
        "Channel",
        "Amount",
        "Status",
      ]);

      reservations.forEach((r) => {
        const nights = Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        csvRows.push([
          r.guestName || "N/A",
          format(r.checkIn, "yyyy-MM-dd"),
          format(r.checkOut, "yyyy-MM-dd"),
          Math.max(1, nights).toString(),
          r.room?.name || "N/A",
          r.channel || "direct",
          `€${(r.totalPrice || 0).toFixed(2)}`,
          r.status,
        ]);
      });

      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv"`,
        },
      });
    }

    if (exportFormat === "pdf") {
      // Generate simple HTML for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Revenue Report - ${property.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e40af; }
            .header { margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
            .metric { background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .metric-label { font-size: 12px; color: #6b7280; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; }
            .section { margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Revenue Report</h1>
            <p><strong>Property:</strong> ${property.name}</p>
            <p><strong>Period:</strong> ${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}</p>
          </div>

          <h2>Key Metrics</h2>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">€${totalRevenue.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Occupancy Rate</div>
              <div class="metric-value">${occupancyRate.toFixed(2)}%</div>
            </div>
            <div class="metric">
              <div class="metric-label">ADR (Average Daily Rate)</div>
              <div class="metric-value">€${adr.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">RevPAR</div>
              <div class="metric-value">€${revpar.toFixed(2)}</div>
            </div>
          </div>

          <div class="section">
            <h2>Revenue by Channel</h2>
            <table>
              <tr><th>Channel</th><th>Revenue</th><th>Bookings</th></tr>
              ${Object.entries(revenueByChannel)
                .map(
                  ([channel, data]) => `
                <tr>
                  <td>${channel}</td>
                  <td>€${data.revenue.toFixed(2)}</td>
                  <td>${data.bookings}</td>
                </tr>
              `
                )
                .join("")}
            </table>
          </div>

          <div class="section">
            <h2>Reservations (${reservations.length})</h2>
            <table>
              <tr><th>Guest</th><th>Check-in</th><th>Check-out</th><th>Amount</th></tr>
              ${reservations
                .slice(0, 50)
                .map(
                  (r) => `
                <tr>
                  <td>${r.guestName || "N/A"}</td>
                  <td>${format(r.checkIn, "yyyy-MM-dd")}</td>
                  <td>${format(r.checkOut, "yyyy-MM-dd")}</td>
                  <td>€${(r.totalPrice || 0).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            ${reservations.length > 50 ? `<p><em>... and ${reservations.length - 50} more reservations</em></p>` : ""}
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            Generated on ${format(new Date(), "MMM d, yyyy 'at' HH:mm")} by AgentFlow Pro
          </div>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="revenue-report-${format(new Date(), "yyyy-MM-dd")}.html"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format. Use 'pdf' or 'excel'" }, { status: 400 });
  } catch (error) {
    console.error("[Revenue Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export revenue report" },
      { status: 500 }
    );
  }
}
