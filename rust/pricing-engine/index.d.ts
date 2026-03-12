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
  competitorAvg?: number | null;
  seasonRates?: SeasonRates | null;
}

export interface Adjustment {
  rule: string;
  amount: number;
  percent?: number | null;
}

export interface PriceBreakdown {
  ratePerNight: number;
  subtotal: number;
  totalDiscounts: number;
  totalPremiums: number;
  finalPrice: number;
}

export interface PricingResult {
  baseTotal?: number;
  finalPrice: number;
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
