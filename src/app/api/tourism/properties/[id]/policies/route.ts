/**
 * Policies API for a property
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
  syncPoliciesToKg,
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

  const policies = await prisma.propertyPolicy.findMany({
    where: { propertyId: id },
    orderBy: { policyType: "asc" },
  });
  return NextResponse.json({ policies });
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

  const body = (await request.json().catch(() => ({}))) as { policyType?: string; content?: string };
  const policyType = body.policyType?.trim();
  const content = body.content?.trim();
  if (!policyType || !content) {
    return NextResponse.json({ error: "policyType and content are required" }, { status: 400 });
  }

  const policy = await prisma.propertyPolicy.create({
    data: {
      propertyId: id,
      policyType,
      content,
    },
  });

  try {
    const backend = getAppBackend();
    await syncPropertyToKg(backend, id);
    await syncPoliciesToKg(backend, id);
  } catch {
    /* KG sync optional */
  }

  return NextResponse.json(policy);
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
  const policyId = searchParams.get("policyId");
  if (!policyId) {
    return NextResponse.json({ error: "policyId query param required" }, { status: 400 });
  }

  const policy = await prisma.propertyPolicy.findFirst({
    where: { id: policyId, propertyId: id },
  });
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  await prisma.propertyPolicy.delete({ where: { id: policyId } });

  try {
    const backend = getAppBackend();
    await syncPropertyTreeToKg(backend, id);
  } catch {
    /* KG sync optional */
  }

  return NextResponse.json({ ok: true });
}
