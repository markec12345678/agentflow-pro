/**
 * Infrastructure Implementation: Review Repository
 *
 * Implementacija ReviewRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ReviewRepository } from "@/core/ports/repositories";

export interface ReviewDTO {
  id: string;
  propertyId: string;
  reservationId?: string;
  guestId?: string;
  rating: number;
  title?: string;
  content: string;
  platform: string;
  status: "pending" | "published" | "hidden" | "flagged";
  sentiment?: string;
  sentimentScore?: number;
  response?: string;
  respondedAt?: Date;
  respondedBy?: string;
  categories?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewRepositoryImpl implements ReviewRepository {
  /**
   * Najdi review po ID-ju
   */
  async findById(id: string): Promise<ReviewDTO | null> {
    const data = await prisma.review.findUnique({
      where: { id },
      include: {
        property: true,
        guest: true,
        reservation: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse reviews za property
   */
  async findByProperty(
    propertyId: string,
    status?: string,
    limit?: number,
  ): Promise<ReviewDTO[]> {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.review.findMany({
      where,
      include: {
        guest: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi reviews po gostu
   */
  async findByGuest(guestId: string): Promise<ReviewDTO[]> {
    const data = await prisma.review.findMany({
      where: { guestId },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov review
   */
  async create(
    review: Omit<ReviewDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<ReviewDTO> {
    const data = await prisma.review.create({
      data: {
        propertyId: review.propertyId,
        reservationId: review.reservationId,
        guestId: review.guestId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        platform: review.platform,
        status: review.status,
        sentiment: review.sentiment,
        sentimentScore: review.sentimentScore,
        categories: review.categories,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi review
   */
  async update(id: string, review: Partial<ReviewDTO>): Promise<void> {
    await prisma.review.update({
      where: { id },
      data: {
        rating: review.rating,
        title: review.title,
        content: review.content,
        status: review.status,
        sentiment: review.sentiment,
        sentimentScore: review.sentimentScore,
        response: review.response,
        respondedAt: review.respondedAt,
        respondedBy: review.respondedBy,
        categories: review.categories,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši review
   */
  async delete(id: string): Promise<void> {
    await prisma.review.delete({
      where: { id },
    });
  }

  /**
   * Odgovori na review
   */
  async respond(
    id: string,
    response: string,
    respondedBy: string,
  ): Promise<void> {
    await prisma.review.update({
      where: { id },
      data: {
        response,
        respondedBy,
        respondedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Objavi review
   */
  async publish(id: string): Promise<void> {
    await prisma.review.update({
      where: { id },
      data: {
        status: "published",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Skrij review
   */
  async hide(id: string): Promise<void> {
    await prisma.review.update({
      where: { id },
      data: {
        status: "hidden",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Flagaj review za pregled
   */
  async flag(id: string): Promise<void> {
    await prisma.review.update({
      where: { id },
      data: {
        status: "flagged",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko reviews
   */
  async getStats(propertyId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: { [key: number]: number };
    responseRate: number;
    publishedReviews: number;
  }> {
    const reviews = await this.findByProperty(propertyId);

    const totalReviews = reviews.length;
    const publishedReviews = reviews.filter(
      (r) => r.status === "published",
    ).length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const roundedRating = Math.round(r.rating);
      ratingBreakdown[roundedRating] =
        (ratingBreakdown[roundedRating] || 0) + 1;
    });

    const respondedReviews = reviews.filter((r) => r.response).length;
    const responseRate =
      totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingBreakdown,
      responseRate: Math.round(responseRate * 100) / 100,
      publishedReviews,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): ReviewDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      reservationId: data.reservationId,
      guestId: data.guestId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      platform: data.platform,
      status: data.status as any,
      sentiment: data.sentiment,
      sentimentScore: data.sentimentScore,
      response: data.response,
      respondedAt: data.respondedAt,
      respondedBy: data.respondedBy,
      categories: data.categories,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
