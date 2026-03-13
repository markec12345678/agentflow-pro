/**
 * AgentFlow Pro - Tourism KG Sync (Blok C #10)
 * Syncs Property, Guest, Reservation from DB into Knowledge Graph.
 */

import { prisma } from "@/database/schema";
import type { MemoryBackend } from "@/memory/memory-backend";

export async function syncPropertyToKg(
  backend: MemoryBackend,
  propertyId: string
): Promise<void> {
  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
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
  if (!prop) return;

  const obs: string[] = [
    `name: ${prop.name}`,
    prop.location ? `location: ${prop.location}` : "",
    prop.type ? `type: ${prop.type}` : "",
    prop.capacity != null ? `capacity: ${prop.capacity}` : "",
    prop.description ? `description: ${prop.description.slice(0, 300)}` : "",
  ].filter(Boolean);

  backend.createEntities([
    { name: `property:${prop.id}`, entityType: "Property", observations: obs },
  ]);

  if (prop.userId) {
    backend.createRelations([
      { from: `property:${prop.id}`, to: `user:${prop.userId}`, relationType: "belongsTo" },
    ]);
  }
}

export async function syncAmenitiesToKg(
  backend: MemoryBackend,
  propertyId: string
): Promise<void> {
  const amenities = await prisma.amenity.findMany({
    where: { propertyId },
  });
  for (const a of amenities) {
    const obs = [`name: ${a.name}`, a.category ? `category: ${a.category}` : ""].filter(Boolean);
    backend.createEntities([
      { name: `amenity:${a.id}`, entityType: "Amenity", observations: obs },
    ]);
    backend.createRelations([
      { from: `property:${propertyId}`, to: `amenity:${a.id}`, relationType: "hasAmenity" },
    ]);
  }
}

export async function syncPoliciesToKg(
  backend: MemoryBackend,
  propertyId: string
): Promise<void> {
  const policies = await prisma.propertyPolicy.findMany({
    where: { propertyId },
  });
  for (const p of policies) {
    const obs = [
      `type: ${p.policyType}`,
      `content: ${p.content.slice(0, 200)}`,
    ];
    backend.createEntities([
      { name: `policy:${p.id}`, entityType: "Policy", observations: obs },
    ]);
    backend.createRelations([
      { from: `property:${propertyId}`, to: `policy:${p.id}`, relationType: "hasPolicy" },
    ]);
  }
}

export async function syncGuestToKg(
  backend: MemoryBackend,
  guestId: string
): Promise<void> {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { property: { select: { id: true } } },
  });
  if (!guest) return;

  const obs: string[] = [
    `name: ${guest.name}`,
    guest.email ? `email: ${guest.email}` : "",
    guest.phone ? `phone: ${guest.phone}` : "",
  ].filter(Boolean);

  backend.createEntities([
    { name: `guest:${guest.id}`, entityType: "Guest", observations: obs },
  ]);

  if (guest.propertyId) {
    backend.createRelations([
      { from: `property:${guest.propertyId}`, to: `guest:${guest.id}`, relationType: "hasGuest" },
    ]);
  }
}

export async function syncReservationToKg(
  backend: MemoryBackend,
  reservationId: string
): Promise<void> {
  const res = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!res) return;

  const obs: string[] = [
    `checkIn: ${res.checkIn.toISOString().slice(0, 10)}`,
    `checkOut: ${res.checkOut.toISOString().slice(0, 10)}`,
    `status: ${res.status}`,
    res.channel ? `channel: ${res.channel}` : "",
  ].filter(Boolean);

  backend.createEntities([
    { name: `reservation:${res.id}`, entityType: "Reservation", observations: obs },
  ]);

  backend.createRelations([
    { from: `property:${res.propertyId}`, to: `reservation:${res.id}`, relationType: "hasReservation" },
  ]);
  if (res.guestId) {
    backend.createRelations([
      { from: `guest:${res.guestId}`, to: `reservation:${res.id}`, relationType: "hasReservation" },
    ]);
  }
}

/** Sync all tourism entities for a property into KG. */
export async function syncPropertyTreeToKg(
  backend: MemoryBackend,
  propertyId: string
): Promise<void> {
  await syncPropertyToKg(backend, propertyId);
  await syncAmenitiesToKg(backend, propertyId);
  await syncPoliciesToKg(backend, propertyId);
  const guests = await prisma.guest.findMany({ where: { propertyId }, select: { id: true } });
  for (const g of guests) await syncGuestToKg(backend, g.id);
  const reservations = await prisma.reservation.findMany({
    where: { propertyId },
    select: { id: true },
  });
  for (const r of reservations) await syncReservationToKg(backend, r.id);
}
