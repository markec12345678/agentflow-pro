/**
 * AgentFlow Pro - Data Cleanup (Roadmap § 2.B.6)
 * Deduplikacija gostov (email, name+property), anomalije rezervacij.
 */

import { prisma } from "@/database/schema";

export interface DeduplicationReport {
  type: "guest_email" | "guest_name_property";
  duplicates: Array<{ ids: string[]; key: string; keepId: string; mergeIds: string[] }>;
  merged: number;
}

export interface AnomalyReport {
  type: "checkout_before_checkin" | "negative_price";
  reservationIds: string[];
  count: number;
}

export interface DataCleanupResult {
  deduplication: {
    guestByEmail: DeduplicationReport;
    guestByNameProperty: DeduplicationReport;
  };
  anomalies: AnomalyReport[];
  dryRun: boolean;
  timestamp: string;
}

function normalizeEmail(email: string | null): string | null {
  if (!email || typeof email !== "string") return null;
  return email.toLowerCase().trim();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function guestWhere(propertyId?: string, propertyIds?: string[]) {
  if (propertyId) return { propertyId };
  if (propertyIds && propertyIds.length > 0) return { propertyId: { in: propertyIds } };
  return { propertyId: { in: [] as string[] } };
}

/** Find duplicate guests by email (within same property or across properties). */
export async function findGuestDuplicatesByEmail(
  propertyId?: string,
  propertyIds?: string[]
): Promise<DeduplicationReport> {
  const where = guestWhere(propertyId, propertyIds);
  const guests = await prisma.guest.findMany({
    where,
    select: { id: true, email: true, name: true, propertyId: true, createdAt: true },
  });

  const byEmail = new Map<string, typeof guests>();
  for (const g of guests) {
    const email = normalizeEmail(g.email);
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(g);
    byEmail.set(email, list);
  }

  const duplicates: DeduplicationReport["duplicates"] = [];
  let merged = 0;

  for (const [email, list] of byEmail) {
    if (list.length < 2) continue;
    const sorted = [...list].sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
    );
    const keepId = sorted[0].id;
    const mergeIds = sorted.slice(1).map((g) => g.id);
    duplicates.push({
      ids: list.map((g) => g.id),
      key: email,
      keepId,
      mergeIds,
    });
    merged += mergeIds.length;
  }

  return { type: "guest_email", duplicates, merged };
}

/** Find duplicate guests by name+property. */
export async function findGuestDuplicatesByNameProperty(
  propertyId?: string,
  propertyIds?: string[]
): Promise<DeduplicationReport> {
  const where = guestWhere(propertyId, propertyIds);
  const guests = await prisma.guest.findMany({
    where,
    select: { id: true, name: true, propertyId: true },
  });

  const byKey = new Map<string, typeof guests>();
  for (const g of guests) {
    const key = `${normalizeName(g.name)}|${g.propertyId ?? ""}`;
    const list = byKey.get(key) ?? [];
    list.push(g);
    byKey.set(key, list);
  }

  const duplicates: DeduplicationReport["duplicates"] = [];
  let merged = 0;

  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const keepId = sorted[0].id;
    const mergeIds = sorted.slice(1).map((g) => g.id);
    duplicates.push({
      ids: list.map((g) => g.id),
      key,
      keepId,
      mergeIds,
    });
    merged += mergeIds.length;
  }

  return { type: "guest_name_property", duplicates, merged };
}

/** Find reservation anomalies: checkOut < checkIn, negative totalPrice. */
export async function findReservationAnomalies(
  propertyId?: string
): Promise<AnomalyReport[]> {
  const where = propertyId ? { propertyId } : {};
  const reservations = await prisma.reservation.findMany({
    where,
    select: { id: true, checkIn: true, checkOut: true, totalPrice: true },
  });

  const checkoutBeforeCheckin: string[] = [];
  const negativePrice: string[] = [];

  for (const r of reservations) {
    if (r.checkOut < r.checkIn) {
      checkoutBeforeCheckin.push(r.id);
    }
    if (r.totalPrice != null && r.totalPrice < 0) {
      negativePrice.push(r.id);
    }
  }

  const result: AnomalyReport[] = [];
  if (checkoutBeforeCheckin.length > 0) {
    result.push({
      type: "checkout_before_checkin",
      reservationIds: checkoutBeforeCheckin,
      count: checkoutBeforeCheckin.length,
    });
  }
  if (negativePrice.length > 0) {
    result.push({
      type: "negative_price",
      reservationIds: negativePrice,
      count: negativePrice.length,
    });
  }
  return result;
}

/** Run data cleanup. Returns report. When dryRun=false, merges duplicates and flags anomalies. */
export async function runDataCleanup(opts: {
  propertyId?: string;
  propertyIds?: string[];
  dryRun?: boolean;
  mergeDuplicates?: boolean;
}): Promise<DataCleanupResult> {
  const { propertyId, propertyIds, dryRun = true, mergeDuplicates = false } = opts;

  const [guestByEmail, guestByNameProperty, anomalies] = await Promise.all([
    findGuestDuplicatesByEmail(propertyId, propertyIds),
    findGuestDuplicatesByNameProperty(propertyId, propertyIds),
    findReservationAnomalies(propertyId, propertyIds),
  ]);

  const mergedIds = new Set<string>();
  if (!dryRun && mergeDuplicates) {
    for (const dup of guestByEmail.duplicates) {
      for (const mergeId of dup.mergeIds) {
        if (mergedIds.has(mergeId)) continue;
        await prisma.reservation.updateMany({
          where: { guestId: mergeId },
          data: { guestId: dup.keepId },
        });
        await prisma.guest.delete({ where: { id: mergeId } });
        mergedIds.add(mergeId);
      }
    }
    for (const dup of guestByNameProperty.duplicates) {
      for (const mergeId of dup.mergeIds) {
        if (mergedIds.has(mergeId)) continue;
        await prisma.reservation.updateMany({
          where: { guestId: mergeId },
          data: { guestId: dup.keepId },
        });
        await prisma.guestCommunication.updateMany({
          where: { guestId: mergeId },
          data: { guestId: dup.keepId },
        });
        await prisma.guest.delete({ where: { id: mergeId } });
        mergedIds.add(mergeId);
      }
    }
  }

  return {
    deduplication: {
      guestByEmail,
      guestByNameProperty,
    },
    anomalies,
    dryRun,
    timestamp: new Date().toISOString(),
  };
}
