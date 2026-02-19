/**
 * Tourism Properties API
 * GET: list all properties for user
 * POST: create new property
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

function getUserId(session: { user?: { userId?: string; email?: string } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { userId },
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
    },
  });

  return NextResponse.json(property);
}
