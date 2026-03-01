/**
 * Tourism Property by ID API
 * GET, PATCH, DELETE for a single property
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getPropertyForUser(id, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json(property);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPropertyForUser(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    location?: string;
    type?: string;
    capacity?: number;
    basePrice?: number;
    currency?: string;
    seasonRates?: { high?: { from: string; to: string; rate: number }[]; mid?: { from: string; to: string; rate: number }[]; low?: { from: string; to: string; rate: number }[] };
    reservationAutoApprovalRules?: { enabled: boolean; channels?: string[]; maxAmount?: number };
  };

  const data: {
    name?: string;
    location?: string | null;
    type?: string | null;
    capacity?: number | null;
    basePrice?: number | null;
    currency?: string | null;
    seasonRates?: object;
    reservationAutoApprovalRules?: object;
  } = {};
  if (body.name !== undefined) data.name = body.name?.trim() || existing.name;
  if (body.location !== undefined) data.location = body.location?.trim() || null;
  if (body.type !== undefined) data.type = body.type?.trim() || null;
  if (body.capacity !== undefined) data.capacity = typeof body.capacity === "number" ? body.capacity : null;
  if (body.basePrice !== undefined)
    data.basePrice = typeof body.basePrice === "number" ? body.basePrice : null;
  if (body.currency !== undefined) data.currency = body.currency?.trim() || null;
  if (body.seasonRates !== undefined) data.seasonRates = body.seasonRates;
  if (body.reservationAutoApprovalRules !== undefined)
    data.reservationAutoApprovalRules = body.reservationAutoApprovalRules;

  const property = await prisma.property.update({
    where: { id },
    data,
  });

  return NextResponse.json(property);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPropertyForUser(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
