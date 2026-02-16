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
