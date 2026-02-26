/**
 * AgentFlow Pro - FAQ JSON-LD Schema (GEO razširitev)
 * Generates schema.org FAQPage for ChatGPT, Perplexity, Google.
 */

export interface FaqEntry {
  question: string;
  answer: string;
  category?: string;
}

export function generateFaqSchema(faqs: FaqEntry[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/** Returns JSON-LD as string for embedding in HTML script tag. */
export function generateFaqSchemaString(faqs: FaqEntry[]): string {
  return JSON.stringify(generateFaqSchema(faqs));
}
