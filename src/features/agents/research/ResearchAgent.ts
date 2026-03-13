/**
 * AgentFlow Pro - Research Agent
 * Firecrawl + SerpAPI integration, structured JSON output
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { isMockMode } from "@/lib/mock-mode";
import { scrapeUrl } from "./firecrawl";
import { searchWeb } from "./serpapi";

export interface ResearchInput {
  query?: string;
  urls?: string[];
}

export interface ResearchOutput {
  urls: string[];
  scrapedData: Array<{ url: string; markdown?: string; links?: string[] }>;
  searchResults: Array<{ url: string; title: string; description?: string }>;
}

export function createResearchAgent(config?: {
  firecrawlKey?: string;
  serpApiKey?: string;
}): Agent {
  const firecrawlKey = config?.firecrawlKey ?? process.env.FIRECRAWL_API_KEY ?? "";
  const serpApiKey = config?.serpApiKey ?? process.env.SERPAPI_API_KEY ?? "";

  return {
    id: "research-agent",
    type: "research",
    name: "Research Agent",
    execute: async (input: unknown): Promise<ResearchOutput> => {
      const { query, urls = [] } = (input as ResearchInput) ?? {};
      const output: ResearchOutput = {
        urls: [],
        scrapedData: [],
        searchResults: [],
      };

      if (isMockMode()) {
        return {
          urls: ["https://example.com"],
          scrapedData: [{ url: "https://example.com", markdown: "Mock Test data" }],
          searchResults: [{ url: "https://example.com", title: "Mock", description: "Test data" }],
        };
      }

      if (query && serpApiKey) {
        const { results } = await searchWeb(query, serpApiKey);
        output.searchResults = results;
        output.urls = results.map((r) => r.url);
      }

      for (const url of urls) {
        if (firecrawlKey) {
          try {
            const data = await scrapeUrl(url, firecrawlKey);
            output.scrapedData.push({
              url,
              markdown: data.markdown,
              links: data.links,
            });
          } catch {
            output.scrapedData.push({ url });
          }
        }
      }

      return output;
    },
  };
}
