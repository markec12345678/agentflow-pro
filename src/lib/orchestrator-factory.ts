/**
 * AgentFlow Pro - Orchestrator factory
 */

import { Orchestrator } from "@/orchestrator/Orchestrator";
import { createResearchAgent } from "@/agents/research/ResearchAgent";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { createCodeAgent } from "@/agents/code/CodeAgent";
import { createDeployAgent } from "@/agents/deploy/DeployAgent";
import {
  getContext7ApiKey,
  getFirecrawlApiKey,
  getSerpApiKey,
  getOpenAiApiKey,
} from "@/config/env";

export function getOrchestrator(
  userApiKeys?: Record<string, string>
): Orchestrator {
  const k = userApiKeys ?? {};
  const firecrawlKey = k.firecrawl ?? getFirecrawlApiKey();
  const serpApiKey = k.serpapi ?? getSerpApiKey();
  const context7Key = k.context7 ?? getContext7ApiKey();
  const openaiKey = k.openai ?? getOpenAiApiKey();
  const githubToken = k.github ?? (process.env.GITHUB_TOKEN ?? "");
  const vercelToken = k.vercel ?? (process.env.VERCEL_TOKEN ?? "");
  const netlifyToken = k.netlify ?? (process.env.NETLIFY_TOKEN ?? "");

  const orch = new Orchestrator();
  orch.registerAgent(createResearchAgent({ firecrawlKey, serpApiKey }));
  orch.registerAgent(createContentAgent({ context7Key }));
  orch.registerAgent(createCodeAgent({ githubToken, openaiKey }));
  orch.registerAgent(
    createDeployAgent({ vercelToken, netlifyToken })
  );
  return orch;
}
