/**
 * AgentFlow Pro - Rust Pricing Engine Wrapper
 *
 * High-performance pricing calculations using Rust NAPI bindings.
 * Provides 10-100x performance improvement over pure TypeScript.
 *
 * @module pricing-engine-rust
 */

import {
  calculatePrice as napiCalculatePrice,
  calculatePriceBatch as napiCalculatePriceBatch,
  type PricingOptions as NapiPricingOptions,
  type PricingResult as NapiPricingResult,
  type BatchPricingInput as NapiBatchPricingInput,
} from '../../../rust/pricing-engine/index.js';

// ============================================================================
// Type Definitions (TypeScript-friendly wrappers)
// ============================================================================

export interface SeasonRange {
  from: string;
  to: string;
  rate: number;
}

export interface SeasonRates {
  high?: SeasonRange[] | null;
  mid?: SeasonRange[] | null;
  low?: SeasonRange[] | null;
}

export interface PricingOptions {
  competitor_avg?: number | null;
  season_rates?: SeasonRates | null;
}

export interface Adjustment {
  rule: string;
  amount: number;
  percent?: number | null;
}

export interface PriceBreakdown {
  rate_per_night: number;
  subtotal: number;
  total_discounts: number;
  total_premiums: number;
}

export interface PricingResult {
  base_total: number;
  adjustments: Adjustment[];
  final_price: number;
  nights: number;
  breakdown?: PriceBreakdown | null;
}

export interface BatchPricingRequest {
  id: string;
  base_rate: number;
  check_in: string;
  check_out: string;
  options?: PricingOptions | null;
}

export interface BatchPricingResponse {
  id: string;
  result: PricingResult;
}

// ============================================================================
// NAPI Module Detection
// ============================================================================

let napiModuleLoaded: boolean | null = null;

/**
 * Check if NAPI module is available
 */
function isNapiAvailable(): boolean {
  if (napiModuleLoaded !== null) {
    return napiModuleLoaded;
  }

  try {
    // Try to access the NAPI function
    if (typeof napiCalculatePrice === 'function') {
      napiModuleLoaded = true;
      logger.info('[RustPricingEngine] NAPI module loaded successfully');
      return true;
    }
  } catch (error) {
    logger.warn(
      '[RustPricingEngine] NAPI module not available:',
      error instanceof Error ? error.message : error
    );
  }

  napiModuleLoaded = false;
  return false;
}

// ============================================================================
// Pricing Engine Class
// ============================================================================

export class RustPricingEngine {
  private napiAvailable: boolean;

  constructor() {
    this.napiAvailable = isNapiAvailable();
  }

  /**
   * Calculate price for a single booking
   */
  calculatePrice(
    baseRate: number,
    checkIn: string,
    checkOut: string,
    options?: PricingOptions | null
  ): PricingResult {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    const napiOptions: NapiPricingOptions | undefined | null = options
      ? {
          competitorAvg: options.competitor_avg ?? undefined,
          seasonRates: options.season_rates
            ? {
                high: options.season_rates.high ?? undefined,
                mid: options.season_rates.mid ?? undefined,
                low: options.season_rates.low ?? undefined,
              }
            : undefined,
        }
      : null;

    return napiCalculatePrice(baseRate, checkIn, checkOut, napiOptions);
  }

  /**
   * Calculate prices for multiple bookings in batch
   */
  calculatePriceBatch(
    requests: BatchPricingRequest[]
  ): BatchPricingResponse[] {
    if (!this.napiAvailable) {
      throw new Error('Rust NAPI module not available');
    }

    const input: NapiBatchPricingInput = {
      requests: requests.map((r) => {
        const req: any = {
          id: r.id,
          baseRate: r.base_rate,
          checkIn: r.check_in,
          checkOut: r.check_out,
        };
        // Only add options if it exists (NAPI doesn't handle null well)
        if (r.options) {
          req.options = {
            competitorAvg: r.options.competitor_avg ?? undefined,
            seasonRates: r.options.season_rates
              ? {
                  high: r.options.season_rates.high ?? undefined,
                  mid: r.options.season_rates.mid ?? undefined,
                  low: r.options.season_rates.low ?? undefined,
                }
              : undefined,
          };
        }
        return req;
      }),
    };

    return napiCalculatePriceBatch(input);
  }

  /**
   * Check if Rust NAPI module is available
   */
  isAvailable(): boolean {
    return this.napiAvailable;
  }
}

// ============================================================================
// Convenience Functions (backward compatible API)
// ============================================================================

const engine = new RustPricingEngine();

export interface CalculatePriceResult {
  baseTotal: number;
  adjustments: { rule: string; amount: number; percent?: number }[];
  finalPrice: number;
  nights: number;
}

export interface CalculatePriceOptions {
  competitorAvg?: number;
  seasonRates?: SeasonRates | null;
}

/**
 * Calculate price with backward-compatible TypeScript API
 */
export function calculatePrice(
  baseRatePerNight: number,
  checkIn: Date | string,
  checkOut: Date | string,
  options?: CalculatePriceOptions
): CalculatePriceResult {
  const checkInStr =
    typeof checkIn === 'string' ? checkIn : checkIn.toISOString().split('T')[0];
  const checkOutStr =
    typeof checkOut === 'string' ? checkOut : checkOut.toISOString().split('T')[0];

  const rustResult = engine.calculatePrice(
    baseRatePerNight,
    checkInStr,
    checkOutStr,
    options
      ? {
          competitor_avg: options.competitorAvg ?? null,
          season_rates: options.seasonRates ?? null,
        }
      : null
  );

  // Convert Rust result to TypeScript API format
  return {
    baseTotal: rustResult.base_total,
    adjustments: rustResult.adjustments.map((a) => ({
      rule: a.rule,
      amount: a.amount,
      percent: a.percent ?? undefined,
    })),
    finalPrice: rustResult.final_price,
    nights: rustResult.nights,
  };
}

export default engine;
