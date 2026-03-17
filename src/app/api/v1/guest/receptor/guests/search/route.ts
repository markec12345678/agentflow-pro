/**
 * GET /api/receptor/guests/search
 * Search guests by name, email, phone, or reservation ID
 * Query: propertyId (required), type (name|email|phone|reservation), query (required)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from '@/lib/tourism/property-access';
import { z } from "zod";

const searchGuestsSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  type: z.enum(["name", "email", "phone", "reservation"]),
  query: z.string().min(2, "Query must be at least 2 characters"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const typeParam = searchParams.get("type");
    const queryParam = searchParams.get("query");

    // Validate input
    const validationResult = searchGuestsSchema.safeParse({
      propertyId: propertyIdParam,
      type: typeParam,
      query: queryParam,
    });

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

    let guests;

    switch (validatedData.type) {
      case "name":
        guests = await prisma.guest.findMany({
          where: {
            name: {
              contains: validatedData.query,
              mode: "insensitive",
            },
            OR: [
              { propertyId: validatedData.propertyId },
              { propertyId: null }, // Include guests without property assignment
            ],
          },
          include: {
            reservations: {
              where: {
                propertyId: validatedData.propertyId,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                checkIn: "desc",
              },
              take: 10, // Limit to recent reservations
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20, // Limit results
        });
        break;

      case "email":
        guests = await prisma.guest.findMany({
          where: {
            email: {
              contains: validatedData.query,
              mode: "insensitive",
            },
            OR: [
              { propertyId: validatedData.propertyId },
              { propertyId: null },
            ],
          },
          include: {
            reservations: {
              where: {
                propertyId: validatedData.propertyId,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                checkIn: "desc",
              },
              take: 10,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        });
        break;

      case "phone":
        guests = await prisma.guest.findMany({
          where: {
            phone: {
              contains: validatedData.query,
              mode: "insensitive",
            },
            OR: [
              { propertyId: validatedData.propertyId },
              { propertyId: null },
            ],
          },
          include: {
            reservations: {
              where: {
                propertyId: validatedData.propertyId,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                checkIn: "desc",
              },
              take: 10,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        });
        break;

      case "reservation":
        guests = await prisma.guest.findMany({
          where: {
            reservations: {
              some: {
                id: {
                  contains: validatedData.query,
                  mode: "insensitive",
                },
                propertyId: validatedData.propertyId,
              },
            },
          },
          include: {
            reservations: {
              where: {
                propertyId: validatedData.propertyId,
              },
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                checkIn: "desc",
              },
              take: 10,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid search type" }, { status: 400 });
    }

    // Format response
    const formattedGuests = guests.map(guest => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      countryCode: guest.countryCode,
      dateOfBirth: guest.dateOfBirth?.toISOString(),
      documentType: guest.documentType,
      documentId: guest.documentId,
      riskScore: guest.riskScore || "low",
      isVip: guest.isVip,
      gdprConsent: guest.gdprConsent,
      preferences: guest.preferences,
      notes: guest.notes,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
      reservations: guest.reservations.map(reservation => ({
        id: reservation.id,
        checkIn: reservation.checkIn.toISOString(),
        checkOut: reservation.checkOut.toISOString(),
        roomNumber: reservation.room?.name || "Unassigned",
        status: reservation.status,
        totalPrice: reservation.totalPrice || 0,
        channel: reservation.channel || "direct",
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        guests: formattedGuests,
        total: formattedGuests.length,
        query: validatedData.query,
        type: validatedData.type,
      },
    });

  } catch (error) {
    console.error("Guest search error:", error);
    return NextResponse.json(
      { error: "Failed to search guests" },
      { status: 500 }
    );
  }
}
