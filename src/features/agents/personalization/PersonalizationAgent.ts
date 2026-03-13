/**
 * AgentFlow Pro - Personalization Agent
 * Template + data → personalized content per row
 */

import type { Agent } from "../../orchestrator/Orchestrator";

export interface PersonalizationInput {
  template: string;
  data: Record<string, string>[];
}

export interface PersonalizationOutput {
  results: string[];
}

function replacePlaceholders(
  template: string,
  row: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(row)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
    result = result.replace(placeholder, String(value ?? ""));
  }
  return result;
}

export function createPersonalizationAgent(): Agent {
  return {
    id: "personalization-agent",
    type: "personalization",
    name: "Personalization Agent",
    execute: async (input: unknown): Promise<PersonalizationOutput> => {
      const { template = "", data = [] } = (input as PersonalizationInput) ?? {};
      const results = data.map((row) => replacePlaceholders(template, row));
      return { results };
    },
  };
}
