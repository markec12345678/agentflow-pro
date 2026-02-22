/**
 * AgentFlow Pro - Planner Service
 * Decomposes user query into sub-goals for agent execution
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export interface SubGoal {
  id: string;
  description: string;
  agentType: "research" | "content" | "code" | "deploy";
}

export interface PlanResult {
  subGoals: SubGoal[];
}

const AGENT_TYPES = ["research", "content", "code", "deploy"] as const;

const PLANNER_PROMPT = `You are a task planner for AgentFlow Pro. Given a user query, decompose it into 1-5 sub-goals. Each sub-goal must be assigned to exactly one agent:
- research: web search, market research, competitor analysis, gathering URLs/data
- content: blog posts, social copy, emails, marketing content
- code: code generation, GitHub operations, PR creation
- deploy: Vercel/Netlify deployment, site publishing

Respond ONLY with valid JSON array. No markdown, no explanation.
Format: [{"id":"1","description":"...","agentType":"research"}, ...]

User query:`;

export async function plan(
  query: string,
  llm: { apiKey: string; baseURL?: string; model: string }
): Promise<PlanResult> {
  const openai = createOpenAI({
    apiKey: llm.apiKey,
    ...(llm.baseURL && { baseURL: llm.baseURL }),
  });
  const { text } = await generateText({
    model: openai(llm.model),
    prompt: `${PLANNER_PROMPT}\n\n${query}`,
    maxOutputTokens: 500,
  });

  const trimmed = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let parsed: unknown[];
  try {
    parsed = JSON.parse(trimmed) as unknown[];
  } catch {
    return { subGoals: [] };
  }

  if (!Array.isArray(parsed)) return { subGoals: [] };

  const subGoals: SubGoal[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item == null || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const id = String(obj.id ?? obj.ID ?? i + 1);
    const description = String(obj.description ?? obj.desc ?? "").trim();
    let agentType = String(obj.agentType ?? obj.agent ?? "content").toLowerCase();
    if (!AGENT_TYPES.includes(agentType as (typeof AGENT_TYPES)[number])) {
      agentType = "content";
    }
    subGoals.push({
      id,
      description: description || `Step ${i + 1}`,
      agentType: agentType as SubGoal["agentType"],
    });
  }

  return { subGoals };
}
