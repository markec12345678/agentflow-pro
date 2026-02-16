/**
 * AgentFlow Pro - Content Agent
 * Context7 + content pipeline + SEO, multi-format output
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { searchLibrary, getContext } from "./context7";
import { generateContent } from "./content-generator";
import { extractKeywords, suggestKeywords } from "./seo-optimizer";

export interface ContentInput {
  topic?: string;
  libraryName?: string;
  format?: "blog" | "social" | "email";
}

export interface ContentOutput {
  blog?: string;
  social?: string;
  email?: string;
  keywords?: string[];
}

export function createContentAgent(config?: {
  context7Key?: string;
}): Agent {
  const apiKey = config?.context7Key ?? process.env.CONTEXT7_API_KEY ?? "";

  return {
    id: "content-agent",
    type: "content",
    name: "Content Agent",
    execute: async (input: unknown): Promise<ContentOutput> => {
      const { topic = "", libraryName = "react", format } = (input as ContentInput) ?? {};
      const output: ContentOutput = {};

      let snippets: { title: string; content: string; source?: string }[] = [];

      if (apiKey && topic) {
        try {
          const libs = await searchLibrary(libraryName, topic, apiKey);
          const libId = libs[0]?.id ?? `/${libraryName}`;
          const ctx = await getContext(libId, topic, apiKey);
          snippets = Array.isArray(ctx) ? ctx : [];
        } catch {
          snippets = [];
        }
      }

      const generated = generateContent(topic, snippets);

      if (format === "blog" || !format) output.blog = generated.blog;
      if (format === "social" || !format) output.social = generated.social;
      if (format === "email" || !format) output.email = generated.email;

      output.keywords = [
        ...extractKeywords(generated.blog ?? ""),
        ...suggestKeywords(topic),
      ].slice(0, 10);

      return output;
    },
  };
}
