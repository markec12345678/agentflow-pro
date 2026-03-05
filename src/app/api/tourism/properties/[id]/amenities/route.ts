/**
 * Amenities API for a property
 * GET: list, POST: create, DELETE: remove by id
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getAppBackend } from "@/memory/app-backend";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import {
  syncPropertyToKg,
  syncAmenitiesToKg,
  syncPropertyTreeToKg,
} from "@/lib/tourism/tourism-kg-sync";

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

  const amenities = await prisma.amenity.findMany({
    where: { propertyId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ amenities });
}

export async function POST(
  request: NextRequest,
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

  const body = (await request.json().catch(() => ({}))) as { name?: string; category?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const amenity = await prisma.amenity.create({
    data: {
      propertyId: id,
      name,
      category: body.category?.trim() || null,
    },
  });

  try {
    const backend = getAppBackend();
    await syncPropertyToKg(backend, id);
    await syncAmenitiesToKg(backend, id);
  } catch {
    /* KG sync optional */
  }

  return NextResponse.json(amenity);
}

export async function DELETE(
  request: NextRequest,
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

  const { searchParams } = new URL(request.url);
  const amenityId = searchParams.get("amenityId");
  if (!amenityId) {
    return NextResponse.json({ error: "amenityId query param required" }, { status: 400 });
  }

  const amenity = await prisma.amenity.findFirst({
    where: { id: amenityId, propertyId: id },
  });
  if (!amenity) {
    return NextResponse.json({ error: "Amenity not found" }, { status: 404 });
  }

  await prisma.amenity.delete({ where: { id: amenityId } });

  try {
    const backend = getAppBackend();
    await syncPropertyTreeToKg(backend, id);
  } catch {
    /* KG sync optional */
  }

  return NextResponse.json({ ok: true });
}
