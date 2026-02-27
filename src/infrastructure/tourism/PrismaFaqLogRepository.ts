/**
 * Infrastructure: Prisma implementation of IFaqLogRepository
 */

import { prisma } from "@/database/schema";
import type { IFaqLogRepository } from "@/domain/tourism/ports/faq-log-repository";

export class PrismaFaqLogRepository implements IFaqLogRepository {
  async log(
    question: string,
    responseTimeMs: number,
    confidence: number,
    propertyId: string | null
  ): Promise<void> {
    try {
      await prisma.faqResponseLog.create({
        data: {
          question: question.slice(0, 2000),
          responseTimeMs,
          confidence,
          propertyId,
        },
      });
    } catch (e) {
      console.warn("FaqResponseLog create failed:", e);
    }
  }
}
