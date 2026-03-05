import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // 1. Iskanje podatkov preko Tavily (tvoj ključ)
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: "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",
      query: prompt,
      search_depth: "advanced",
      include_answer: true,
      include_images: true,
      include_raw_content: true,
    }),
  });

  const data = await response.json();

  // 2. Pretvorba podatkov v tvoj PageBuilder format
  // Tukaj AI "izbere" tvoje vtičnike (Plugins)

  // Advanced content generation
  const mainResult = data.results?.[0] || {};
  const imageUrl =
    mainResult.image || data.images?.[0] || "/placeholder-turizem.jpg";
  const rawContent = mainResult.content || mainResult.raw_content || "";

  const aiGeneratedPage = {
    title: `AI Generirana: ${prompt}`,
    metaDescription: data.answer?.substring(0, 160) + "...",
    content: [
      {
        type: "TextPlugin", // Tvoj obstoječi vtičnik
        payload: {
          html: `
            <h1>${data.answer || "Rezultati iskanja"}</h1>
            ${rawContent ? `<p>${rawContent.substring(0, 300)}...</p>` : ""}
          `,
        },
      },
      {
        type: "ImagePlugin", // Novo: dodaj sliko
        payload: {
          src: imageUrl,
          alt: `Slika: ${prompt}`,
          width: "100%",
          height: "auto",
        },
      },
      {
        type: "ButtonPlugin", // Tvoj obstoječi vtičnik
        payload: {
          label: "Preveri ponudbo",
          url: mainResult.url || "#",
          style: "primary",
        },
      },
    ],
  };

  return NextResponse.json(aiGeneratedPage);
}
