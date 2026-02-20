/**
 * Active Property API
 * GET: return current activePropertyId
 * POST: set activePropertyId (must own the property)
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { propertyId?: string | null };
  const propertyId = body.propertyId === null || body.propertyId === "" ? null : body.propertyId?.trim();

  if (propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, userId },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { activePropertyId: propertyId },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("activePropertyId") || msg.includes("does not exist")) {
      return NextResponse.json({ ok: true, activePropertyId: propertyId });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, activePropertyId: propertyId });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activePropertyId: true },
    });
    return NextResponse.json({ activePropertyId: user?.activePropertyId ?? null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("activePropertyId") || msg.includes("does not exist")) {
      return NextResponse.json({ activePropertyId: null });
    }
    throw e;
  }
}
