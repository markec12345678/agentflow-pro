/**
 * LandingPage API - GET, PATCH, DELETE by id
 * On PATCH: when seoTitle/seoDescription change, updates SeoMetric entries.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { extractKeywords } from "@/agents/content/seo-optimizer";

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

    const page = await prisma.landingPage.findFirst({
      where: { id, userId },
    });

    if (!page) {
      return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch landing page" },
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
      title?: string;
      slug?: string;
      content?: Record<string, unknown>;
      template?: string;
      languages?: string[];
      seoTitle?: string;
      seoDescription?: string;
      isPublished?: boolean;
      publishedUrl?: string;
    };

    const existing = await prisma.landingPage.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim() || null;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.template !== undefined) updateData.template = body.template.trim();
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle?.trim() || null;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription?.trim() || null;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.publishedUrl !== undefined) updateData.publishedUrl = body.publishedUrl?.trim() || null;

    const updated = await prisma.landingPage.update({
      where: { id },
      data: updateData,
    });

    if (body.seoTitle !== undefined || body.seoDescription !== undefined) {
      const seoTitle = (updated.seoTitle ?? "") as string;
      const seoDescription = (updated.seoDescription ?? "") as string;
      const seoText = [seoTitle, seoDescription].filter(Boolean).join(" ");

      await prisma.seoMetric.deleteMany({
        where: { userId, contentType: "landing", contentId: id },
      });

      if (seoText) {
        const keywords = extractKeywords(seoText, 15);
        for (const keyword of keywords) {
          if (!keyword.trim()) continue;
          await prisma.seoMetric.create({
            data: {
              userId,
              contentType: "landing",
              contentId: id,
              keyword: keyword.trim(),
            },
          });
        }
      }
    }

    return NextResponse.json({ page: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update landing page" },
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

    const existing = await prisma.landingPage.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
    }

    await prisma.seoMetric.deleteMany({
      where: { contentType: "landing", contentId: id },
    });
    await prisma.landingPage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete landing page" },
      { status: 500 }
    );
  }
}
