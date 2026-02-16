/**
 * AgentFlow Pro - Research Agent
 * Firecrawl + Brave Search integration, structured JSON output
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { scrapeUrl } from "./firecrawl";
import { searchWeb } from "./brave";

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
  braveKey?: string;
}): Agent {
  const firecrawlKey = config?.firecrawlKey ?? process.env.FIRECRAWL_API_KEY ?? "";
  const braveKey = config?.braveKey ?? process.env.BRAVE_API_KEY ?? "";

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

      if (query && braveKey) {
        const { results } = await searchWeb(query, braveKey);
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
