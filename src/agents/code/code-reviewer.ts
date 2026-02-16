/**
 * AgentFlow Pro - Code reviewer
 * Rule-based checks: TODO/FIXME, long lines, basic structure
 */

export interface ReviewSuggestion {
  path: string;
  line?: number;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface ReviewResult {
  suggestions: ReviewSuggestion[];
}

const MAX_LINE_LENGTH = 120;
const TODO_PATTERN = /TODO|FIXME|XXX/;
const HACK_PATTERN = /\bHACK\b/;

export function reviewCode(
  files: Array<{ path: string; content: string }>
): ReviewResult {
  const suggestions: ReviewSuggestion[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line.length > MAX_LINE_LENGTH) {
        suggestions.push({
          path: file.path,
          line: lineNum,
          message: `Line exceeds ${MAX_LINE_LENGTH} characters (${line.length})`,
          severity: "warning",
        });
      }
      if (TODO_PATTERN.test(line)) {
        suggestions.push({
          path: file.path,
          line: lineNum,
          message: "TODO/FIXME/XXX found - consider addressing",
          severity: "info",
        });
      }
      if (HACK_PATTERN.test(line)) {
        suggestions.push({
          path: file.path,
          line: lineNum,
          message: "HACK found - consider refactoring",
          severity: "warning",
        });
      }
    }
  }

  return { suggestions };
}
