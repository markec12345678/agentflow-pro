/**
 * Tourism Landing Page Generator API
 * POST: generates landing page content by template and form data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { mockMode } from "@/lib/mock-mode";

const VALID_TEMPLATES = ["tourism-basic", "luxury-retreat", "family-friendly"] as const;

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

type LandingSection = { heading?: string; body?: string; items?: string[] };
type LandingContent = Record<string, LandingSection>;

function buildMockSections(
  template: string,
  formData: {
    name?: string;
    location?: string;
    type?: string;
    capacity?: string;
    features?: string;
    priceFrom?: string;
  },
  lang: string
): LandingContent {
  const langLabel = { sl: "sl", en: "en", de: "de", it: "it", hr: "hr" }[lang] ?? "sl";
  const name = formData.name ?? "Nastanitev";
  const location = formData.location ?? "Slovenija";
  const type = formData.type ?? "apartma";
  const price = formData.priceFrom ?? "65";

  const heroText =
    langLabel === "sl"
      ? `Dobrodošli v ${name}`
      : langLabel === "en"
        ? `Welcome to ${name}`
        : langLabel === "de"
          ? `Willkommen bei ${name}`
          : langLabel === "it"
            ? `Benvenuti a ${name}`
            : `Dobrodošli u ${name}`;

  const aboutText =
    langLabel === "sl"
      ? `${name} je ${type} v ${location}. Idealno za počitnice in kratke oddihi.`
      : langLabel === "en"
        ? `${name} is a ${type} in ${location}. Ideal for holidays and short breaks.`
        : langLabel === "de"
          ? `${name} ist eine ${type} in ${location}. Ideal für Urlaub und Kurzaufenthalte.`
          : langLabel === "it"
            ? `${name} è un ${type} a ${location}. Ideale per vacanze e soggiorni brevi.`
            : `${name} je ${type} u ${location}. Idealno za odmor i kratke pauze.`;

  const baseSections: LandingContent = {
    hero: {
      heading: heroText,
      body: `${location} – vaša nova destinacija`,
      items: [],
    },
    about: {
      heading: langLabel === "sl" ? "O nas" : langLabel === "en" ? "About us" : "Über uns",
      body: aboutText,
      items: [],
    },
    rooms: {
      heading: langLabel === "sl" ? "Nastanitve" : langLabel === "en" ? "Rooms" : "Zimmer",
      body: langLabel === "sl" ? `Na voljo so udobne ${type}s.` : `Comfortable ${type}s available.`,
      items: ["WiFi", "Parkirišče", "Oprema za kuhanje"],
    },
    amenities: {
      heading: langLabel === "sl" ? "Posebnosti" : langLabel === "en" ? "Amenities" : "Ausstattung",
      body: formData.features ?? "Vse za udobno bivanje.",
      items: [],
    },
    cta: {
      heading: langLabel === "sl" ? "Rezervirajte zdaj" : langLabel === "en" ? "Book now" : "Jetzt buchen",
      body: `${langLabel === "sl" ? "Cene od" : "From"} ${price}€/${langLabel === "sl" ? "noč" : "night"}`,
      items: [],
    },
  };

  if (template === "luxury-retreat") {
    return {
      ...baseSections,
      story: {
        heading: langLabel === "sl" ? "Zgodba" : "Story",
        body: `Luksuzni oddih v ${location}.`,
        items: [],
      },
      gallery: {
        heading: langLabel === "sl" ? "Galerija" : "Gallery",
        body: "",
        items: [],
      },
    };
  }

  if (template === "family-friendly") {
    return {
      ...baseSections,
      activities: {
        heading: langLabel === "sl" ? "Aktivnosti" : "Activities",
        body: langLabel === "sl" ? "Družinsko prilagojeno." : "Family-friendly.",
        items: [],
      },
      faq: {
        heading: "FAQ",
        body: "",
        items: [],
      },
    };
  }

  return baseSections;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      template?: string;
      formData?: Record<string, unknown>;
      languages?: string[];
    };

    const template = body.template ?? "tourism-basic";
    if (!VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Use one of: ${VALID_TEMPLATES.join(", ")}` },
        { status: 400 }
      );
    }

    const formData = (body.formData ?? {}) as {
      name?: string;
      location?: string;
      type?: string;
      capacity?: string;
      features?: string;
      priceFrom?: string;
      contactEmail?: string;
      contactPhone?: string;
    };

    const languages = Array.isArray(body.languages) && body.languages.length > 0
      ? body.languages.filter((l) => ["sl", "en", "de", "it", "hr"].includes(String(l)))
      : ["sl"];

    const pages: Record<string, { sections: LandingContent; seoTitle: string; seoDescription: string }> = {};

    if (mockMode) {
      for (const lang of languages) {
        const sections = buildMockSections(template, formData, lang);
        const title = formData.name ?? "Landing Page";
        pages[lang] = {
          sections,
          seoTitle: `${title} | ${formData.location ?? "Slovenija"}`,
          seoDescription: `Odkrijte ${title} v ${formData.location ?? "Sloveniji"}.`,
        };
      }
      return NextResponse.json({
        success: true,
        pages,
      });
    }

    // Non-mock: use ContentAgent per language (TODO Phase 3)
    // For now, fall back to mock-like output
    for (const lang of languages) {
      const sections = buildMockSections(template, formData, lang);
      const title = formData.name ?? "Landing Page";
      pages[lang] = {
        sections,
        seoTitle: `${title} | ${formData.location ?? "Slovenija"}`,
        seoDescription: `Odkrijte ${title} v ${formData.location ?? "Sloveniji"}.`,
      };
    }

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
