/**
 * AgentFlow Pro - SerpAPI client
 * Web search via SerpAPI (Google search results)
 */

export interface SerpApiSearchResult {
  url: string;
  title: string;
  description?: string;
}

export interface SerpApiSearchResponse {
  results: SerpApiSearchResult[];
}

export async function searchWeb(
  query: string,
  apiKey: string,
  count = 5
): Promise<SerpApiSearchResponse> {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: apiKey,
    num: String(count),
  });
  const res = await fetch(
    `https://serpapi.com/search.json?${params}`
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SerpAPI search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    organic_results?: Array<{
      link?: string;
      title?: string;
      snippet?: string;
    }>;
  };

  const results: SerpApiSearchResult[] = (data.organic_results ?? []).map(
    (r) => ({
      url: r.link ?? "",
      title: r.title ?? "",
      description: r.snippet,
    })
  );

  return { results };
}
