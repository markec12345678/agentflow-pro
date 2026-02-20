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

interface GetOrchestratorOptions {
  userApiKeys?: Record<string, string>;
  strict?: boolean;
}

export function getOrchestrator({
  userApiKeys,
  strict = false,
}: GetOrchestratorOptions = {}): Orchestrator {
  const k = userApiKeys ?? {};

  const firecrawlKey = k.firecrawl ?? getFirecrawlApiKey();
  const serpApiKey = k.serpapi ?? getSerpApiKey();
  const context7Key = k.context7 ?? getContext7ApiKey();
  const openaiKey = k.openai ?? getOpenAiApiKey();
  const githubToken = k.github ?? (process.env.GITHUB_TOKEN ?? "");
  const vercelToken = k.vercel ?? (process.env.VERCEL_TOKEN ?? "");
  const netlifyToken = k.netlify ?? (process.env.NETLIFY_TOKEN ?? "");

  const orch = new Orchestrator();

  const addAgent = (agentFactory: Function, config: Record<string, string>, agentName: string) => {
    const missingKeys = Object.entries(config)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingKeys.length > 0) {
      const errorMessage = `Missing API keys for ${agentName} agent: ${missingKeys.join(", ")}`;
      if (strict) {
        throw new Error(errorMessage);
      } else {
        console.warn(errorMessage);
        return;
      }
    }
    orch.registerAgent(agentFactory(config));
  };

  addAgent(createResearchAgent, { firecrawlKey, serpApiKey }, "Research");
  addAgent(createContentAgent, { context7Key }, "Content");
  addAgent(createCodeAgent, { githubToken, openaiKey }, "Code");
  addAgent(createDeployAgent, { vercelToken, netlifyToken }, "Deploy");

  return orch;
}
