/**
 * AgentFlow Pro - Context7 API client
 * Documentation retrieval via Context7 HTTP API
 */

const BASE = "https://context7.com/api/v2";

export interface LibraryResult {
  id: string;
  name: string;
  description?: string;
  totalSnippets?: number;
  trustScore?: number;
}

export interface Snippet {
  title: string;
  content: string;
  source?: string;
}

export async function searchLibrary(
  libraryName: string,
  query: string,
  apiKey: string
): Promise<LibraryResult[]> {
  const params = new URLSearchParams({ libraryName, query });
  const res = await fetch(`${BASE}/libs/search?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Context7 search failed: ${res.status}`);
  const data = (await res.json()) as LibraryResult[];
  return Array.isArray(data) ? data : [];
}

export async function getContext(
  libraryId: string,
  query: string,
  apiKey: string,
  type: "json" | "txt" = "json"
): Promise<Snippet[] | string> {
  const params = new URLSearchParams({ libraryId, query, type });
  const res = await fetch(`${BASE}/context?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Context7 getContext failed: ${res.status}`);

  if (type === "txt") return res.text();
  const data = (await res.json()) as Snippet[];
  return Array.isArray(data) ? data : [];
}
