/**
 * Domain entity: AI message (role + content for chat format)
 */

export type AiMessageRole = "system" | "user" | "assistant";

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}
