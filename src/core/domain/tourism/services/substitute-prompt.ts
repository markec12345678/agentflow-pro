/**
 * Substitute {placeholder} tokens in a template with values from vars.
 */
export function substitutePrompt(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
