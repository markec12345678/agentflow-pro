/**
 * Tourism Properties API
 * GET: list all properties for user
 * POST: create new property
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getAppBackend } from "@/memory/app-backend";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { syncPropertyToKg } from "@/lib/tourism/tourism-kg-sync";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const propertyIds = await getPropertyIdsForUser(userId);
  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    location?: string;
    type?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const property = await prisma.property.create({
    data: {
      userId,
      name,
      location: body.location?.trim() || null,
      type: body.type?.trim() || null,
      capacity: typeof body.capacity === "number" ? body.capacity : null,
      basePrice: typeof body.basePrice === "number" ? body.basePrice : null,
      currency: body.currency?.trim() || null,
    },
  });

  try {
    await syncPropertyToKg(getAppBackend(), property.id);
  } catch {
    /* KG sync optional */
  }

  return NextResponse.json(property);
}
