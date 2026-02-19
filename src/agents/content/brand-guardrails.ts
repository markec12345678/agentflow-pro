/**
 * AgentFlow Pro - Brand Voice Guardrails
 * Validates content against Brand Voice and Style Guide
 */

export interface GuardrailResult {
  valid: boolean;
  issues: string[];
}

/**
 * Extracts "avoid X" patterns from style guide text.
 * Looks for phrases like "avoid X", "don't use X", "never use X", "do not use X".
 */
function extractAvoidPatterns(styleGuide: string): string[] {
  if (!styleGuide?.trim()) return [];
  const text = styleGuide.toLowerCase();
  const patterns: string[] = [];
  const avoidRegex = /(?:avoid|don'?t use|never use|do not use|steer clear of)\s+["']?([^"'\n.,;]+)["']?/gi;
  let m: RegExpExecArray | null;
  while ((m = avoidRegex.exec(text)) !== null) {
    const term = m[1]?.trim();
    if (term && term.length > 2) patterns.push(term);
  }
  return [...new Set(patterns)];
}

/**
 * Validates content against brand voice and style guide.
 * MVP: checks for "avoid X" terms in style guide and flags if present in content.
 */
export function validateAgainstBrandVoice(
  content: string,
  brandVoiceSummary?: string | null,
  styleGuide?: string | null
): GuardrailResult {
  const issues: string[] = [];

  if (!content?.trim()) {
    return { valid: true, issues: [] };
  }

  const avoidPatterns = extractAvoidPatterns(styleGuide ?? "");
  for (const pattern of avoidPatterns) {
    const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "i");
    if (regex.test(content)) {
      issues.push(`Style guide says to avoid "${pattern}" but it appears in the content.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
