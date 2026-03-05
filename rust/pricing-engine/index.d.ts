// STUB: TypeScript definitions for Rust pricing engine
// These are stub types to satisfy TypeScript compiler

export interface PricingOptions {
  competitor_avg?: number | null;
  season_rates?: any | null;
}

export interface PricingResult {
  final_price: number;
  breakdown?: any;
}

export interface BatchPricingInput {
  requests: Array<{
    id: string;
    baseRate: number;
    checkIn: string;
    checkOut: string;
  }>;
}

export function calculatePrice(
  baseRate: number,
  checkIn: string,
  checkOut: string,
  options?: PricingOptions
): PricingResult;

export function calculatePriceBatch(
  input: BatchPricingInput
): PricingResult[];
