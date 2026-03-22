import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { pageId } = await params;
    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    const page = await prisma.pageBuilderPage.findUnique({
      where: { id: pageId },
    });
    if (!page) {
      return NextResponse.json(
        { error: "Page not found", components: [] },
        { status: 404 }
      );
    }
    if (page.userId && (session?.user as { id?: string })?.id !== page.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      pageId,
      components: page.components ?? [],
      lastModified: page.lastModified.toISOString(),
    });
  } catch (error) {
    console.error("Page builder sync GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { pageId } = await params;
    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    const userId = (session?.user as { id?: string })?.id ?? null;
    const body = await request.json().catch(() => ({}));
    const components = Array.isArray(body.components) ? body.components : [];

    const page = await prisma.pageBuilderPage.upsert({
      where: { id: pageId },
      create: {
        id: pageId,
        userId,
        name: body.name ?? null,
        components,
      },
      update: {
        components,
        name: body.name ?? undefined,
        userId: userId ?? undefined,
      },
    });

    return NextResponse.json({
      pageId,
      lastModified: page.lastModified.toISOString(),
    });
  } catch (error) {
    console.error("Page builder sync POST error:", error);
    return NextResponse.json(
      { error: "Failed to save page" },
      { status: 500 }
    );
  }
}
