/**
 * AgentFlow Pro - Fire-and-forget indexing for Qdrant
 * Index Onboarding, UserTemplate, BlogPost for semantic search
 */

import { indexDocuments } from "@/vector/QdrantService";
import { getOpenAiApiKey } from "@/config/env";

function textChunk(s: string | null | undefined): string {
  return (s ?? "").trim().slice(0, 8000);
}

/** Index onboarding (brand voice, style guide, company knowledge). Non-blocking. */
export function indexOnboarding(
  id: string,
  row: { brandVoiceSummary?: string | null; styleGuide?: string | null; companyKnowledge?: unknown },
  openaiKey?: string
): void {
  const text = [
    textChunk(row.brandVoiceSummary),
    textChunk(row.styleGuide),
    typeof row.companyKnowledge === "string"
      ? textChunk(row.companyKnowledge)
      : row.companyKnowledge != null
        ? JSON.stringify(row.companyKnowledge).slice(0, 4000)
        : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  if (!text) return;
  const key = openaiKey ?? getOpenAiApiKey();
  if (!key) return;
  indexDocuments(
    [{ id: `onboarding_${id}`, text, metadata: { type: "onboarding" } }],
    key
  ).catch(() => {});
}

/** Index UserTemplate (basePrompt, content). Non-blocking. */
export function indexUserTemplate(
  id: string,
  row: { basePrompt?: string | null; content?: string | null; name?: string | null },
  openaiKey?: string
): void {
  const text = [
    textChunk(row.name),
    textChunk(row.basePrompt),
    textChunk(row.content),
  ]
    .filter(Boolean)
    .join("\n\n");
  if (!text) return;
  const key = openaiKey ?? getOpenAiApiKey();
  if (!key) return;
  indexDocuments(
    [{ id: `template_${id}`, text, metadata: { type: "userTemplate" } }],
    key
  ).catch(() => {});
}

/** Index BlogPost (title, brief, fullContent). Non-blocking. */
export function indexBlogPost(
  id: string,
  row: { title?: string | null; brief?: string | null; fullContent?: string | null },
  openaiKey?: string
): void {
  const text = [
    textChunk(row.title),
    textChunk(row.brief),
    textChunk(row.fullContent),
  ]
    .filter(Boolean)
    .join("\n\n");
  if (!text) return;
  const key = openaiKey ?? getOpenAiApiKey();
  if (!key) return;
  indexDocuments(
    [{ id: `post_${id}`, text, metadata: { type: "blogPost" } }],
    key
  ).catch(() => {});
}
