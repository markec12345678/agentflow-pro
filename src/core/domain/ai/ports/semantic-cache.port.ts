/**
 * Port: Semantic cache for LLM responses (optional)
 */

export interface ISemanticCache {
  get(keyHash: string): Promise<string | null>;
  set(keyHash: string, value: string, ttlSeconds: number): Promise<void>;
}
