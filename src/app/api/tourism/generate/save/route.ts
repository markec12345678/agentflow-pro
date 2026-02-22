/**
 * Save Hotel Core generated content to LandingPage and SeoMetric
 * POST: { landing, seo, title, propertyId? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      landing?: Record<string, string>;
      seo?: Record<string, { meta_title?: string; meta_description?: string; keywords?: string[] }>;
      booking?: Record<string, string>;
      email?: Record<string, string>;
      title?: string;
      propertyId?: string | null;
    };

    const { landing, seo, booking, email, title, propertyId } = body;

    if (!landing || typeof landing !== "object" || Object.keys(landing).length === 0) {
      return NextResponse.json(
        { error: "landing (object with lang keys and HTML values) is required" },
        { status: 400 }
      );
    }

    const pageTitle = title?.trim() || "Hotel Landing";

    const firstLang = Object.keys(landing)[0] ?? "SL";
    const firstSeo = seo?.[firstLang] ?? seo?.SL ?? (seo ? Object.values(seo)[0] : null);

    const page = await prisma.landingPage.create({
      data: {
        userId,
        title: pageTitle,
        content: { htmlByLang: landing },
        template: "hotel-core",
        languages: Object.keys(landing),
        seoTitle: firstSeo?.meta_title ?? null,
        seoDescription: firstSeo?.meta_description ?? null,
        propertyId: propertyId?.trim() || null,
      },
    });

    if (firstSeo?.keywords?.length) {
      for (const kw of firstSeo.keywords.slice(0, 10)) {
        if (!kw?.trim()) continue;
        await prisma.seoMetric.create({
          data: { userId, contentType: "landing", contentId: page.id, keyword: kw.trim() },
        });
      }
    }

    if (booking || email) {
      const sourceLang = "sl";
      const langs = [
        ...new Set([
          ...Object.keys(booking ?? {}),
          ...Object.keys(email ?? {}),
        ]),
      ].filter((l) => l !== sourceLang);
      await prisma.translationJob.create({
        data: {
          userId,
          sourceContent: booking?.["SL"] ?? booking?.["sl"] ?? Object.values(booking ?? {})[0] ?? "",
          sourceLang,
          targetLangs: langs.length > 0 ? langs : ["en", "de", "it"],
          status: "completed",
          results: { booking: booking ?? {}, email: email ?? {} },
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, pageId: page.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 }
    );
  }
}
