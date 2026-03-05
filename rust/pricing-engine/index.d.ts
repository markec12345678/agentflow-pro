// STUB: TypeScript definitions for Rust pricing engine
// These are stub types to satisfy TypeScript compiler
// On Vercel, the TypeScript implementation is used instead

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
  final_price: number;
}

export interface PricingResult {
  final_price: number;
  breakdown?: PriceBreakdown;
  adjustments?: Adjustment[];
}

export interface BatchPricingRequest {
  id: string;
  baseRate: number;
  checkIn: string;
  checkOut: string;
  options?: PricingOptions;
}

export interface BatchPricingResponse {
  id: string;
  result: PricingResult;
}

export interface BatchPricingInput {
  requests: BatchPricingRequest[];
}

// Stub functions - will throw error if called
export function calculatePrice(
  baseRate: number,
  checkIn: string,
  checkOut: string,
  options?: PricingOptions
): PricingResult;

export function calculatePriceBatch(
  input: BatchPricingInput
): BatchPricingResponse[];
