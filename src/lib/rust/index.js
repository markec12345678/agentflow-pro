/**
 * Rust Pricing Engine - TypeScript Wrapper
 * Calls Rust binary for high-performance pricing calculations
 */

import { spawn } from 'child_process';
import { logger } from '@/infrastructure/observability/logger';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to Rust binary
const RUST_BINARY_PATH = join(__dirname, '..', '..', '..', 'rust', 'pricing-engine', 'target', 'release', 'pricing-engine.exe');

export interface PricingOptions {
  competitorAvg?: number;
  seasonRates?: {
    high?: Array<{ from: string; to: string; rate: number }>;
    mid?: Array<{ from: string; to: string; rate: number }>;
    low?: Array<{ from: string; to: string; rate: number }>;
  };
}

export interface PricingResult {
  baseTotal: number;
  adjustments: Array<{
    rule: string;
    amount: number;
    percent?: number;
  }>;
  finalPrice: number;
  nights: number;
}

/**
 * Calculate price using Rust engine
 * Falls back to TypeScript if Rust fails
 */
export async function calculatePrice(
  baseRate: number,
  checkIn: string,
  checkOut: string,
  options?: PricingOptions
): Promise<PricingResult> {
  try {
    return await callRustEngine(baseRate, checkIn, checkOut, options);
  } catch (error) {
    logger.warn('Rust pricing failed, falling back to TypeScript:', error);
    return calculatePriceTS(baseRate, checkIn, checkOut, options);
  }
}

/**
 * Call Rust binary via stdin/stdout
 */
function callRustEngine(
  baseRate: number,
  checkIn: string,
  checkOut: string,
  options?: PricingOptions
): Promise<PricingResult> {
  return new Promise((resolve, reject) => {
    const input = JSON.stringify({
      base_rate: baseRate,
      check_in: checkIn,
      check_out: checkOut,
      options: options || null
    });

    const rust = spawn(RUST_BINARY_PATH);
    let output = '';
    let errorOutput = '';

    rust.stdout.on('data', (data) => {
      output += data.toString();
    });

    rust.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    rust.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output) as PricingResult;
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Rust output: ${e}`));
        }
      } else {
        reject(new Error(`Rust process exited with code ${code}: ${errorOutput}`));
      }
    });

    rust.on('error', (err) => {
      reject(err);
    });

    rust.stdin.write(input);
    rust.stdin.end();
  });
}

/**
 * TypeScript fallback implementation
 */
function calculatePriceTS(
  baseRate: number,
  checkIn: string,
  checkOut: string,
  options?: PricingOptions
): PricingResult {
  // Simple TS implementation (same logic as Rust)
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  let finalPrice = baseRate * nights;
  const adjustments = [];

  // Length of stay discount
  if (nights >= 7) {
    const discount = finalPrice * 0.25;
    finalPrice -= discount;
    adjustments.push({ rule: 'length_of_stay', amount: -discount, percent: 25 });
  } else if (nights >= 5) {
    const discount = finalPrice * 0.20;
    finalPrice -= discount;
    adjustments.push({ rule: 'length_of_stay', amount: -discount, percent: 20 });
  } else if (nights >= 3) {
    const discount = finalPrice * 0.15;
    finalPrice -= discount;
    adjustments.push({ rule: 'length_of_stay', amount: -discount, percent: 15 });
  }

  return {
    baseTotal: baseRate * nights,
    adjustments,
    finalPrice,
    nights
  };
}
