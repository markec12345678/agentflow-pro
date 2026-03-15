/**
 * Use Case Factory
 *
 * Centralizirano mesto za kreiranje use case-ov z dependency injection.
 * API routes naj bodo čim bolj tanki - samo HTTP handling in avtentikacija.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ReservationRepositoryImpl } from "@/infrastructure/database/repositories/reservation-repository";
import { GuestRepositoryImpl } from "@/infrastructure/database/repositories/guest-repository";
import { PropertyRepositoryImpl } from "@/infrastructure/database/repositories/property-repository";
import { RoomRepositoryImpl } from "@/infrastructure/database/repositories/room-repository";
import { BlockRepositoryImpl } from "@/infrastructure/database/repositories/block-repository";
import { AvailabilityRepositoryImpl } from "@/infrastructure/database/repositories/availability-repository";
import { AlertRuleRepositoryImpl } from "@/infrastructure/database/repositories/alert-rule-repository";
import { CalendarRepositoryImpl } from "@/infrastructure/database/repositories/calendar-repository";
import { InvoiceRepositoryImpl } from "@/infrastructure/database/repositories/invoice-repository";
import { SeasonalRateRepositoryImpl } from "@/infrastructure/database/repositories/seasonal-rate-repository";
import { OccupancyRepositoryImpl } from "@/infrastructure/database/repositories/occupancy-repository";
import { RevenueRepositoryImpl } from "@/infrastructure/database/repositories/revenue-repository";
import { BookingRepositoryImpl } from "@/infrastructure/database/repositories/booking-repository";
import { CompetitorRepositoryImpl } from "@/infrastructure/database/repositories/competitor-repository";

// Use Cases
import { CreateReservationOrBlock } from "@/core/use-cases/create-reservation-or-block";
import { UpdateReservation } from "@/core/use-cases/update-reservation";
import { CancelReservationOrBlock } from "@/core/use-cases/cancel-reservation-or-block";
import { CreateReservation } from "@/core/use-cases/create-reservation";
import { CheckAvailability } from "@/core/use-cases/check-availability";
import { AllocateRoom } from "@/core/use-cases/allocate-room";
import { BlockDates } from "@/core/use-cases/block-dates";
import { AlertRuleManagement } from "@/core/use-cases/alert-rule-management";
import { GetCalendar } from "@/core/use-cases/get-calendar";
import { GetGuests } from "@/core/use-cases/get-guests";
import { InvoiceManagement } from "@/core/use-cases/invoice-management";
import { CalculateDynamicPrice } from "@/core/use-cases/calculate-dynamic-price";
import { UploadGuestDocument } from "@/core/use-cases/upload-guest-document";
import { GenerateDashboardData } from "@/core/use-cases/generate-dashboard-data";

// ============================================================================
// Factory
// ============================================================================

export class UseCaseFactory {
  private static reservationRepo = new ReservationRepositoryImpl(prisma);
  private static guestRepo = new GuestRepositoryImpl(prisma);
  private static propertyRepo = new PropertyRepositoryImpl(prisma);
  private static roomRepo = new RoomRepositoryImpl(prisma);
  private static blockRepo = new BlockRepositoryImpl(prisma);
  private static availabilityRepo = new AvailabilityRepositoryImpl(prisma);
  private static alertRuleRepo = new AlertRuleRepositoryImpl(prisma);
  private static calendarRepo = new CalendarRepositoryImpl(prisma);
  private static invoiceRepo = new InvoiceRepositoryImpl(prisma);
  private static seasonalRateRepo = new SeasonalRateRepositoryImpl(prisma);
  private static occupancyRepo = new OccupancyRepositoryImpl(prisma);
  private static revenueRepo = new RevenueRepositoryImpl(prisma);
  private static bookingRepo = new BookingRepositoryImpl(prisma);
  private static competitorRepo = new CompetitorRepositoryImpl(prisma);
  private static notificationRepo = {
    create: async (data: any) => {
      await prisma.notification.create({ data });
    },
  };
  private static billingRepo = {
    findById: async (id: string) => {
      return await prisma.billing.findUnique({ where: { id } });
    },
  };
  private static documentRepo = {
    save: async (doc: any) => {
      await prisma.guestDocument.create({ data: doc });
    },
    findById: async (id: string) => {
      return await prisma.guestDocument.findUnique({ where: { id } });
    },
  };
  private static fileStorage = {
    save: async (file: File, filename: string, propertyId: string) => {
      // Simple in-memory storage for now - TODO: Implement S3/blob storage
      return `/uploads/${propertyId}/${filename}`;
    },
    delete: async (filePath: string) => {
      // TODO: Implement actual file deletion
    },
    get: async (filePath: string) => {
      // TODO: Implement actual file retrieval
      return Buffer.from("");
    },
  };
  private static channelRepo = {
    findById: async (id: string) => {
      return await prisma.channelConnection.findUnique({ where: { id } });
    },
    findByProperty: async (propertyId: string) => {
      return await prisma.channelConnection.findMany({ where: { propertyId } });
    },
    save: async (channel: any) => {
      await prisma.channelConnection.upsert({
        where: { id: channel.id },
        update: channel,
        create: channel,
      });
    },
  };

  /**
   * CreateReservationOrBlock Use Case
   */
  static createReservationOrBlock(): CreateReservationOrBlock {
    return new CreateReservationOrBlock(
      this.reservationRepo,
      this.guestRepo,
      this.propertyRepo,
      this.notificationRepo,
    );
  }

  /**
   * UpdateReservation Use Case
   */
  static updateReservation(): UpdateReservation {
    return new UpdateReservation(this.reservationRepo, this.propertyRepo);
  }

  /**
   * CancelReservationOrBlock Use Case
   */
  static cancelReservationOrBlock(): CancelReservationOrBlock {
    return new CancelReservationOrBlock(
      this.reservationRepo,
      {
        findById: async (id: string) => {
          return await prisma.blockedDate.findUnique({
            where: { id },
            select: { id: true, propertyId: true, roomId: true },
          });
        },
        delete: async (id: string) => {
          await prisma.blockedDate.delete({ where: { id } });
        },
      },
      this.propertyRepo,
    );
  }

  /**
   * CreateReservation Use Case (for /api/tourism/reservations)
   */
  static createReservation(): CreateReservation {
    return new CreateReservation(
      this.propertyRepo,
      this.guestRepo,
      this.reservationRepo,
    );
  }

  /**
   * CheckAvailability Use Case (for /api/availability)
   */
  static checkAvailability(): CheckAvailability {
    return new CheckAvailability(
      this.roomRepo,
      this.reservationRepo,
      this.blockRepo,
    );
  }

  /**
   * AllocateRoom Use Case (for /api/availability/allocate)
   */
  static allocateRoom(): AllocateRoom {
    return new AllocateRoom(
      this.roomRepo,
      this.reservationRepo,
      this.availabilityRepo,
    );
  }

  /**
   * BlockDates Use Case (for /api/availability/calendar)
   */
  static blockDates(): BlockDates {
    return new BlockDates(this.blockRepo);
  }

  /**
   * AlertRuleManagement Use Case (for /api/alerts/rules)
   */
  static alertRules(): AlertRuleManagement {
    return new AlertRuleManagement(this.alertRuleRepo);
  }

  /**
   * GetCalendar Use Case (for /api/tourism/calendar)
   */
  static getCalendar(): GetCalendar {
    return new GetCalendar(this.calendarRepo, this.propertyRepo);
  }

  /**
   * GetGuests Use Case (for /api/tourism/guests)
   */
  static getGuests(): GetGuests {
    return new GetGuests(this.guestRepo, this.propertyRepo);
  }

  /**
   * InvoiceManagement Use Case (for /api/invoices)
   */
  static invoices(): InvoiceManagement {
    return new InvoiceManagement(
      this.invoiceRepo,
      this.reservationRepo,
      this.billingRepo,
    );
  }

  /**
   * CalculateDynamicPrice Use Case (for /api/pricing/dynamic)
   */
  static calculateDynamicPrice(): CalculateDynamicPrice {
    return new CalculateDynamicPrice(
      this.seasonalRateRepo,
      this.competitorRepo,
      this.occupancyRepo,
    );
  }

  /**
   * UploadGuestDocument Use Case (for /api/guest/upload-id)
   */
  static uploadGuestDocument(): UploadGuestDocument {
    return new UploadGuestDocument(
      this.documentRepo as any,
      this.reservationRepo,
      this.fileStorage as any,
    );
  }

  /**
   * GenerateDashboardData Use Case (for /api/analytics/dashboard)
   */
  static generateDashboardData(): GenerateDashboardData {
    return new GenerateDashboardData(
      this.occupancyRepo,
      this.revenueRepo,
      this.bookingRepo,
      {
        findByProperty: async (propertyId: string) => {
          return await prisma.housekeepingTask.findMany({
            where: { propertyId },
          });
        },
      } as any,
    );
  }
}
