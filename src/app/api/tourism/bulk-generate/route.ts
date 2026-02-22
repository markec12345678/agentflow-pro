import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/tourism/bulk-generate - generate content for multiple properties
export async function POST(request: NextRequest) {
  try {
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

    // Get properties
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        name: true,
        location: true,
        type: true,
        amenities: true,
        description: true,
      },
    });

    const results = [];
    const errors = [];

    // Generate for each property and language combination
    for (const property of properties) {
      const propertyVars = perPropertyVariables?.[property.id] || {};
      
      // Auto-fill property-specific variables
      const autoFilledVars = {
        lokacija: property.location,
        tip: property.type,
        posebnosti: property.amenities?.join(", "),
        ...variables,
        ...propertyVars,
      };

      for (const language of languages || ["SL"]) {
        const finalVars = {
          ...autoFilledVars,
          jezik: language,
        };

        try {
          // Generate content using AI
          const content = await generateContent(promptTemplate.prompt, finalVars);

          // Save to database
          const savedContent = await prisma.contentHistory.create({
            data: {
              propertyId: property.id,
              promptType: promptId,
              language,
              content,
              variables: finalVars,
              status: "generated",
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
    console.error("Bulk generate error:", error);
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
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

// Helper function to generate content
async function generateContent(template: string, variables: Record<string, string>): Promise<string> {
  // Replace variables in template
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }

  // In production, call AI service (OpenAI, Claude, etc.)
  // For now, return mock content
  const mockResponses: Record<string, string> = {
    "booking-description": `Nastanitev v srcu ${variables.lokacija || "Slovenije"} ponuja edinstveno izkušnjo. Popolnoma opremljen ${variables.tip || "apartma"} za udobno bivanje.`,
    "airbnb-story": `Predstavljajte si, da se zbudite ob čudovitem pogledu na ${variables.lokacija || "naravo"}. Topel, oseben prostor, ki vas bo očaral.`,
    "destination-guide": `Odkrijte zaklad ${variables.destinacija || "Slovenije"}. Od čudovitih naravnih lepot do bogate kulturne dediščine.`,
    "seasonal-campaign": `Posebna ponudba! Rezervirajte zdaj in uživajte v nepozabnem počitnikovanju. ${variables.ponudba || ""}`,
    "instagram-travel": `Popoln dan v ${variables.lokacija || "raju"} 🌟 #Travel #Slovenia #Vacation`,
    "restaurant-menu": `Naša restavracija ponuja izvrstno kulinariko s poudarkom na lokalnih sestavinah.`,
    "activity-experience": `Ne zamudite te edinstvene priložnosti za ${variables.aktivnost || "raziskovanje"}.`,
    "wedding-event": `Ustvarite nepozabne spomine na vašem posebnem dnevu v naši čarobni lokaciji.`,
    "corporate-b2b": `Profesionalno okolje za vaše poslovne potrebe. WiFi, AV oprema, catering.`,
    "pre-arrival-email": `Pozdravljeni ${variables.ime_gosta || "gost"}! Veselimo se vašega prihoda.`,
    "post-stay-review": `Hvala za vaš obisk! Prosimo, delite svojo izkušnjo z drugimi.`,
  };

  // Determine which template is being used
  const templateKey = Object.keys(mockResponses).find((k) => prompt.includes(k)) || "default";
  
  return mockResponses[templateKey] || `Generirana vsebina za: ${prompt.slice(0, 50)}...`;
}
