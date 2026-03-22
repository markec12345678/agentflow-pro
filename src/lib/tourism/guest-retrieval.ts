/**
 * AgentFlow Pro - Guest Retrieval Agent (Blok C #9)
 * Fetches Property, Guest, Reservation, and brand context from DB for multi-agent flow.
 * Optionally augments with Knowledge Graph entities (Property, Guest, Reservation).
 */

import { prisma } from "@/database/schema";
import type { MemoryBackend } from "@/memory/memory-backend";

export interface RetrievalContext {
  property?: {
    id: string;
    name: string;
    location: string | null;
    type: string | null;
    capacity: number | null;
    description: string | null;
  };
  guest?: {
    id: string;
    name: string;
    email: string | null;
  };
  reservations?: Array<{
    checkIn: string;
    checkOut: string;
    status: string;
  }>;
  brand?: {
    brandVoiceSummary: string | null;
    styleGuide: string | null;
  };
  kgContext?: string;
}

export async function retrieveGuestContext(opts: {
  propertyId?: string;
  guestId?: string;
  userId?: string;
  kgBackend?: MemoryBackend;
}): Promise<RetrievalContext> {
  const ctx: RetrievalContext = {};

  if (opts.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: opts.propertyId },
      select: {
        id: true,
        name: true,
        location: true,
        type: true,
        capacity: true,
        description: true,
        userId: true,
      },
    });
    if (property) {
      ctx.property = {
        id: property.id,
        name: property.name,
        location: property.location,
        type: property.type,
        capacity: property.capacity,
        description: property.description,
      };
      if (property.userId) {
        const onboarding = await prisma.onboarding.findFirst({
          where: { userId: property.userId },
          orderBy: { createdAt: "desc" },
          select: { brandVoiceSummary: true, styleGuide: true },
        });
        if (onboarding) {
          ctx.brand = {
            brandVoiceSummary: onboarding.brandVoiceSummary,
            styleGuide: onboarding.styleGuide,
          };
        }
      }
    }
  }

  if (opts.guestId) {
    const guest = await prisma.guest.findUnique({
      where: { id: opts.guestId },
      select: { id: true, name: true, email: true },
    });
    if (guest) ctx.guest = { id: guest.id, name: guest.name, email: guest.email };
  }

  if (opts.propertyId || opts.guestId) {
    const where: { propertyId?: string; guestId?: string } = {};
    if (opts.propertyId) where.propertyId = opts.propertyId;
    if (opts.guestId) where.guestId = opts.guestId;

    const reservations = await prisma.reservation.findMany({
      where: { ...where, status: "confirmed" },
      orderBy: { checkIn: "desc" },
      take: 5,
      select: { checkIn: true, checkOut: true, status: true },
    });
    if (reservations.length > 0) {
      ctx.reservations = reservations.map((r) => ({
        checkIn: r.checkIn.toISOString().slice(0, 10),
        checkOut: r.checkOut.toISOString().slice(0, 10),
        status: r.status,
      }));
    }
  }

  if (opts.userId && !ctx.brand) {
    const onboarding = await prisma.onboarding.findFirst({
      where: { userId: opts.userId },
      orderBy: { createdAt: "desc" },
      select: { brandVoiceSummary: true, styleGuide: true },
    });
    if (onboarding) {
      ctx.brand = {
        brandVoiceSummary: onboarding.brandVoiceSummary,
        styleGuide: onboarding.styleGuide,
      };
    }
  }

  if (opts.kgBackend && (opts.propertyId || opts.guestId)) {
    const searchTerms = [
      opts.propertyId ? `property:${opts.propertyId}` : "",
      opts.guestId ? `guest:${opts.guestId}` : "",
    ].filter(Boolean);
    const kgParts: string[] = [];
    for (const term of searchTerms) {
      const { entities } = opts.kgBackend.searchNodes(term);
      for (const e of entities) {
        if (e.observations?.length) {
          kgParts.push(`${e.entityType} ${e.name}: ${e.observations.join("; ")}`);
        }
      }
    }
    if (kgParts.length > 0) ctx.kgContext = kgParts.join("\n");
  }

  return ctx;
}

/** Format retrieval context as string for LLM prompt. */
export function formatRetrievalContext(ctx: RetrievalContext): string {
  const parts: string[] = [];
  if (ctx.kgContext) parts.push(`[KG context]\n${ctx.kgContext}`);
  if (ctx.property) {
    parts.push(
      `Property: ${ctx.property.name}`,
      ctx.property.location ? `Location: ${ctx.property.location}` : "",
      ctx.property.type ? `Type: ${ctx.property.type}` : "",
      ctx.property.capacity ? `Capacity: ${ctx.property.capacity}` : "",
      ctx.property.description ? `Description: ${ctx.property.description.slice(0, 500)}` : ""
    );
  }
  if (ctx.guest) {
    parts.push(`Guest: ${ctx.guest.name}`, ctx.guest.email ? `Email: ${ctx.guest.email}` : "");
  }
  if (ctx.reservations?.length) {
    parts.push(
      "Upcoming reservations:",
      ...ctx.reservations.map(
        (r) => `  - ${r.checkIn} to ${r.checkOut} (${r.status})`
      )
    );
  }
  if (ctx.brand?.brandVoiceSummary) {
    parts.push(`Brand voice: ${ctx.brand.brandVoiceSummary.slice(0, 300)}`);
  }
  if (ctx.brand?.styleGuide) {
    parts.push(`Style: ${ctx.brand.styleGuide.slice(0, 200)}`);
  }
  return parts.filter(Boolean).join("\n");
}
