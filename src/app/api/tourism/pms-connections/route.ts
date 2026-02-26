/**
 * PMS Connections API
 * GET: list connections for user's properties
 * POST: save credentials for a property+provider
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import {
  getPropertyForUser,
  getPropertyIdsForUser,
} from "@/lib/tourism/property-access";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  const propertyIds = propertyId
    ? (await getPropertyForUser(propertyId, userId))?.id
      ? [propertyId]
      : []
    : await getPropertyIdsForUser(userId);

  if (propertyId && propertyIds.length === 0) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const connections = await prisma.pmsConnection.findMany({
    where: { propertyId: { in: propertyIds } },
    select: {
      id: true,
      propertyId: true,
      provider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    connections: connections.map((c) => ({
      id: c.id,
      propertyId: c.propertyId,
      provider: c.provider,
      hasCredentials: true,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    propertyId: string;
    provider?: string;
    accessToken?: string;
    clientToken?: string;
  };

  if (!body.propertyId || !body.accessToken || !body.clientToken) {
    return NextResponse.json(
      { error: "propertyId, accessToken, and clientToken are required" },
      { status: 400 }
    );
  }

  const property = await getPropertyForUser(body.propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const provider = body.provider ?? "mews";
  const credentials = {
    accessToken: body.accessToken,
    clientToken: body.clientToken,
  };

  const conn = await prisma.pmsConnection.upsert({
    where: {
      propertyId_provider: { propertyId: body.propertyId, provider },
    },
    create: {
      propertyId: body.propertyId,
      provider,
      credentials,
    },
    update: { credentials, updatedAt: new Date() },
  });

  return NextResponse.json({
    id: conn.id,
    propertyId: conn.propertyId,
    provider: conn.provider,
    message: "Credentials saved",
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const provider = searchParams.get("provider") ?? "mews";

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await getPropertyForUser(propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.pmsConnection.deleteMany({
    where: { propertyId, provider },
  });

  return NextResponse.json({ ok: true });
}
