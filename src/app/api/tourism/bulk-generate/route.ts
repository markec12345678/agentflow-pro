import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { getLlmFromUserKeys } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { isMockMode } from "@/lib/mock-mode";
import { OpenAIAdapter, DataSanitizer, PrismaAiUsageLogger } from "@/infrastructure/ai";
import { AiService } from "@/services/ai.service";

// POST /api/tourism/bulk-generate - generate content for multiple properties
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      propertyIds, // Array of property IDs
      promptId,
      variables,   // Shared variables
      perPropertyVariables, // { [propertyId]: { specific vars } }
      languages,   // Array of language codes
    } = body;

    if (!propertyIds?.length || !promptId) {
      return NextResponse.json(
        { error: "Property IDs and prompt ID are required" },
        { status: 400 }
      );
    }

    // Fetch prompt template
    const { PROMPTS } = await import("@/data/prompts");
    const promptTemplate = PROMPTS.find((p) => p.id === promptId);

    if (!promptTemplate) {
      return NextResponse.json(
        { error: "Prompt template not found" },
        { status: 404 }
      );
    }

    // Get properties (user must have access via ownership or shared)
    const allowedIds = await getPropertyIdsForUser(userId);
    const filteredIds = propertyIds.filter((id: string) => allowedIds.includes(id));
    if (filteredIds.length === 0) {
      return NextResponse.json(
        { error: "No accessible properties found" },
        { status: 403 }
      );
    }
    const properties = await prisma.property.findMany({
      where: { id: { in: filteredIds } },
      select: {
        id: true,
        name: true,
        location: true,
        type: true,
        amenities: true,
        description: true,
      },
    });

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const llm = getLlmFromUserKeys(userKeys);
    const mock = isMockMode() || !llm.apiKey;
    const aiService = mock ? undefined : new AiService({
      llm: new OpenAIAdapter(llm),
      usageLogger: new PrismaAiUsageLogger(),
      sanitizer: new DataSanitizer()
    });

    const results = [];
    const errors = [];

    // Generate for each property and language combination
    for (const property of properties) {
      const propertyVars = perPropertyVariables?.[property.id] || {};

      // Auto-fill property-specific variables (match PROMPTS variable names)
      const autoFilledVars: Record<string, string> = {
        lokacija: property.location ?? "",
        tip: property.type ?? "",
        posebnosti: Array.isArray(property.amenities) ? property.amenities.join(", ") : "",
        ime_nastanitve: property.name ?? "",
        name: property.name ?? "",
        destinacija: property.location ?? "",
        ...variables,
        ...propertyVars,
      };

      for (const language of languages || ["sl"]) {
        const finalVars = {
          ...autoFilledVars,
          jezik: language,
        };

        try {
          const content = await generateContentWithAi(
            promptTemplate.prompt,
            finalVars,
            { llm, mock }
          );

          // Save to database (ContentHistory schema: userId, type, content, status, promptType, propertyId)
          const contentWithMeta = `[${language}] ${content}`;
          const savedContent = await prisma.contentHistory.create({
            data: {
              userId,
              propertyId: property.id,
              type: promptId,
              content: contentWithMeta,
              status: "generated",
              promptType: promptId,
            },
          });

          results.push({
            propertyId: property.id,
            propertyName: property.name,
            language,
            contentId: savedContent.id,
            status: "success",
          });
        } catch (err) {
          errors.push({
            propertyId: property.id,
            propertyName: property.name,
            language,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
      summary: {
        totalProperties: properties.length,
        totalLanguages: languages?.length || 1,
        totalAttempts: properties.length * (languages?.length || 1),
      },
    });
  } catch (error) {
    logger.error("Bulk generate error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk generation" },
      { status: 500 }
    );
  }
}

// GET /api/tourism/bulk-generate/status - check bulk job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // In production, fetch from job queue (Redis, Bull, etc.)
    // For now, return mock status
    return NextResponse.json({
      jobId,
      status: "completed", // 'pending', 'processing', 'completed', 'failed'
      progress: 100,
      completed: 10,
      total: 10,
      failed: 0,
    });
  } catch (error) {
    logger.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

// Helper: mock content when no API key or MOCK_MODE
function getMockContent(variables: Record<string, string>, prompt: string): string {
  const mockResponses: Record<string, string> = {
    "booking-description": `Nastanitev v srcu ${variables.lokacija || "Slovenije"} ponuja edinstveno izkušnjo. Popolnoma opremljen ${variables.tip || "apartma"} za udobno bivanje.`,
    "airbnb-story": `Predstavljajte si, da se zbudite ob čudovitem pogledu na ${variables.lokacija || "naravo"}. Topel, oseben prostor, ki vas bo očaral.`,
    "destination-guide": `Odkrijte zaklad ${variables.destinacija || variables.lokacija || "Slovenije"}. Od čudovitih naravnih lepot do bogate kulturne dediščine.`,
    "seasonal-campaign": `Posebna ponudba! Rezervirajte zdaj in uživajte v nepozabnem počitnikovanju. ${variables.ponudba || variables.offer || ""}`,
    "instagram-travel": `Popoln dan v ${variables.lokacija || "raju"} 🌟 #Travel #Slovenia #Vacation`,
    "restaurant-menu": `Naša restavracija ponuja izvrstno kulinariko s poudarkom na lokalnih sestavinah.`,
    "activity-experience": `Ne zamudite te edinstvene priložnosti za ${variables.aktivnost || "raziskovanje"}.`,
    "wedding-event": `Ustvarite nepozabne spomine na vašem posebnem dnevu v naši čarobni lokaciji.`,
    "corporate-b2b": `Profesionalno okolje za vaše poslovne potrebe. WiFi, AV oprema, catering.`,
    "pre-arrival-email": `Pozdravljeni ${variables.ime_gosta || "gost"}! Veselimo se vašega prihoda.`,
    "post-stay-review": `Hvala za vaš obisk! Prosimo, delite svojo izkušnjo z drugimi.`,
  };
  const templateKey = Object.keys(mockResponses).find((k) => prompt.includes(k)) || "default";
  return mockResponses[templateKey] || `[MOCK] Generirana vsebina za: ${prompt.slice(0, 80)}...`;
}

// Generate content via AI or mock
async function generateContentWithAi(
  template: string,
  variables: Record<string, string>,
  opts: { llm: { apiKey: string; baseURL?: string; model: string }; mock: boolean }
): Promise<string> {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    const val = value ?? "";
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "gi"), val);
  }

  if (opts.mock) {
    return getMockContent(variables, prompt);
  }

  const openai = createOpenAI({
    apiKey: opts.llm.apiKey,
    ...(opts.llm.baseURL && { baseURL: opts.llm.baseURL }),
  });

  const result = await generateText({
    model: openai(opts.llm.model),
    prompt: `You are a tourism hospitality content writer. Follow the instructions exactly. Output only the requested content – no meta commentary, no "Here is your..." headers.

Instructions:
${prompt}`,
    temperature: 0.6,
  });

  return result.text?.trim() ?? getMockContent(variables, prompt);
}
