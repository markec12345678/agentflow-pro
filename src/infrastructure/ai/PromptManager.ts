/**
 * Infrastructure: Prompt template resolution (versioned slugs, variable substitution)
 */

import type { IPromptManager } from "@/domain/ai";
import { PROMPTS } from "@/data/prompts";

/** Hardcoded tourism prompts (from route strings) - keyed by slug */
const TOURISM_SLUGS: Record<string, string> = {
  "tourism.content.v1": `You are a tourism hospitality content writer. Follow the instructions exactly. Output only the requested content – no meta commentary, no explanations, no headers like "Here is your..." or "I have generated...".

Instructions:
{{INSTRUCTIONS}}`,
  "tourism.email.v1": `You are a tourism hospitality email writer. Follow the instructions exactly. Output only the email content – no meta commentary.

Instructions:
{{INSTRUCTIONS}}`,
  "tourism.translate.v1": `Translate the following text to {{TARGET_LANG}}. Preserve tone and formatting. Output only the translation.

Text:
{{TEXT}}`,
};

export class PromptManager implements IPromptManager {
  async resolve(slug: string, vars?: Record<string, string>): Promise<string> {
    let template = TOURISM_SLUGS[slug];

    if (!template) {
      const baseId = slug.replace(/\.v\d+$/, "").replace(/\./g, "-");
      const promptDef = PROMPTS.find((p) => p.id === baseId);
      template = promptDef?.prompt ?? slug;
    }

    return substituteVars(template, vars ?? {});
  }
}

function substituteVars(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, "g");
    out = out.replace(placeholder, value);
  }
  return out;
}
