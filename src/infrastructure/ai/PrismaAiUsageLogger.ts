/**
 * Infrastructure: AI usage logging via Prisma AgentRun
 */

import type { IAiUsageLogger } from "@/domain/ai";
import type { AiUsageLog } from "@/domain/ai";
import { prisma } from "@/database/schema";

export class PrismaAiUsageLogger implements IAiUsageLogger {
  async log(entry: AiUsageLog): Promise<void> {
    const credits = estimateCredits(entry.inputTokens, entry.outputTokens);
    await prisma.agentRun.create({
      data: {
        userId: entry.userId ?? null,
        agentType: entry.agentType,
        status: "completed",
        creditsConsumed: credits,
        model: entry.model ?? null,
        inputTokens: entry.inputTokens ?? null,
        outputTokens: entry.outputTokens ?? null,
        costEst: entry.costEst ?? null,
        latencyMs: entry.latencyMs ?? null,
        output: {
          inputTokens: entry.inputTokens,
          outputTokens: entry.outputTokens,
          costEst: entry.costEst,
          latencyMs: entry.latencyMs,
        } as object,
      },
    });
  }
}

function estimateCredits(inputTokens: number, outputTokens: number): number {
  const total = inputTokens + outputTokens;
  if (total <= 500) return 1;
  if (total <= 2000) return 2;
  if (total <= 5000) return 3;
  return 4;
}
