/**
 * Infrastructure Implementation: Landing Page Repository
 *
 * Implementacija LandingPageRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { LandingPageRepository } from "@/core/ports/repositories";

export interface LandingPageDTO {
  id: string;
  userId: string;
  propertyId?: string;
  title: string;
  slug?: string;
  content: any;
  template: string;
  languages: string[];
  isPublished: boolean;
  publishedUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LandingPageRepositoryImpl implements LandingPageRepository {
  /**
   * Najdi landing page po ID-ju
   */
  async findById(id: string): Promise<LandingPageDTO | null> {
    const data = await prisma.landingPage.findUnique({
      where: { id },
      include: {
        property: true,
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi landing page po slug-u
   */
  async findBySlug(slug: string): Promise<LandingPageDTO | null> {
    const data = await prisma.landingPage.findFirst({
      where: { slug },
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
   * Najdi vse landing pages za user-ja
   */
  async findByUser(
    userId: string,
    publishedOnly?: boolean,
  ): Promise<LandingPageDTO[]> {
    const where: any = { userId };

    if (publishedOnly) {
      where.isPublished = true;
    }

    const data = await prisma.landingPage.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi landing pages za property
   */
  async findByProperty(propertyId: string): Promise<LandingPageDTO[]> {
    const data = await prisma.landingPage.findMany({
      where: {
        propertyId,
        isPublished: true,
      },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novo landing page
   */
  async create(
    page: Omit<LandingPageDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<LandingPageDTO> {
    const data = await prisma.landingPage.create({
      data: {
        userId: page.userId,
        propertyId: page.propertyId,
        title: page.title,
        slug: page.slug,
        content: page.content,
        template: page.template,
        languages: page.languages,
        isPublished: page.isPublished,
        publishedUrl: page.publishedUrl,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi landing page
   */
  async update(id: string, page: Partial<LandingPageDTO>): Promise<void> {
    await prisma.landingPage.update({
      where: { id },
      data: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        template: page.template,
        languages: page.languages,
        isPublished: page.isPublished,
        publishedUrl: page.publishedUrl,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši landing page
   */
  async delete(id: string): Promise<void> {
    await prisma.landingPage.delete({
      where: { id },
    });
  }

  /**
   * Objavi landing page
   */
  async publish(id: string, publishedUrl?: string): Promise<void> {
    await prisma.landingPage.update({
      where: { id },
      data: {
        isPublished: true,
        publishedUrl,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Skrij landing page
   */
  async unpublish(id: string): Promise<void> {
    await prisma.landingPage.update({
      where: { id },
      data: {
        isPublished: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generiraj unikaten slug
   */
  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (await this.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): LandingPageDTO {
    return {
      id: data.id,
      userId: data.userId,
      propertyId: data.propertyId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      template: data.template,
      languages: data.languages,
      isPublished: data.isPublished,
      publishedUrl: data.publishedUrl,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
