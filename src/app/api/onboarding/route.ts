import { Prisma } from "../../../../prisma/generated/prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { analyzeBlogUrl } from "@/lib/brand-voice";
import { indexOnboarding } from "@/lib/vector-indexer";

interface AudienceItem {
  id: string;
  name: string;
  messaging: string;
}

interface CompanyKnowledge {
  products?: string[];
  competitors?: string[];
  keyFacts?: string[];
}

interface OnboardingBody {
  industry?: string;
  company_size?: string;
  work_type?: string;
  role?: string;
  workspace_name?: string;
  location?: string;
  property_type?: string;
  blog_url?: string;
  style_guide?: string;
  visual_guidelines?: string;
  audiences?: AudienceItem[];
  company_knowledge?: CompanyKnowledge;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ onboarding: null });
    }

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      onboarding: onboarding
        ? {
          industry: onboarding.industry,
          company_size: onboarding.companySize,
          work_type: onboarding.workType,
          role: onboarding.role,
          workspace_name: onboarding.workspaceName,
          blog_url: onboarding.blogUrl,
          style_guide: onboarding.styleGuide,
          visual_guidelines: onboarding.visualGuidelines,
          audiences: (onboarding.audiences as AudienceItem[] | null) ?? null,
          company_knowledge: (onboarding.companyKnowledge as CompanyKnowledge | null) ?? null,
        }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch onboarding" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OnboardingBody;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    let brandVoiceSummary: string | null = null;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? "";
    if (body.blog_url?.trim() && firecrawlKey) {
      brandVoiceSummary = await analyzeBlogUrl(body.blog_url, firecrawlKey);
    }

    const row = await prisma.onboarding.create({
      data: {
        industry: body.industry ?? null,
        companySize: body.company_size ?? null,
        workType: body.work_type ?? null,
        role: body.role ?? null,
        workspaceName: body.workspace_name ?? null,
        blogUrl: body.blog_url ?? null,
        brandVoiceSummary,
        styleGuide: body.style_guide ?? null,
        visualGuidelines: body.visual_guidelines ?? null,
        audiences: (body.audiences?.length ? body.audiences : undefined) as Prisma.InputJsonValue | undefined,
        companyKnowledge: (() => {
          const ck = body.company_knowledge;
          if (!ck || (!ck.products?.length && !ck.competitors?.length && !ck.keyFacts?.length)) return undefined;
          return ck as Prisma.InputJsonValue;
        })(),
        userId,
      },
    });
    indexOnboarding(row.id, row);

    const industry = body.industry ?? "";
    const isTourism = industry === "tourism" || industry === "travel-agency";

    if (isTourism && userId) {
      const name = body.workspace_name?.trim() || "Moja nastanitev";
      const location = body.location?.trim() || null;
      const propType = body.property_type?.trim() || null;
      try {
        const property = await prisma.property.create({
          data: {
            userId,
            name,
            location,
            type: propType,
            basePrice: null,
            currency: "EUR",
          },
        });
        return NextResponse.json({ ok: true, propertyId: property.id });
      } catch (propErr) {
        console.error("Onboarding: property create failed", propErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Onboarding save failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { company_knowledge?: CompanyKnowledge };
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const ck = body.company_knowledge;
    const companyKnowledge =
      ck && (ck.products?.length || ck.competitors?.length || ck.keyFacts?.length)
        ? (ck as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const latest = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let row: { id: string; brandVoiceSummary?: string | null; styleGuide?: string | null; companyKnowledge?: unknown };
    if (!latest) {
      row = await prisma.onboarding.create({
        data: { userId, companyKnowledge },
      });
    } else {
      row = await prisma.onboarding.update({
        where: { id: latest.id },
        data: { companyKnowledge },
      });
    }
    indexOnboarding(row.id, row);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Company knowledge update failed" },
      { status: 500 }
    );
  }
}
