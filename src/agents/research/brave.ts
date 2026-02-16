/**
 * AgentFlow Pro - Brave Search API client
 * Web search via Brave API (mirrors MCP Brave Search)
 */

export interface BraveSearchResult {
  url: string;
  title: string;
  description?: string;
}

export interface BraveSearchResponse {
  results: BraveSearchResult[];
}

export async function searchWeb(
  query: string,
  apiKey: string,
  count = 5
): Promise<BraveSearchResponse> {
  const params = new URLSearchParams({ q: query, count: String(count) });
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: { "X-Subscription-Token": apiKey },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brave search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    web?: { results?: Array<{ url: string; title: string; description?: string }> };
  };
  const results: BraveSearchResult[] = (data.web?.results ?? []).map((r) => ({
    url: r.url,
    title: r.title,
    description: r.description,
  }));

  return { results };
}
