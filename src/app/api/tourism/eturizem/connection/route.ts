/**
 * AJPES eTurizem connection API
 * GET: check if connection exists for property
 * POST: save credentials (username, password, rnoId)
 * DELETE: remove connection
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { getUserId } from "@/lib/auth-users";
import { encrypt, isEncryptionConfigured } from "@/lib/crypto/encrypt";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await getPropertyForUser(propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const conn = await prisma.ajpesConnection.findUnique({
    where: { propertyId },
    select: { id: true, username: true, rnoId: true },
  });

  if (!conn) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    id: conn.id,
    username: conn.username,
    rnoId: conn.rnoId,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!isEncryptionConfigured()) {
    return NextResponse.json(
      {
        error:
          "AJPES_ENCRYPTION_KEY is not configured. Add to .env: openssl rand -hex 32",
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    propertyId: string;
    username?: string;
    password?: string;
    rnoId?: number;
  };

  if (!body.propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await getPropertyForUser(body.propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password?.trim();

  const existing = await prisma.ajpesConnection.findUnique({
    where: { propertyId: body.propertyId },
  });

  if (!existing && (!username || !password)) {
    return NextResponse.json(
      { error: "username and password are required for new AJPES connection" },
      { status: 400 }
    );
  }

  const updateData: {
    username?: string;
    passwordEnc?: string;
    rnoId?: number | null;
  } = {};

  if (username) updateData.username = username;
  if (password) updateData.passwordEnc = encrypt(password);
  if (body.rnoId !== undefined) updateData.rnoId = body.rnoId === 0 ? null : body.rnoId ?? null;

  if (existing && Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Provide username, password, or rnoId to update" }, { status: 400 });
  }

  const conn = existing
    ? await prisma.ajpesConnection.update({
      where: { propertyId: body.propertyId },
      data: updateData,
    })
    : await prisma.ajpesConnection.create({
      data: {
        propertyId: body.propertyId,
        username,
        passwordEnc: encrypt(password!),
        rnoId: body.rnoId ?? null,
      },
    });

  return NextResponse.json({
    id: conn.id,
    propertyId: conn.propertyId,
    username: conn.username,
    rnoId: conn.rnoId,
    message: "AJPES connection saved",
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
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const property = await getPropertyForUser(propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.ajpesConnection.deleteMany({
    where: { propertyId },
  });

  return NextResponse.json({ ok: true });
}
