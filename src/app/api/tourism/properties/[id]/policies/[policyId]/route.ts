/**
 * Individual Policy API for a property
 * GET, PATCH, DELETE for a specific policy
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, policyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const policy = await prisma.propertyPolicy.findFirst({
      where: { 
        id: policyId,
        propertyId 
      }
    });

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Policy API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, policyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingPolicy = await prisma.propertyPolicy.findFirst({
      where: { 
        id: policyId,
        propertyId 
      }
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, policyType } = body;

    const data: any = {};
    if (content !== undefined) data.content = content?.trim() || existingPolicy.content;
    if (policyType !== undefined) data.policyType = policyType?.trim() || existingPolicy.policyType;

    const policy = await prisma.propertyPolicy.update({
      where: { id: policyId },
      data,
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Update policy API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, policyId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingPolicy = await prisma.propertyPolicy.findFirst({
      where: { 
        id: policyId,
        propertyId 
      }
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    await prisma.propertyPolicy.delete({
      where: { id: policyId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete policy API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
