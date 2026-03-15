/**
 * AgentFlow Pro - Pricing Engine Wrapper
 *
 * Unified pricing API with automatic Rust/TypeScript fallback.
 * Uses Rust NAPI bindings when available (10-100x faster),
 * gracefully falls back to TypeScript implementation.
 *
 * @module pricing-engine-wrapper
 */

import {
  calculatePrice as tsCalculatePrice,
  type CalculatePriceResult,
  type CalculatePriceOptions,
  type SeasonRatesJson,
} from "./pricing-engine";
import {
  RustPricingEngine,
  type SeasonRates as RustSeasonRates,
  type PricingOptions as RustPricingOptions,
} from "./pricing-engine-rust";

// ============================================================================
// Singleton Rust Engine
// ============================================================================

let rustEngine: RustPricingEngine | null = null;
let rustAvailable: boolean | null = null;

/**
 * Get or initialize Rust pricing engine
 * @returns Rust engine instance or null if not available
 */
function getRustEngine(): RustPricingEngine | null {
  // Fast path: already determined unavailable
  if (rustAvailable === false) {
    return null;
  }

  // Initialize engine on first call
  if (!rustEngine) {
    try {
      rustEngine = new RustPricingEngine();
      rustAvailable = rustEngine.isAvailable();

      if (rustAvailable) {
        logger.info("[PricingEngine] Rust engine initialized successfully");
      } else {
        logger.warn(
          "[PricingEngine] Rust binary not found, will use TypeScript fallback"
        );
      }
    } catch (error) {
      logger.warn(
        "[PricingEngine] Rust engine initialization failed:",
        error instanceof Error ? error.message : error
      );
      rustAvailable = false;
      rustEngine = null;
    }
  }

  return rustAvailable ? rustEngine : null;
}

// ============================================================================
// Type Conversions
// ============================================================================

/**
 * Convert TypeScript SeasonRates to Rust format
 */
function toRustSeasonRates(
  seasonRates: SeasonRatesJson | null | undefined
): RustSeasonRates | null {
  if (!seasonRates) return null;

  return {
    high: seasonRates.high ?? null,
    mid: seasonRates.mid ?? null,
    low: seasonRates.low ?? null,
  };
}

/**
 * Convert Rust PricingOptions to TypeScript format
 */
function toRustPricingOptions(
  options?: CalculatePriceOptions
): RustPricingOptions | null {
  if (!options) return null;

  return {
    competitor_avg: options.competitorAvg ?? null,
    season_rates: toRustSeasonRates(options.seasonRates),
  };
}

/**
 * Convert Rust result to TypeScript API format
 */
function fromRustResult(
  rustResult: {
    base_total: number;
    adjustments: Array<{
      rule: string;
      amount: number;
      percent?: number | null;
    }>;
    final_price: number;
    nights: number;
  },
  _meta?: { engine: string }
): CalculatePriceResult {
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

// ============================================================================
// Unified Pricing API
// ============================================================================

/**
 * Calculate price with automatic Rust/TypeScript fallback
 *
 * @param baseRatePerNight - Base price per night
 * @param checkIn - Check-in date (Date or ISO string)
 * @param checkOut - Check-out date (Date or ISO string)
 * @param options - Optional pricing options (competitor avg, season rates)
 * @returns Calculated price with adjustments
 *
 * @example
 * ```typescript
 * const result = await calculatePrice(100, '2026-03-15', '2026-03-20', {
 *   seasonRates: property.seasonRates
 * });
 * logger.info(result.finalPrice); // 450
 * logger.info(result.adjustments); // [{ rule: 'length_of_stay', amount: -50, percent: 15 }]
 * ```
 */
export async function calculatePrice(
  baseRatePerNight: number,
  checkIn: Date | string,
  checkOut: Date | string,
  options?: CalculatePriceOptions
): Promise<CalculatePriceResult> {
  const engine = getRustEngine();

  // Try Rust engine first (NAPI is synchronous)
  if (engine) {
    try {
      const checkInStr =
        typeof checkIn === "string" ? checkIn : checkIn.toISOString().split("T")[0];
      const checkOutStr =
        typeof checkOut === "string" ? checkOut : checkOut.toISOString().split("T")[0];

      const rustResult = engine.calculatePrice(
        baseRatePerNight,
        checkInStr,
        checkOutStr,
        toRustPricingOptions(options)
      );

      return fromRustResult(rustResult, { engine: "rust" });
    } catch (error) {
      logger.warn(
        "[PricingEngine] Rust calculation failed, falling back to TypeScript:",
        error instanceof Error ? error.message : error
      );
      // Fall through to TypeScript fallback
    }
  }

  // TypeScript fallback
  const checkInDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const checkOutDate =
    typeof checkOut === "string" ? new Date(checkOut) : checkOut;

  // Validate dates
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new Error("Invalid checkIn or checkOut date");
  }

  return tsCalculatePrice(baseRatePerNight, checkInDate, checkOutDate, options);
}

