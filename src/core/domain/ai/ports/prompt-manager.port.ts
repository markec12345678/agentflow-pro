/**
 * Port: Prompt template resolution (versioned slugs, variable substitution)
 */

export interface IPromptManager {
  resolve(
    slug: string,
    vars?: Record<string, string>
  ): Promise<string>;
}
