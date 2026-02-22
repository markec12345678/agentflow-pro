import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";

// GET /api/tourism/ical/export - export calendar as iCal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const roomId = searchParams.get("roomId");
    const token = searchParams.get("token"); // For public iCal feeds

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Verify token (in production, validate against stored tokens)
    // For now, we'll just check if token exists
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 401 }
      );
    }

    // Fetch reservations from calendar API
    const calendarRes = await fetch(
      `${request.nextUrl.origin}/api/tourism/calendar?propertyId=${propertyId}${roomId ? `&roomId=${roomId}` : ""}`,
      { headers: { cookie: request.headers.get("cookie") || "" } }
    );
    
    if (!calendarRes.ok) {
      throw new Error("Failed to fetch calendar data");
    }

    const { calendar } = await calendarRes.json();

    // Generate iCal format
    const icalEvents = calendar
      .filter((day: { status: string }) => day.status === "booked" || day.status === "check-in")
      .map((day: { date: string; reservation: { id: string; guestName: string; channel: string; guestEmail: string } | null }) => {
        if (!day.reservation) return null;
        
        return `BEGIN:VEVENT
UID:${day.reservation.id}@agentflow.pro
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART;VALUE=DATE:${day.date.replace(/-/g, "")}
DTEND;VALUE=DATE:${format(new Date(day.date), "yyyyMMdd")}
SUMMARY:Reserved - ${day.reservation.guestName || "Guest"}
DESCRIPTION:Reservation from ${day.reservation.channel}\nGuest: ${day.reservation.guestName || "N/A"}\nEmail: ${day.reservation.guestEmail || "N/A"}
END:VEVENT`;
      })
      .filter(Boolean);

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AgentFlow Pro//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Property Availability
X-WR-TIMEZONE:Europe/Ljubljana
${icalEvents.join("\n")}
END:VCALENDAR`;

    return new NextResponse(icalContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="property-${propertyId}-calendar.ics"`,
      },
    });
  } catch (error) {
    console.error("iCal export error:", error);
    return NextResponse.json(
      { error: "Failed to export calendar" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/ical/import - import iCal from external sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, icalUrl, source, roomId } = body;

    if (!propertyId || !icalUrl) {
      return NextResponse.json(
        { error: "Property ID and iCal URL are required" },
        { status: 400 }
      );
    }

    // Fetch external iCal feed
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      throw new Error("Failed to fetch external iCal");
    }

    const icalData = await icalResponse.text();

    // Parse iCal data (simplified parser)
    const events: Array<{
      uid: string;
      start: Date;
      end: Date;
      summary: string;
      description: string;
    }> = [];

    const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
    const eventsMatch = icalData.match(eventRegex);

    if (eventsMatch) {
      for (const eventStr of eventsMatch) {
        const uid = eventStr.match(/UID:(.*)/)?.[1] || "";
        const dtstart = eventStr.match(/DTSTART(?:;VALUE=DATE)?:?(\d{8})/)?.[1];
        const dtend = eventStr.match(/DTEND(?:;VALUE=DATE)?:?(\d{8})/)?.[1];
        const summary = eventStr.match(/SUMMARY:(.*)/)?.[1] || "";
        const description = eventStr.match(/DESCRIPTION:([\s\S]*?)(?=\n[A-Z]|END:VEVENT)/)?.[1] || "";

        if (dtstart && dtend) {
          events.push({
            uid,
            start: new Date(
              parseInt(dtstart.slice(0, 4)),
              parseInt(dtstart.slice(4, 6)) - 1,
              parseInt(dtstart.slice(6, 8))
            ),
            end: new Date(
              parseInt(dtend.slice(0, 4)),
              parseInt(dtend.slice(4, 6)) - 1,
              parseInt(dtend.slice(6, 8))
            ),
            summary,
            description,
          });
        }
      }
    }

    // Store import log
    const importLog = {
      propertyId,
      roomId,
      source: source || "external",
      url: icalUrl,
      eventsImported: events.length,
      importedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      importLog,
      eventsPreview: events.slice(0, 5),
      totalEvents: events.length,
    });
  } catch (error) {
    console.error("iCal import error:", error);
    return NextResponse.json(
      { error: "Failed to import iCal" },
      { status: 500 }
    );
  }
}

// Generate sync token for external calendar services
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, roomId, action } = body;

    if (action === "generate-token") {
      // Generate a unique token for the property
      const token = Buffer.from(`${propertyId}:${roomId || "all"}:${Date.now()}`).toString("base64");
      
      // In production, store this token in database
      // await prisma.icalToken.create({ ... });

      const feedUrl = `${request.nextUrl.origin}/api/tourism/ical/export?propertyId=${propertyId}${roomId ? `&roomId=${roomId}` : ""}&token=${token}`;

      return NextResponse.json({
        token,
        feedUrl,
        instructions: {
          airbnb: `Go to Calendar > Sync Calendar > Import Calendar and paste: ${feedUrl}`,
          booking: `Go to Rates & Availability > Calendar Sync > Import and paste: ${feedUrl}`,
          google: `Go to Google Calendar > Add Calendar > From URL and paste: ${feedUrl}`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
