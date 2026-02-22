/**
 * UserTemplate API - GET (list), POST (create)
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { indexUserTemplate } from "@/lib/vector-indexer";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const propertyId = searchParams.get("propertyId");

    const where: { userId: string; category?: string; OR?: { propertyId: string | null }[] } = { userId };
    if (category) {
      where.category = category;
    }
    if (propertyId) {
      where.OR = [{ propertyId: null }, { propertyId }];
    }

    const templates = await prisma.userTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name: string;
      category: string;
      basePrompt: string;
      customVars?: Record<string, string>;
      content?: string;
      language?: string;
      propertyId?: string | null;
    };

    const { name, category, basePrompt, customVars, content, language, propertyId } = body;

    if (!name?.trim() || !category?.trim() || !basePrompt?.trim()) {
      return NextResponse.json(
        { error: "name, category, and basePrompt are required" },
        { status: 400 }
      );
    }

    const template = await prisma.userTemplate.create({
      data: {
        userId,
        propertyId: propertyId?.trim() || null,
        name: name.trim(),
        category: category.trim(),
        basePrompt: basePrompt.trim(),
        customVars: customVars ?? undefined,
        content: content?.trim() ?? undefined,
        language: language?.trim() ?? undefined,
      },
    });
    indexUserTemplate(template.id, template);

    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create template" },
      { status: 500 }
    );
  }
}
