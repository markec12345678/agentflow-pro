/**
 * Port: PII removal before sending data to LLM
 */

export interface IDataSanitizer {
  sanitize(text: string): string;
}
