/**
 * Port: AI usage logging (tokens, cost, latency)
 */

import type { AiUsageLog } from "../entities/ai-usage-log";

export interface IAiUsageLogger {
  log(entry: AiUsageLog): Promise<void>;
}
