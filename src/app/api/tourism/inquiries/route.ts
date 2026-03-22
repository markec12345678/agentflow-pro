import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { sendNewInquiryNotification } from "@/lib/email/send";

function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const inquiryTypeEnum = z.enum(["general", "availability", "group", "offer"]);
const createInquirySchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  phone: z.string().optional(),
  type: inquiryTypeEnum.optional().default("general"),
  checkIn: z.string().datetime().optional().transform((s) => (s ? new Date(s) : undefined)),
  checkOut: z.string().datetime().optional().transform((s) => (s ? new Date(s) : undefined)),
  guestCount: z.number().int().positive().optional(),
});

function sanitizeMessage(msg: string): string {
  return msg.replace(/<[^>]*>/g, "").trim();
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// OPTIONS /api/tourism/inquiries - CORS preflight
export async function OPTIONS() {
  const headers = getCorsHeaders();
  return new NextResponse(null, { status: 204, headers });
}

// GET /api/tourism/inquiries - list inquiries (auth required)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status") ?? "all"; // new | read | replied | closed | all
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);

    const propertyIds = await getPropertyIdsForUser(userId);
    if (propertyIds.length === 0) {
      return NextResponse.json({ inquiries: [], total: 0 });
    }

    const where: { propertyId?: string | { in: string[] }; status?: string | { in: string[] } } = {
      propertyId: propertyId
        ? propertyIds.includes(propertyId)
          ? propertyId
          : { in: [] }
        : { in: propertyIds },
    };

    if (status !== "all" && ["new", "read", "replied", "closed"].includes(status)) {
      where.status = status;
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return NextResponse.json({ inquiries, total });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/inquiries - create inquiry (public or auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    const isAuthenticated = !!userId;

    const parsed = createInquirySchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      const msg = issues.map((e) => e.message).join("; ");
      return NextResponse.json(
        { error: msg },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const data = parsed.data;

    // Public POST: rate limit 10 req / 15 min
    if (!isAuthenticated) {
      const ip = getClientIp(request);
      const { allowed, retryAfter } = checkRateLimitByIp(ip, 15 * 60 * 1000, 10);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many requests", retryAfter },
          { status: 429, headers: { ...getCorsHeaders(), "Retry-After": String(retryAfter ?? 60) } }
        );
      }
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: getCorsHeaders() }
      );
    }

    // Auth: check user has access to this property for manual creation
    if (isAuthenticated) {
      const allowed = await getPropertyForUser(data.propertyId, userId);
      if (!allowed) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
    }

    const message = sanitizeMessage(data.message);
    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters after sanitization" },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        message,
        type: data.type,
        status: "new",
        source: isAuthenticated ? "manual" : "form",
        checkIn: data.checkIn ?? null,
        checkOut: data.checkOut ?? null,
        guestCount: data.guestCount ?? null,
      },
    });

    if (property.userId) {
      try {
        const owner = await prisma.user.findUnique({
          where: { id: property.userId },
          select: { email: true },
        });
        if (owner?.email) {
          await sendNewInquiryNotification(
            owner.email,
            { name: data.name, email: data.email, message, type: data.type },
            property.name
          );
        }
      } catch (e) {
        console.warn("Failed to send inquiry notification email:", e);
      }
    }

    return NextResponse.json(
      { id: inquiry.id, status: inquiry.status },
      { status: 201, headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
