/**
 * Core Ports - Repository Interfaces
 * 
 * Ti interface-i definirajo pogodbe za dostop do podatkov.
 * Implementacije so v infrastructure/database/repositories/
 */

import { Property } from '@/core/domain/tourism/entities/property'
import { Reservation } from '@/core/domain/tourism/entities/reservation'
import { Guest } from '@/core/domain/guest/entities/guest'

// ============================================================================
// Tourism Repositories
// ============================================================================

export interface PropertyFilters {
  status?: 'active' | 'inactive' | 'archived'
  minRooms?: number
  location?: string
  amenities?: string[]
}

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>
  findAll(filters?: PropertyFilters): Promise<Property[]>
  save(property: Property): Promise<void>
  delete(id: string): Promise<void>
  findAvailable(checkIn: Date, checkOut: Date, guests: number): Promise<Property[]>
}

// ============================================================================

export interface ReservationFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  propertyId?: string
  guestId?: string
  dateRange?: { start: Date; end: Date }
}

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>
  findByGuest(guestId: string): Promise<Reservation[]>
  findByProperty(propertyId: string): Promise<Reservation[]>
  save(reservation: Reservation): Promise<void>
  delete(id: string): Promise<void>
  find(filters?: ReservationFilters): Promise<Reservation[]>
}

// ============================================================================
// Guest Repository
// ============================================================================

export interface GuestFilters {
  email?: string
  phone?: string
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface GuestRepository {
  findById(id: string): Promise<Guest | null>
  findByEmail(email: string): Promise<Guest | null>
  save(guest: Guest): Promise<void>
  delete(id: string): Promise<void>
  find(filters?: GuestFilters): Promise<Guest[]>
  findWithLoyaltyPoints(minPoints: number): Promise<Guest[]>
}

// ============================================================================
// Unit of Work (Transaction Support)
// ============================================================================

export interface UnitOfWork {
  startTransaction(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
  dispose(): void
}

export interface RepositoryFactory {
  createPropertyRepository(): PropertyRepository
  createReservationRepository(): ReservationRepository
  createGuestRepository(): GuestRepository
  createUnitOfWork(): UnitOfWork
}
