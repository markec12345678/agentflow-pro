/**
 * AgentFlow Pro - SEO keyword analysis
 */

const STOP_WORDS = new Set(
  "a an the is are was were be been being have has had do does did will would could should may might must can and or but if then else when at by for of with to in on".split(
    " "
  )
);

export function extractKeywords(text: string, limit = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export function suggestKeywords(topic: string): string[] {
  const base = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const suffixes = ["guide", "tutorial", "tips", "best practices", "examples"];
  return [...base, ...suffixes.map((s) => `${base[0] ?? topic} ${s}`)];
}

export interface GeoAeoHints {
  faqSuggestions: string[];
  featuredSnippetHints: string[];
  conversionPatterns: string[];
}

/**
 * Suggests GEO (Generative Engine Optimization) hints for a topic.
 * Helps content rank in AI-powered search (ChatGPT, Perplexity, etc.).
 */
export function suggestGeoHints(topic: string): GeoAeoHints {
  const base = topic.trim();
  const faqSuggestions = [
    `What is ${base}?`,
    `How does ${base} work?`,
    `Why is ${base} important?`,
    `What are the best practices for ${base}?`,
    `How to get started with ${base}?`,
  ];
  const featuredSnippetHints = [
    `${base} is a topic that encompasses...`,
    `The key steps for ${base} include: 1) ... 2) ... 3) ...`,
    `When considering ${base}, focus on...`,
  ];
  const conversionPatterns = [
    "Include clear definitions and summaries",
    "Use structured lists and numbered steps",
    "Add FAQ-style Q&A sections",
    "Provide actionable takeaways",
  ];
  return { faqSuggestions, featuredSnippetHints, conversionPatterns };
}

/**
 * Suggests AEO (Answer Engine Optimization) hints for a topic.
 * Optimizes for featured snippets and direct answers (Google, Bing).
 */
export function suggestAeoHints(topic: string): GeoAeoHints {
  const base = topic.trim();
  const faqSuggestions = [
    `What is ${base}?`,
    `How to use ${base}?`,
    `What are the benefits of ${base}?`,
    `What are common ${base} mistakes?`,
    `How to improve ${base}?`,
  ];
  const featuredSnippetHints = [
    `Define ${base} in the first paragraph (40-60 words)`,
    `Use "How to" subheadings for step-by-step content`,
    `Include comparison tables where relevant`,
    `Add a concise summary or key takeaways box`,
  ];
  const conversionPatterns = [
    "Lead with a direct answer to the main question",
    "Use schema-friendly headings (H2, H3)",
    "Include bullet lists for scannability",
    "Add a clear conclusion or CTA",
  ];
  return { faqSuggestions, featuredSnippetHints, conversionPatterns };
}