// ============================================================================
// Batch Processing API
// ============================================================================

export interface BatchPricingRequest {
  id: string;
  baseRate: number;
  checkIn: Date | string;
  checkOut: Date | string;
  options?: CalculatePriceOptions;
}

export interface BatchPricingResponse {
  id: string;
  result: CalculatePriceResult;
  engine: "rust" | "typescript";
  error?: string;
}

/**
 * Calculate prices for multiple bookings in batch
 *
 * @param requests - Array of pricing requests
 * @returns Array of results with engine metadata
 *
 * @example
 * ```typescript
 * const results = await calculatePriceBatch([
 *   { id: '1', baseRate: 100, checkIn: '2026-03-15', checkOut: '2026-03-20' },
 *   { id: '2', baseRate: 150, checkIn: '2026-04-01', checkOut: '2026-04-05' },
 * ]);
 * ```
 */
export async function calculatePriceBatch(
  requests: BatchPricingRequest[]
): Promise<BatchPricingResponse[]> {
  const engine = getRustEngine();

  // Rust batch processing (synchronous NAPI call)
  if (engine) {
    try {
      const batchRequests = requests.map((r) => ({
        id: r.id,
        base_rate: r.baseRate,
        check_in:
          typeof r.checkIn === "string" ? r.checkIn : r.checkIn.toISOString().split("T")[0],
        check_out:
          typeof r.checkOut === "string" ? r.checkOut : r.checkOut.toISOString().split("T")[0],
        options: toRustPricingOptions(r.options),
      }));

      const batchResults = engine.calculatePriceBatch(batchRequests);

      return batchResults.map((r) => ({
        id: r.id,
        result: fromRustResult(r.result),
        engine: "rust" as const,
      }));
    } catch (error) {
      logger.warn(
        "[PricingEngine] Rust batch calculation failed, falling back to TypeScript:",
        error instanceof Error ? error.message : error
      );
      // Fall through to TypeScript fallback
    }
  }

  // TypeScript fallback (sequential with Promise.all for parallelism)
  const results = await Promise.all(
    requests.map(async (r): Promise<BatchPricingResponse> => {
      try {
        const checkInDate =
          typeof r.checkIn === "string" ? new Date(r.checkIn) : r.checkIn;
        const checkOutDate =
          typeof r.checkOut === "string" ? new Date(r.checkOut) : r.checkOut;

        const result = tsCalculatePrice(
          r.baseRate,
          checkInDate,
          checkOutDate,
          r.options
        );

        return {
          id: r.id,
          result,
          engine: "typescript" as const,
        };
      } catch (error) {
        return {
          id: r.id,
          result: {
            baseTotal: 0,
            adjustments: [],
            finalPrice: 0,
            nights: 0,
          },
          engine: "typescript" as const,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return results;
}

// ============================================================================
// Engine Info & Health Check
// ============================================================================

export interface EngineInfo {
  engine: "rust" | "typescript";
  available: boolean;
  version?: string;
}

/**
 * Get current engine status
 * @returns Engine information for monitoring/debugging
 *
 * @example
 * ```typescript
 * const info = getEngineInfo();
 * logger.info(`Using ${info.engine} engine: ${info.available}`);
 * ```
 */
export function getEngineInfo(): EngineInfo {
  const engine = getRustEngine();
  return {
    engine: engine ? "rust" : "typescript",
    available: rustAvailable ?? false,
    version: engine ? "1.0.0" : undefined, // Could read from Cargo.toml
  };
}

/**
 * Check if Rust engine is available
 * @returns true if Rust binary/NAPI bindings are available
 */
export function isRustAvailable(): boolean {
  return getRustEngine() !== null;
}

/**
 * Force re-initialization of Rust engine
 * Useful for hot-reload scenarios or recovery from errors
 */
export function reinitializeRustEngine(): void {
  rustEngine = null;
  rustAvailable = null;
  getRustEngine(); // Re-initialize
}

// ============================================================================
// Exports (re-export TypeScript types for convenience)
// ============================================================================

export type { CalculatePriceResult, CalculatePriceOptions, SeasonRatesJson };
export { PRICING_STRATEGIES } from "./pricing-engine";
