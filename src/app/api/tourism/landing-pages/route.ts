/**
 * LandingPage API - GET (list), POST (create)
 * On create: extracts keywords from seoTitle/seoDescription and creates SeoMetric entries.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { extractKeywords } from "@/agents/content/seo-optimizer";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (propertyId) {
      const property = await getPropertyForUser(propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
    }

    const where: { userId: string; propertyId?: string | null } = { userId };
    if (propertyId) {
      where.propertyId = propertyId;
    }

    const pages = await prisma.landingPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ pages });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch landing pages" },
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
      title: string;
      slug?: string;
      content: Record<string, unknown>;
      template?: string;
      languages?: string[];
      seoTitle?: string;
      seoDescription?: string;
      propertyId?: string | null;
    };

    const { title, slug, content, template, languages, seoTitle, seoDescription, propertyId } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "content must be a valid JSON object" },
        { status: 400 }
      );
    }

    if (propertyId?.trim()) {
      const property = await getPropertyForUser(propertyId.trim(), userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
    }

    const finalSlug = slug?.trim() || title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const langs = Array.isArray(languages) ? languages : Object.keys(content);

    const page = await prisma.landingPage.create({
      data: {
        userId,
        propertyId: propertyId?.trim() || null,
        title: title.trim(),
        slug: finalSlug,
        content: JSON.parse(JSON.stringify(content)),
        template: template?.trim() || "tourism-basic",
        languages: langs,
        seoTitle: seoTitle?.trim() ?? null,
        seoDescription: seoDescription?.trim() ?? null,
      },
    });

    const seoText = [seoTitle?.trim(), seoDescription?.trim()].filter(Boolean).join(" ");
    if (seoText) {
      const keywords = extractKeywords(seoText, 15);
      for (const keyword of keywords) {
        if (!keyword.trim()) continue;
        await prisma.seoMetric.create({
          data: {
            userId,
            contentType: "landing",
            contentId: page.id,
            keyword: keyword.trim(),
          },
        });
      }
    }

    return NextResponse.json({ page });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create landing page" },
      { status: 500 }
    );
  }
}
