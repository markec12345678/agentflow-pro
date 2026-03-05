/**
 * Tourism Landing Page Generator API
 * POST: generates landing page content by template and form data
 * Uses ContentAgent/OpenAI when API key available, fallback to mock
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getLlmFromUserKeys } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { isMockMode } from "@/lib/mock-mode";
import { AiService } from "@/services/ai.service";

const VALID_TEMPLATES = ["tourism-basic", "luxury-retreat", "family-friendly"] as const;

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
    if (!(VALID_TEMPLATES as readonly string[]).includes(template)) {
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

    if (isMockMode()) {
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

    const userKeys = await getUserApiKeys(userId!, { masked: false });
    const llm = getLlmFromUserKeys(userKeys);

    if (!llm.apiKey) {
      for (const lang of languages) {
        const sections = buildMockSections(template, formData, lang);
        const title = formData.name ?? "Landing Page";
        pages[lang] = {
          sections,
          seoTitle: `${title} | ${formData.location ?? "Slovenija"}`,
          seoDescription: `Odkrijte ${title} v ${formData.location ?? "Sloveniji"}.`,
        };
      }
      return NextResponse.json({ success: true, pages });
    }

    const langLabels: Record<string, string> = {
      sl: "Slovenian", en: "English", de: "German", it: "Italian", hr: "Croatian",
    };

    const sectionSchema = z.object({
      heading: z.string().optional(),
      body: z.string().optional(),
      items: z.array(z.string()).optional(),
    });

    const landingPageSchema = z.object({
      sections: z.record(z.string(), sectionSchema),
      seoTitle: z.string(),
      seoDescription: z.string(),
    });

    const outputConfig = Output.object({
      schema: landingPageSchema,
      name: "LandingPage",
      description: "Tourism landing page sections and SEO meta",
    });

    for (const lang of languages) {
      try {
        const langName = langLabels[lang] ?? "Slovenian";
        const openai = createOpenAI({
          apiKey: llm.apiKey,
          ...(llm.baseURL && { baseURL: llm.baseURL }),
        });

        const prompt = `Generate a tourism accommodation landing page in ${langName}.

Property details:
- Name: ${formData.name ?? "Accommodation"}
- Location: ${formData.location ?? "Slovenia"}
- Type: ${formData.type ?? "apartment"}
- Capacity: ${formData.capacity ?? "4"}
- Features: ${formData.features ?? "WiFi, parking"}
- Price from: ${formData.priceFrom ?? "65"} EUR/night

Template: ${template}. For tourism-basic include: hero, about, rooms, amenities, cta. For luxury-retreat add: story, gallery. For family-friendly add: activities, faq.

Output JSON with:
- sections: object where each key is a section id (hero, about, rooms, amenities, cta, and template-specific ones). Each section: { heading?, body?, items? }.
- seoTitle: short SEO title for the page
- seoDescription: 1-2 sentence meta description

Write all content in ${langName}. Keep headings concise. Body text 1-3 sentences. items: bullet points if relevant.`;

        const result = await generateText({
          model: openai(llm.model),
          prompt,
          outputConfig,
        });

        const parsed = result.output;
        if (parsed?.sections && parsed?.seoTitle && parsed?.seoDescription) {
          pages[lang] = {
            sections: parsed.sections as LandingContent,
            seoTitle: parsed.seoTitle,
            seoDescription: parsed.seoDescription,
          };
        } else {
          throw new Error("Invalid AI output structure");
        }
      } catch {
        const sections = buildMockSections(template, formData, lang);
        const title = formData.name ?? "Landing Page";
        pages[lang] = {
          sections,
          seoTitle: `${title} | ${formData.location ?? "Slovenija"}`,
          seoDescription: `Odkrijte ${title} v ${formData.location ?? "Sloveniji"}.`,
        };
      }
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
