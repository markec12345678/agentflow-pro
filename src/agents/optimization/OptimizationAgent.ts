/**
 * AgentFlow Pro - Optimization Agent
 * Uses SerpAPI for SEO optimization: keywords, meta, headlines, internal links, GEO, AEO
 */

import { searchWeb } from "@/agents/research/serpapi";
import {
  extractKeywords,
  suggestKeywords,
  suggestGeoHints,
  suggestAeoHints,
} from "@/agents/content/seo-optimizer";
import type { GeoAeoHints } from "@/agents/content/seo-optimizer";

export interface OptimizationInput {
  topic: string;
  content?: string;
  url?: string;
}

export interface OptimizationOutput {
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  headlineSuggestions: string[];
  internalLinkSuggestions: string[];
  geoHints?: GeoAeoHints;
  aeoHints?: GeoAeoHints;
}

/**
 * Runs SEO optimization for a topic/content.
 * Uses SerpAPI to analyze competitors and suggest meta, headlines, internal links.
 */
export async function runOptimization(
  input: OptimizationInput,
  serpApiKey: string
): Promise<OptimizationOutput> {
  const { topic, content } = input;
  const baseTopic = topic.trim() || "content";

  const keywords: string[] = [];
  if (content?.trim()) {
    keywords.push(...extractKeywords(content, 8));
  }
  keywords.push(...suggestKeywords(baseTopic));
  const uniqueKeywords = [...new Set(keywords)].slice(0, 10);

  let metaTitle = baseTopic;
  let metaDescription = "";
  const headlineSuggestions: string[] = [];
  const internalLinkSuggestions: string[] = [];

  if (serpApiKey) {
    try {
      const { results } = await searchWeb(
        baseTopic,
        serpApiKey,
        5
      );
      if (results.length > 0) {
        const first = results[0];
        metaTitle = first.title?.slice(0, 60) ?? metaTitle;
        metaDescription = (first.description ?? "").slice(0, 160);
        headlineSuggestions.push(
          ...results.slice(0, 3).map((r) => r.title ?? "").filter(Boolean)
        );
        internalLinkSuggestions.push(
          ...results.slice(0, 5).map((r) => r.url ?? "").filter(Boolean)
        );
      }
    } catch {
      metaTitle = `${baseTopic} | Guide & Best Practices`;
      metaDescription = `Learn about ${baseTopic}. Discover tips, strategies, and best practices.`;
      headlineSuggestions.push(
        `What is ${baseTopic}?`,
        `How to Master ${baseTopic}`,
        `${baseTopic}: Complete Guide`
      );
    }
  } else {
    metaTitle = `${baseTopic} | Guide & Best Practices`;
    metaDescription = `Learn about ${baseTopic}. Discover tips, strategies, and best practices.`;
    headlineSuggestions.push(
      `What is ${baseTopic}?`,
      `How to Master ${baseTopic}`,
      `${baseTopic}: Complete Guide`
    );
  }

  const geoHints = suggestGeoHints(baseTopic);
  const aeoHints = suggestAeoHints(baseTopic);

  return {
    keywords: uniqueKeywords,
    metaTitle: metaTitle.slice(0, 60),
    metaDescription: metaDescription.slice(0, 160),
    headlineSuggestions: headlineSuggestions.slice(0, 5),
    internalLinkSuggestions: internalLinkSuggestions.slice(0, 5),
    geoHints,
    aeoHints,
  };
}
