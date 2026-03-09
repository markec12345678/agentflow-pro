/**
 * AgentFlow Pro - Pricing Engine TypeScript Wrapper
 * 
 * High-level TypeScript API for the Rust-based pricing engine.
 * Provides type-safe access to pricing calculations with additional
 * validation and helper methods.
 */

import * as native from '../index.js';

// Re-export all native types
export type {
  Adjustment,
  BatchPricingInput,
  BatchPricingRequest,
  BatchPricingResponse,
  PriceBreakdown,
  PricingOptions,
  PricingResult,
  SeasonRange,
  SeasonRates,
} from '../index.js';

// Re-export native functions
export const { calculatePrice, calculatePriceBatch } = native;

/**
 * Pricing calculation result with additional metadata
 */
export interface PricingCalculationResult extends native.PricingResult {
  /** Timestamp when calculation was performed */
  calculatedAt: string;
  /** Version of pricing engine used */
  engineVersion: string;
}

/**
 * Configuration options for the PricingEngine
 */
export interface PricingEngineConfig {
  /** Default currency code (default: 'EUR') */
  currency?: string;
  /** Enable detailed breakdown (default: true) */
  includeBreakdown?: boolean;
  /** Rounding precision for final prices (default: 2) */
  roundingPrecision?: number;
  /** Cache results for identical requests (default: false) */
  enableCache?: boolean;
}

/**
 * High-level Pricing Engine class with additional utilities
 * 
 * @example
 * ```typescript
 * const engine = new PricingEngine({ currency: 'EUR' });
 * 
 * const result = await engine.calculate({
 *   baseRate: 100,
 *   checkIn: '2026-07-01',
 *   checkOut: '2026-07-08',
 *   options: {
 *     competitorAvg: 95,
 *     seasonRates: { ... }
 *   }
 * });
 * 
 * console.log(`Final price: ${result.finalPrice}€`);
 * ```
 */
export class PricingEngine {
  private config: Required<PricingEngineConfig>;
  private cache: Map<string, PricingCalculationResult>;

  constructor(config: PricingEngineConfig = {}) {
    this.config = {
      currency: config.currency ?? 'EUR',
      includeBreakdown: config.includeBreakdown ?? true,
      roundingPrecision: config.roundingPrecision ?? 2,
      enableCache: config.enableCache ?? false,
    };
    this.cache = new Map();
  }

