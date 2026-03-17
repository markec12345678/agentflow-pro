// Substitute prompt helper for tourism emails
export function substitutePrompt(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}
