/**
 * Mock for @/lib/user-keys - used by batch-translate tests
 */
export function getLlmApiKey(): { apiKey: string; baseURL?: string; model: string } {
  return { apiKey: "", model: "gpt-4o-mini" };
}

export async function getUserApiKeys(
  _userId: string,
  _opts?: { masked?: boolean }
): Promise<Record<string, string>> {
  return {
    openai: "test-openai-key"
  };
}

export async function setUserApiKeys(
  _userId: string,
  _keys: Record<string, string>
): Promise<void> { }

export async function getUserApiKeysForExecution(
  _userId: string
): Promise<Record<string, string>> {
  return {};
}

export type ApiKeyProvider = string;
