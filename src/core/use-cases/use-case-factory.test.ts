/**
 * UseCaseFactory Unit Tests
 *
 * Tests for dependency injection factory
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { UseCaseFactory } from "../use-case-factory";

describe("UseCaseFactory", () => {
  describe("Factory Methods", () => {
    it("should create CheckAvailability use case", () => {
      const useCase = UseCaseFactory.checkAvailability();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create AllocateRoom use case", () => {
      const useCase = UseCaseFactory.allocateRoom();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create BlockDates use case", () => {
      const useCase = UseCaseFactory.blockDates();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
      expect(useCase.unblock).toBeDefined();
    });

    it("should create AlertRuleManagement use case", () => {
      const useCase = UseCaseFactory.alertRules();
      expect(useCase).toBeDefined();
      expect(useCase.create).toBeDefined();
      expect(useCase.getRules).toBeDefined();
    });

    it("should create GetCalendar use case", () => {
      const useCase = UseCaseFactory.getCalendar();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create GetGuests use case", () => {
      const useCase = UseCaseFactory.getGuests();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create InvoiceManagement use case", () => {
      const useCase = UseCaseFactory.invoices();
      expect(useCase).toBeDefined();
      expect(useCase.getInvoices).toBeDefined();
      expect(useCase.generateInvoice).toBeDefined();
    });

    it("should create CalculateDynamicPrice use case", () => {
      const useCase = UseCaseFactory.calculateDynamicPrice();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create UploadGuestDocument use case", () => {
      const useCase = UseCaseFactory.uploadGuestDocument();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create GenerateDashboardData use case", () => {
      const useCase = UseCaseFactory.generateDashboardData();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create CreateReservationOrBlock use case", () => {
      const useCase = UseCaseFactory.createReservationOrBlock();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create UpdateReservation use case", () => {
      const useCase = UseCaseFactory.updateReservation();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });

    it("should create CancelReservationOrBlock use case", () => {
      const useCase = UseCaseFactory.cancelReservationOrBlock();
      expect(useCase).toBeDefined();
      expect(useCase.execute).toBeDefined();
    });
  });

  describe("Repository Injection", () => {
    it("should inject repositories into CheckAvailability", () => {
      const useCase = UseCaseFactory.checkAvailability();
      // Verify repositories are injected (not null/undefined)
      expect((useCase as any).roomRepository).toBeDefined();
      expect((useCase as any).reservationRepository).toBeDefined();
      expect((useCase as any).blockRepository).toBeDefined();
    });

    it("should inject repositories into AllocateRoom", () => {
      const useCase = UseCaseFactory.allocateRoom();
      expect((useCase as any).roomRepository).toBeDefined();
      expect((useCase as any).reservationRepository).toBeDefined();
      expect((useCase as any).availabilityRepository).toBeDefined();
    });

    it("should inject repositories into BlockDates", () => {
      const useCase = UseCaseFactory.blockDates();
      expect((useCase as any).blockRepository).toBeDefined();
    });
  });

  describe("Singleton Pattern", () => {
    it("should reuse repository instances", () => {
      const useCase1 = UseCaseFactory.checkAvailability();
      const useCase2 = UseCaseFactory.checkAvailability();

      // Repositories should be the same instance
      expect((useCase1 as any).roomRepository).toBe(
        (useCase2 as any).roomRepository,
      );
    });
  });
});
