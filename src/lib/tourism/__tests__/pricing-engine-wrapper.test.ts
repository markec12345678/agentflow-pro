/**
 * AgentFlow Pro - Pricing Engine Wrapper Tests
 * Tests for the Rust/TypeScript fallback pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePrice,
  calculatePriceBatch,
  getEngineInfo,
  isRustAvailable,
  reinitializeRustEngine,
} from '../pricing-engine-wrapper';

// Mock Rust engine
vi.mock('../pricing-engine-rust', () => {
  return {
    RustPricingEngine: class MockRustEngine {
      isAvailable() {
        return false; // Default to TypeScript fallback
      }
      async calculatePrice() {
        throw new Error('Rust not available');
      }
      async calculatePriceBatch() {
        throw new Error('Rust not available');
      }
    },
  };
});

describe('pricing-engine-wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reinitializeRustEngine();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('calculatePrice', () => {
    it('should use TypeScript fallback when Rust is not available', async () => {
      const result = await calculatePrice(100, new Date('2026-03-15'), new Date('2026-03-20'));

      expect(result).toBeDefined();
      expect(result.nights).toBe(5);
      expect(result.baseTotal).toBeGreaterThan(0);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(Array.isArray(result.adjustments)).toBe(true);
    });

    it('should accept string dates', async () => {
      const result = await calculatePrice(100, '2026-03-15', '2026-03-20');

      expect(result.nights).toBe(5);
      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should apply season rates when provided', async () => {
      const result = await calculatePrice(100, '2026-03-15', '2026-03-20', {
        seasonRates: {
          high: [
            {
              from: '2026-03-01',
              to: '2026-03-31',
              rate: 150,
            },
          ],
        },
      });

      expect(result.baseTotal).toBe(750); // 150 * 5 nights
    });

    it('should apply length_of_stay discount for 7+ nights', async () => {
      const result = await calculatePrice(100, '2026-03-15', '2026-03-22'); // 7 nights

      expect(result.nights).toBe(7);
      const hasLengthOfStayDiscount = result.adjustments.some(
        (a) => a.rule === 'length_of_stay' && a.amount < 0
      );
      expect(hasLengthOfStayDiscount).toBe(true);
    });

    it('should apply early_bird discount for bookings 60+ days in advance', async () => {
      const futureCheckIn = new Date();
      futureCheckIn.setDate(futureCheckIn.getDate() + 65);
      const checkOut = new Date(futureCheckIn);
      checkOut.setDate(checkOut.getDate() + 5);

      const result = await calculatePrice(100, futureCheckIn, checkOut);

      const hasEarlyBirdDiscount = result.adjustments.some(
        (a) => a.rule === 'early_bird' && a.amount < 0
      );
      expect(hasEarlyBirdDiscount).toBe(true);
    });

    it('should apply last_minute discount for bookings within 3 days', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date(tomorrow);
      checkOut.setDate(checkOut.getDate() + 3);

      const result = await calculatePrice(100, tomorrow, checkOut);

      const hasLastMinuteDiscount = result.adjustments.some(
        (a) => a.rule === 'last_minute' && a.amount < 0
      );
      expect(hasLastMinuteDiscount).toBe(true);
    });

    it('should apply weekend premium for Friday/Saturday nights', async () => {
      // March 15, 2026 is a Sunday, so March 20-21 includes Friday night
      const result = await calculatePrice(100, '2026-03-20', '2026-03-22');

      const hasWeekendPremium = result.adjustments.some(
        (a) => a.rule === 'weekend_premium' && a.amount > 0
      );
      expect(hasWeekendPremium).toBe(true);
    });

    it('should throw error for invalid dates', async () => {
      await expect(calculatePrice(100, 'invalid-date', '2026-03-20')).rejects.toThrow(
        'Invalid checkIn or checkOut date'
      );
    });

    it('should throw error when checkOut is before checkIn', async () => {
      await expect(
        calculatePrice(100, '2026-03-20', '2026-03-15')
      ).rejects.toThrow();
    });
  });

  describe('calculatePriceBatch', () => {
    it('should process multiple requests', async () => {
      const requests = [
        { id: '1', baseRate: 100, checkIn: '2026-03-15', checkOut: '2026-03-20' },
        { id: '2', baseRate: 150, checkIn: '2026-04-01', checkOut: '2026-04-05' },
      ];

      const results = await calculatePriceBatch(requests);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('2');
      expect(results.every((r) => r.result.finalPrice > 0)).toBe(true);
    });

    it('should include engine metadata', async () => {
      const requests = [
        { id: '1', baseRate: 100, checkIn: '2026-03-15', checkOut: '2026-03-20' },
      ];

      const results = await calculatePriceBatch(requests);

      expect(results[0].engine).toBe('typescript');
    });

    it('should handle errors gracefully', async () => {
      const requests = [
        { id: '1', baseRate: 100, checkIn: 'invalid', checkOut: '2026-03-20' },
      ];

      const results = await calculatePriceBatch(requests);

      expect(results[0].error).toBeDefined();
    });
  });

  describe('getEngineInfo', () => {
    it('should return engine status', () => {
      const info = getEngineInfo();

      expect(info).toHaveProperty('engine');
      expect(info).toHaveProperty('available');
      expect(['rust', 'typescript']).toContain(info.engine);
    });
  });

  describe('isRustAvailable', () => {
    it('should return boolean', () => {
      const available = isRustAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('reinitializeRustEngine', () => {
    it('should reset engine state', () => {
      reinitializeRustEngine();
      const info = getEngineInfo();
      expect(info).toBeDefined();
    });
  });
});