  /**
   * Calculate price for a single booking
   * 
   * @param params - Pricing calculation parameters
   * @returns Detailed pricing result with adjustments
   */
  calculate(params: {
    baseRate: number;
    checkIn: string;
    checkOut: string;
    options?: native.PricingOptions;
  }): PricingCalculationResult {
    const cacheKey = this.config.enableCache
      ? this.getCacheKey(params)
      : null;

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached };
    }

    // Validate inputs
    this.validateInputs(params);

    // Call native Rust function
    const result = calculatePrice(
      params.baseRate,
      params.checkIn,
      params.checkOut,
      params.options
    );

    // Apply rounding
    const roundedResult = this.applyRounding(result);

    // Create enhanced result
    const enhancedResult: PricingCalculationResult = {
      ...roundedResult,
      calculatedAt: new Date().toISOString(),
      engineVersion: '0.1.0',
    };

    // Cache if enabled
    if (cacheKey && this.config.enableCache) {
      this.cache.set(cacheKey, enhancedResult);
    }

    return enhancedResult;
  }

  /**
   * Calculate prices for multiple bookings in batch
   * 
   * @param requests - Array of pricing requests with unique IDs
   * @returns Array of pricing results
   */
  calculateBatch(
    requests: Array<{
      id: string;
      baseRate: number;
      checkIn: string;
      checkOut: string;
      options?: native.PricingOptions;
    }>
  ): Array<PricingCalculationResult & { id: string }> {
    const batchInput: native.BatchPricingInput = {
      requests: requests.map((req) => ({
        id: req.id,
        baseRate: req.baseRate,
        checkIn: req.checkIn,
        checkOut: req.checkOut,
        options: req.options ?? null,
      })),
    };

    const batchResults = calculatePriceBatch(batchInput);

    return batchResults.map((result) => ({
      id: result.id,
      ...result.result,
      calculatedAt: new Date().toISOString(),
      engineVersion: '0.1.0',
    }));
  }

  /**
   * Get recommended price based on base rate and market conditions
   * 
   * @param baseRate - Base nightly rate
   * @param competitorAvg - Average competitor price (optional)
   * @param demandFactor - Demand multiplier (0.5-2.0, optional)
   * @returns Recommended price per night
   */
  getRecommendedPrice(
    baseRate: number,
    competitorAvg?: number,
    demandFactor?: number
  ): number {
    let recommendedPrice = baseRate;

    // Adjust based on competitor pricing
    if (competitorAvg !== undefined && competitorAvg > 0) {
      const maxDeviation = 0.15; // Max 15% deviation from competitor
      const targetPrice = competitorAvg * 0.95; // Slightly undercut

      if (Math.abs(targetPrice - baseRate) / baseRate > maxDeviation) {
        recommendedPrice = baseRate * (1 + maxDeviation * Math.sign(targetPrice - baseRate));
      } else {
        recommendedPrice = targetPrice;
      }
    }

    // Adjust based on demand
    if (demandFactor !== undefined && demandFactor > 0) {
      const normalizedFactor = Math.max(0.5, Math.min(2.0, demandFactor));
      recommendedPrice *= normalizedFactor;
    }

    return this.roundPrice(recommendedPrice);
  }

  /**
   * Compare two pricing scenarios
   * 
   * @param scenario1 - First pricing scenario
   * @param scenario2 - Second pricing scenario
   * @returns Comparison result with differences
   */
  compare(
    scenario1: {
      baseRate: number;
      checkIn: string;
      checkOut: string;
      options?: native.PricingOptions;
    },
    scenario2: {
      baseRate: number;
      checkIn: string;
      checkOut: string;
      options?: native.PricingOptions;
    }
  ): {
    scenario1: PricingCalculationResult;
    scenario2: PricingCalculationResult;
    priceDifference: number;
    percentDifference: number;
    cheaperScenario: 'scenario1' | 'scenario2';
  } {
    const result1 = this.calculate(scenario1);
    const result2 = this.calculate(scenario2);

    const priceDifference = result2.finalPrice - result1.finalPrice;
    const percentDifference =
      result1.finalPrice !== 0
        ? (priceDifference / result1.finalPrice) * 100
        : 0;

    return {
      scenario1: result1,
      scenario2: result2,
      priceDifference: Math.abs(priceDifference),
      percentDifference: Math.abs(percentDifference),
      cheaperScenario: priceDifference > 0 ? 'scenario1' : 'scenario2',
    };
  }

  /**
   * Clear the calculation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.cache.size,
      enabled: this.config.enableCache,
    };
  }

  /**
   * Validate input parameters
   */
  private validateInputs(params: {
    baseRate: number;
    checkIn: string;
    checkOut: string;
    options?: native.PricingOptions;
  }): void {
    if (params.baseRate < 0) {
      throw new Error('Base rate must be non-negative');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.checkIn)) {
      throw new Error('Check-in date must be in YYYY-MM-DD format');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.checkOut)) {
      throw new Error('Check-out date must be in YYYY-MM-DD format');
    }

    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    if (checkInDate >= checkOutDate) {
      throw new Error('Check-out date must be after check-in date');
    }
  }

  /**
   * Apply rounding to price result
   */
  private applyRounding(
    result: native.PricingResult
  ): native.PricingResult {
    const precision = this.config.roundingPrecision;
    const multiplier = Math.pow(10, precision);

    return {
      ...result,
      baseTotal: Math.round(result.baseTotal * multiplier) / multiplier,
      finalPrice: Math.round(result.finalPrice * multiplier) / multiplier,
      breakdown: result.breakdown
        ? {
            ...result.breakdown,
            ratePerNight:
              Math.round(result.breakdown.ratePerNight * multiplier) /
              multiplier,
            subtotal:
              Math.round(result.breakdown.subtotal * multiplier) / multiplier,
            totalDiscounts:
              Math.round(result.breakdown.totalDiscounts * multiplier) /
              multiplier,
            totalPremiums:
              Math.round(result.breakdown.totalPremiums * multiplier) /
              multiplier,
          }
        : result.breakdown,
      adjustments: result.adjustments.map((adj) => ({
        ...adj,
        amount: Math.round(adj.amount * multiplier) / multiplier,
      })),
    };
  }

  /**
   * Round price to standard precision
   */
  private roundPrice(price: number): number {
    const multiplier = Math.pow(10, this.config.roundingPrecision);
    return Math.round(price * multiplier) / multiplier;
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(params: {
    baseRate: number;
    checkIn: string;
    checkOut: string;
    options?: native.PricingOptions;
  }): string {
    return JSON.stringify({
      baseRate: params.baseRate,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      options: params.options,
    });
  }
}

/**
 * Default pricing engine instance
 */
export const defaultPricingEngine = new PricingEngine();

export default PricingEngine;
