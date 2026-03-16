/**
 * AgentFlow Pro - Firecrawl API client
 * Web scraping via Firecrawl API (mirrors MCP firecrawl_scrape)
 */

export interface FirecrawlScrapeResult {
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: { title?: string; description?: string };
}

export async function scrapeUrl(
  url: string,
  apiKey: string
): Promise<FirecrawlScrapeResult> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats: ["markdown", "links"] }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firecrawl scrape failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    data?: { markdown?: string; links?: string[]; metadata?: { title?: string; description?: string } };
  };
  const d = data.data ?? {};

  return {
    markdown: d.markdown,
    links: d.links ?? [],
    metadata: d.metadata,
  };
}
