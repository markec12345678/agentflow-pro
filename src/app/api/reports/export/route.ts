/**
 * POST /api/reports/export
 * Export reports in CSV or PDF format
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { format } from "date-fns";
import { z } from "zod";

const exportSchema = z.object({
  type: z.enum(["occupancy", "revenue", "guests"]),
  propertyId: z.string().min(1, "Property ID is required"),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  format: z.enum(["csv", "pdf"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = exportSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Validate property access
    const property = await getPropertyForUser(validatedData.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Fetch report data based on type
    let reportData: any = null;
    let filename = "";
    
    switch (validatedData.type) {
      case "occupancy":
        reportData = await fetchOccupancyData(validatedData.propertyId, validatedData.dateRange);
        filename = `occupancy-report-${format(new Date(), "yyyy-MM-dd")}`;
        break;
      case "revenue":
        reportData = await fetchRevenueData(validatedData.propertyId, validatedData.dateRange);
        filename = `revenue-report-${format(new Date(), "yyyy-MM-dd")}`;
        break;
      case "guests":
        reportData = await fetchGuestsData(validatedData.propertyId, validatedData.dateRange);
        filename = `guests-report-${format(new Date(), "yyyy-MM-dd")}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    if (!reportData) {
      return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
    }

    // Generate export based on format
    if (validatedData.format === "csv") {
      const csvContent = generateCSV(validatedData.type, reportData);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (validatedData.format === "pdf") {
      // For PDF generation, we'll create a simple HTML-based PDF
      // In a real implementation, you'd use a library like puppeteer or jsPDF
      const pdfContent = generatePDF(validatedData.type, reportData, property.name);
      return new NextResponse(pdfContent, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });

  } catch (error) {
    logger.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

async function fetchOccupancyData(propertyId: string, dateRange: { start: string; end: string }) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/reports/occupancy?propertyId=${propertyId}&start=${dateRange.start}&end=${dateRange.end}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    return null;
  } catch (error) {
    logger.error("Error fetching occupancy data:", error);
    return null;
  }
}

async function fetchRevenueData(propertyId: string, dateRange: { start: string; end: string }) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/reports/revenue?propertyId=${propertyId}&start=${dateRange.start}&end=${dateRange.end}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    return null;
  } catch (error) {
    logger.error("Error fetching revenue data:", error);
    return null;
  }
}

async function fetchGuestsData(propertyId: string, dateRange: { start: string; end: string }) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/reports/guests?propertyId=${propertyId}&start=${dateRange.start}&end=${dateRange.end}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    return null;
  } catch (error) {
    logger.error("Error fetching guests data:", error);
    return null;
  }
}

function generateCSV(type: string, data: any): string {
  let csv = "";
  
  switch (type) {
    case "occupancy":
      csv = "Date,Occupancy Rate,Occupied Rooms,Total Rooms,Available Rooms,Revenue,Arrivals,Departures,In-House\n";
      data.occupancyData.forEach((row: any) => {
        csv += `${row.date},${row.occupancyRate}%,${row.occupiedRooms},${row.totalRooms},${row.availableRooms},${row.revenue},${row.arrivals},${row.departures},${row.inHouse}\n`;
      });
      break;
      
    case "revenue":
      csv = "Date,Total Revenue,Occupancy Revenue,Extra Revenue,Damage Revenue,Reservations,Avg per Reservation,Avg per Room\n";
      data.revenueData.forEach((row: any) => {
        csv += `${row.date},${row.totalRevenue},${row.occupancyRevenue},${row.extraRevenue},${row.damageRevenue},${row.reservations},${row.averageRevenuePerReservation},${row.averageRevenuePerRoom}\n`;
      });
      break;
      
    case "guests":
      csv = "Country,Count,Percentage\n";
      data.demographics.topCountries.forEach((row: any) => {
        csv += `${row.country},${row.count},${row.percentage}%\n`;
      });
      break;
  }
  
  return csv;
}

function generatePDF(type: string, data: any, propertyName: string): string {
  // Simple HTML-based PDF generation
  // In a real implementation, you'd use a proper PDF library
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 30px; }
        .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Date Range:</strong> ${data.dateRange?.start || 'N/A'} to ${data.dateRange?.end || 'N/A'}</p>
        <p><strong>Generated:</strong> ${format(new Date(), "yyyy-MM-dd HH:mm")}</p>
      </div>
      
      ${type === "occupancy" ? `
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Rooms:</strong> ${data.summary?.totalRooms || 'N/A'}</p>
          <p><strong>Average Occupancy:</strong> ${data.summary?.averageOccupancy || 'N/A'}%</p>
          <p><strong>Total Revenue:</strong> €${data.summary?.totalRevenue || 'N/A'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Occupancy Rate</th>
              <th>Occupied Rooms</th>
              <th>Total Rooms</th>
              <th>Revenue</th>
              <th>Arrivals</th>
              <th>Departures</th>
            </tr>
          </thead>
          <tbody>
            ${data.occupancyData?.map((row: any) => `
              <tr>
                <td>${row.date}</td>
                <td>${row.occupancyRate}%</td>
                <td>${row.occupiedRooms}</td>
                <td>${row.totalRooms}</td>
                <td>€${row.revenue}</td>
                <td>${row.arrivals}</td>
                <td>${row.departures}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      ` : ''}
      
      ${type === "revenue" ? `
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Revenue:</strong> €${data.summary?.totalRevenue || 'N/A'}</p>
          <p><strong>Total Reservations:</strong> ${data.summary?.totalReservations || 'N/A'}</p>
          <p><strong>Avg per Reservation:</strong> €${data.summary?.averageRevenuePerReservation || 'N/A'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Revenue</th>
              <th>Occupancy Revenue</th>
              <th>Extra Revenue</th>
              <th>Reservations</th>
              <th>Avg per Reservation</th>
            </tr>
          </thead>
          <tbody>
            ${data.revenueData?.map((row: any) => `
              <tr>
                <td>${row.date}</td>
                <td>€${row.totalRevenue}</td>
                <td>€${row.occupancyRevenue}</td>
                <td>€${row.extraRevenue}</td>
                <td>${row.reservations}</td>
                <td>€${row.averageRevenuePerReservation}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      ` : ''}
      
      ${type === "guests" ? `
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Guests:</strong> ${data.demographics?.totalGuests || 'N/A'}</p>
          <p><strong>New Guests:</strong> ${data.demographics?.newGuests || 'N/A'}</p>
          <p><strong>Returning Guests:</strong> ${data.demographics?.returningGuests || 'N/A'}</p>
          <p><strong>VIP Guests:</strong> ${data.demographics?.vipGuests || 'N/A'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Country</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${data.demographics?.topCountries?.map((row: any) => `
              <tr>
                <td>${row.country}</td>
                <td>${row.count}</td>
                <td>${row.percentage}%</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `;
  
  return html;
}
