import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json();
    const { type, propertyId, language, inputs } = body;

    // Simulate AI Generation logic
    // In a real app, this would call OpenAI/Anthropic/Gemini
    const content = simulateContent(type, inputs, language);
    const seoKeywords = ["turizem", "nastanitev", "Slovenija", "rezervacija", inputs.location || "lokacija"];

    return NextResponse.json({
      content,
      seoKeywords,
      usage: { tokens: 450, cost: 0.002 }
    });
  } catch (error) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function simulateContent(type: string, inputs: any, lang: string) {
  const name = inputs.name || "Nastanitev";
  const location = inputs.location || "Slovenija";
  
  const templates: any = {
    blog: {
      sl: `<h1>Zakaj obiskati ${name} v ${location}?</h1><p>Odkrijte skrite kotičke ${location} in uživajte v vrhunskem udobju naše nastanitve. ${name} je idealna izhodiščna točka za vse vaše avanture.</p><h2>Najboljše aktivnosti</h2><ul><li>Pohodništvo v naravi</li><li>Lokalna kulinarika</li><li>Sprostitev v našem spa centru</li></ul>`,
      en: `<h1>Why visit ${name} in ${location}?</h1><p>Discover the hidden gems of ${location} and enjoy the ultimate comfort of our accommodation. ${name} is the perfect starting point for all your adventures.</p><h2>Top Activities</h2><ul><li>Nature hiking</li><li>Local cuisine</li><li>Relaxation in our spa center</li></ul>`
    },
    social: {
      sl: `📸 Ste že obiskali ${location}? Pridite v ${name} in doživite nepozabne trenutke! ✨ #turizem #slovenija #dopust #oddih`,
      en: `📸 Have you visited ${location} yet? Come to ${name} and experience unforgettable moments! ✨ #travel #slovenia #vacation #relax`
    }
  };

  const base = templates[type] || templates.blog;
  return base[lang] || base.en || base.sl;
}
