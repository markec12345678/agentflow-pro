/**
 * Infrastructure Implementation: FAQ Response Log Repository
 *
 * Implementacija FaqResponseLogRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { FaqResponseLogRepository } from "@/core/ports/repositories";

export interface FaqResponseLogDTO {
  id: string;
  propertyId: string;
  question: string;
  answer: string;
  matched: boolean;
  confidence?: number;
  source: "chatbot" | "email" | "phone" | "website" | "other";
  guestId?: string;
  userId?: string;
  helpful?: boolean;
  feedback?: string;
  createdAt: Date;
}

export class FaqResponseLogRepositoryImpl implements FaqResponseLogRepository {
  /**
   * Najdi log po ID-ju
   */
  async findById(id: string): Promise<FaqResponseLogDTO | null> {
    const data = await prisma.faqResponseLog.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse logs za property
   */
  async findByProperty(
    propertyId: string,
    limit?: number,
  ): Promise<FaqResponseLogDTO[]> {
    const data = await prisma.faqResponseLog.findMany({
      where: { propertyId },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov log
   */
  async create(
    log: Omit<FaqResponseLogDTO, "id" | "createdAt">,
  ): Promise<FaqResponseLogDTO> {
    const data = await prisma.faqResponseLog.create({
      data: {
        propertyId: log.propertyId,
        question: log.question,
        answer: log.answer,
        matched: log.matched,
        confidence: log.confidence,
        source: log.source,
        guestId: log.guestId,
        userId: log.userId,
        helpful: log.helpful,
        feedback: log.feedback,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi feedback
   */
  async updateFeedback(
    id: string,
    helpful: boolean,
    feedback?: string,
  ): Promise<void> {
    await prisma.faqResponseLog.update({
      where: { id },
      data: {
        helpful,
        feedback,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare logs
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.faqResponseLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko FAQ responses
   */
  async getStats(
    propertyId?: string,
    days: number = 30,
  ): Promise<{
    totalResponses: number;
    matchedResponses: number;
    unmatchedResponses: number;
    matchRate: number;
    helpfulResponses: number;
    unhelpfulResponses: number;
    helpfulRate: number;
    topQuestions: { question: string; count: number }[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: cutoffDate,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const logs = await prisma.faqResponseLog.findMany({
      where,
    });

    const totalResponses = logs.length;
    const matchedResponses = logs.filter((l) => l.matched).length;
    const unmatchedResponses = logs.filter((l) => !l.matched).length;
    const matchRate =
      totalResponses > 0 ? (matchedResponses / totalResponses) * 100 : 0;

    const logsWithFeedback = logs.filter((l) => l.helpful !== undefined);
    const helpfulResponses = logsWithFeedback.filter((l) => l.helpful).length;
    const unhelpfulResponses = logsWithFeedback.filter(
      (l) => !l.helpful,
    ).length;
    const helpfulRate =
      logsWithFeedback.length > 0
        ? (helpfulResponses / logsWithFeedback.length) * 100
        : 0;

    // Top questions
    const questionCounts: { [key: string]: number } = {};
    logs.forEach((l) => {
      const normalizedQuestion = l.question.toLowerCase().trim();
      questionCounts[normalizedQuestion] =
        (questionCounts[normalizedQuestion] || 0) + 1;
    });

    const topQuestions = Object.entries(questionCounts)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalResponses,
      matchedResponses,
      unmatchedResponses,
      matchRate: Math.round(matchRate * 100) / 100,
      helpfulResponses,
      unhelpfulResponses,
      helpfulRate: Math.round(helpfulRate * 100) / 100,
      topQuestions,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): FaqResponseLogDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      question: data.question,
      answer: data.answer,
      matched: data.matched,
      confidence: data.confidence,
      source: data.source as any,
      guestId: data.guestId,
      userId: data.userId,
      helpful: data.helpful,
      feedback: data.feedback,
      createdAt: data.createdAt,
    };
  }
}
