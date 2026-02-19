/**
 * Brand Voice Analysis - fetch blog URL content for brand context
 */

import { scrapeUrl } from "@/agents/research/firecrawl";

const MAX_SUMMARY_CHARS = 3000;

export async function analyzeBlogUrl(
  url: string,
  apiKey: string
): Promise<string | null> {
  if (!url?.trim() || !apiKey) return null;

  try {
    const result = await scrapeUrl(url, apiKey);
    const text = result.markdown ?? result.metadata?.description ?? "";
    if (!text) return null;

    return text.slice(0, MAX_SUMMARY_CHARS);
  } catch {
    return null;
  }
}
