/**
 * UserTemplate API - GET, PATCH, DELETE by id
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { indexUserTemplate } from "@/lib/vector-indexer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.userTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      customVars?: Record<string, string>;
      content?: string;
      language?: string;
      isPublic?: boolean;
    };

    const template = await prisma.userTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const updated = await prisma.userTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.customVars !== undefined && { customVars: body.customVars }),
        ...(body.content !== undefined && { content: body.content?.trim() ?? null }),
        ...(body.language !== undefined && { language: body.language?.trim() ?? null }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });
    indexUserTemplate(updated.id, updated);

    return NextResponse.json({ template: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.userTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.userTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete template" },
      { status: 500 }
    );
  }
}
