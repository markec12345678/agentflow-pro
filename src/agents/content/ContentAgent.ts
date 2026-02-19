/**
 * AgentFlow Pro - Content Agent
 * Context7 + content pipeline + SEO, multi-format output
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { getContext7ApiKey } from "@/config/env";
import { mockMode } from "@/lib/mock-mode";
import { searchLibrary, getContext } from "./context7";
import { generateContent } from "./content-generator";
import { extractKeywords, suggestKeywords, suggestGeoHints, suggestAeoHints } from "./seo-optimizer";

import type { CompanyKnowledgeInput } from "./content-generator";

export interface ContentInput {
  topic?: string;
  libraryName?: string;
  format?: "blog" | "social" | "email";
  brandVoiceSummary?: string | null;
  styleGuide?: string | null;
  visualGuidelines?: string | null;
  audienceContext?: string | null;
  companyKnowledge?: CompanyKnowledgeInput | null;
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
  const apiKey = config?.context7Key ?? getContext7ApiKey();

  return {
    id: "content-agent",
    type: "content",
    name: "Content Agent",
    execute: async (input: unknown): Promise<ContentOutput> => {
      const { topic = "", libraryName = "react", format, brandVoiceSummary, styleGuide, visualGuidelines, audienceContext, companyKnowledge } = (input as ContentInput) ?? {};
      const output: ContentOutput = {};

      if (mockMode) {
        const mockBlog = `# Mock Blog: ${topic || "Development"}\n\nTest content for development.`;
        if (format === "blog" || !format) output.blog = mockBlog;
        if (format === "social" || !format) output.social = `Mock post: ${topic || "dev"}`;
        if (format === "email" || !format) output.email = `Subject: ${topic || "Update"}\n\nMock email body.`;
        output.keywords = ["mock", "development", "test"];
        return output;
      }

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

      const geoHints = suggestGeoHints(topic);
      const aeoHints = suggestAeoHints(topic);
      const generated = generateContent(topic, snippets, {
        brandVoiceSummary,
        styleGuide,
        visualGuidelines,
        audienceContext,
        companyKnowledge,
        geoHints,
        aeoHints,
      });

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
