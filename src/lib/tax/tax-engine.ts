/**
 * Unified Tax Engine for AgentFlow Pro
 * 
 * Combines tourist tax and VAT calculations for complete tax handling
 * in Slovenian hospitality industry.
 */

import {
  calculateTouristTax,
  calculateTouristTaxWithRates,
  type ReservationInput,
  type TouristTaxResult,
} from './tourist-tax-calculator';

import {
  calculateVAT,
  calculateReservationVAT,
  type VATResult,
  type VATRate,
} from './vat-calculator';

export interface TaxCalculationInput {
  // Reservation details
  checkIn: Date;
  checkOut: Date;
  municipality: string;
  guests: Array<{ age: number }>;
  
  // Financial amounts (net, without tax)
  accommodationAmount: number;
  foodAmount?: number;
  servicesAmount?: number;
  otherAmount?: number;
  
  // Optional: custom tourist tax rates (overrides database)
  customTouristTaxRates?: {
    adults: number;
    children7_18: number;
    children0_7: number;
  };
}

export interface TaxCalculationResult {
  // Tourist tax
  touristTax: TouristTaxResult;
  
  // VAT
  vat: VATResult & {
    breakdown: {
      accommodation: { base: number; rate: number; amount: number };
      food: { base: number; rate: number; amount: number };
      services: { base: number; rate: number; amount: number };
      other: { base: number; rate: number; amount: number };
    };
  };
  
  // Totals
  totals: {
    subtotal: number;        // Before any tax
    touristTax: number;       // Tourist tax only
    vatBeforeTouristTax: number; // VAT on accommodation/food/services
    vatOnTouristTax: number;  // VAT on tourist tax (usually 0 in Slovenia)
    totalVAT: number;         // Total VAT
    totalTax: number;         // All taxes combined
    grandTotal: number;       // Final amount with all taxes
  };
  
  // Metadata
  calculatedAt: Date;
}

/**
 * Calculate all taxes for a reservation
 */
export async function calculateReservationTax(
  input: TaxCalculationInput
): Promise<TaxCalculationResult> {
  const {
    checkIn,
    checkOut,
    municipality,
    guests,
    accommodationAmount,
    foodAmount = 0,
    servicesAmount = 0,
    otherAmount = 0,
    customTouristTaxRates,
  } = input;
  
  // Calculate tourist tax
  let touristTaxResult: TouristTaxResult;
  
  if (customTouristTaxRates) {
    touristTaxResult = calculateTouristTaxWithRates(
      {
        checkIn,
        checkOut,
        municipality,
        guests,
      },
      customTouristTaxRates
    );
  } else {
    touristTaxResult = await calculateTouristTax({
      checkIn,
      checkOut,
      municipality,
      guests,
    });
  }
  
  // Calculate VAT
  const vatResult = calculateReservationVAT(
    accommodationAmount,
    {
      foodAmount,
      servicesAmount,
      otherAmount,
    }
  );
  
  // Calculate totals
  const subtotal = accommodationAmount + foodAmount + servicesAmount + otherAmount;
  const vatBeforeTouristTax = vatResult.totals.vat;
  
  // In Slovenia, tourist tax is NOT subject to VAT
  // (tourist tax is a pass-through tax collected for the municipality)
  const vatOnTouristTax = 0;
  const totalVAT = vatBeforeTouristTax + vatOnTouristTax;
  
  const totalTax = touristTaxResult.totalTax + totalVAT;
  const grandTotal = subtotal + totalTax;
  
  return {
    touristTax: touristTaxResult,
    vat: {
      ...vatResult,
      breakdown: {
        accommodation: vatResult.accommodation,
        food: vatResult.food,
        services: vatResult.services,
        other: vatResult.other,
      },
    },
    totals: {
      subtotal: Math.round(subtotal * 100) / 100,
      touristTax: touristTaxResult.totalTax,
      vatBeforeTouristTax,
      vatOnTouristTax,
      totalVAT,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    },
    calculatedAt: new Date(),
  };
}

/**
 * Format complete tax breakdown for display
 */
export function formatTaxBreakdown(result: TaxCalculationResult): string {
  const lines = [
    '═'.repeat(60),
    'TAX BREAKDOWN / PREGLED DAVKOV',
    '═'.repeat(60),
    '',
    `Calculated: ${result.calculatedAt.toLocaleString('sl-SI')}`,
    '',
    '─'.repeat(60),
    'TOURIST TAX / TURISTIČNA TAKSA',
    '─'.repeat(60),
    `Municipality: ${result.touristTax.municipality}`,
    `Nights: ${result.touristTax.nights}`,
    `Guests: ${result.touristTax.guests}`,
    '',
  ];
  
  // Tourist tax breakdown
  for (const item of result.touristTax.breakdown) {
    lines.push(
      `  Age ${item.guestAge} (${item.category}): ${item.nights} × €${item.ratePerNight.toFixed(2)} = €${item.amount.toFixed(2)}`
    );
  }
  
  lines.push('');
  lines.push(`Total Tourist Tax: €${result.touristTax.totalTax.toFixed(2)}`);
  lines.push('');
  
  // VAT breakdown
  lines.push('─'.repeat(60));
  lines.push('VAT / DDV');
  lines.push('─'.repeat(60));
  
  const vat = result.vat;
  
  if (vat.breakdown.accommodation.base > 0) {
    lines.push(
      `Accommodation (9.5%): €${vat.breakdown.accommodation.base.toFixed(2)} + €${vat.breakdown.accommodation.amount.toFixed(2)} VAT`
    );
  }
  
  if (vat.breakdown.food.base > 0) {
    lines.push(
      `Food (22%): €${vat.breakdown.food.base.toFixed(2)} + €${vat.breakdown.food.amount.toFixed(2)} VAT`
    );
  }
  
  if (vat.breakdown.services.base > 0) {
    lines.push(
      `Services (22%): €${vat.breakdown.services.base.toFixed(2)} + €${vat.breakdown.services.amount.toFixed(2)} VAT`
    );
  }
  
  if (vat.breakdown.other.base > 0) {
    lines.push(
      `Other (22%): €${vat.breakdown.other.base.toFixed(2)} + €${vat.breakdown.other.amount.toFixed(2)} VAT`
    );
  }
  
  lines.push('');
  lines.push(`Total VAT: €${result.totals.totalVAT.toFixed(2)}`);
  lines.push('');
  
  // Summary
  lines.push('─'.repeat(60));
  lines.push('SUMMARY / POVZETEK');
  lines.push('─'.repeat(60));
  lines.push(`Subtotal: €${result.totals.subtotal.toFixed(2)}`);
  lines.push(`Tourist Tax: €${result.totals.touristTax.toFixed(2)}`);
  lines.push(`VAT: €${result.totals.totalVAT.toFixed(2)}`);
  lines.push(`Total Tax: €${result.totals.totalTax.toFixed(2)}`);
  lines.push('─'.repeat(60));
  lines.push(`GRAND TOTAL: €${result.totals.grandTotal.toFixed(2)}`);
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
}

/**
 * Convert tax calculation result to database format
 */
export function taxResultToDatabase(
  result: TaxCalculationResult,
  propertyId: string,
  reservationId: string
): {
  touristTaxAmount: number;
  vat95Base: number;
  vat95Amount: number;
  vat22Base: number;
  vat22Amount: number;
  totalVATAmount: number;
  totalWithTax: number;
  taxBreakdown: any;
} {
  const vat = result.vat;
  
  // VAT 9.5% (accommodation only)
  const vat95Base = vat.breakdown.accommodation.base;
  const vat95Amount = vat.breakdown.accommodation.amount;
  
  // VAT 22% (food + services + other)
  const vat22Base =
    vat.breakdown.food.base +
    vat.breakdown.services.base +
    vat.breakdown.other.base;
  const vat22Amount =
    vat.breakdown.food.amount +
    vat.breakdown.services.amount +
    vat.breakdown.other.amount;
  
  const totalVATAmount = vat95Amount + vat22Amount;
  
  return {
    touristTaxAmount: result.touristTax.totalTax,
    vat95Base,
    vat95Amount,
    vat22Base,
    vat22Amount,
    totalVATAmount,
    totalWithTax: result.totals.grandTotal,
    taxBreakdown: {
      touristTax: {
        municipality: result.touristTax.municipality,
        total: result.touristTax.totalTax,
        breakdown: result.touristTax.breakdown,
      },
      vat: {
        accommodation: vat.breakdown.accommodation,
        food: vat.breakdown.food,
        services: vat.breakdown.services,
        other: vat.breakdown.other,
        total: result.totals.totalVAT,
      },
      totals: result.totals,
    },
  };
}

/**
 * Validate tax calculation
 */
export function validateTaxCalculation(result: TaxCalculationResult): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for negative amounts
  if (result.totals.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }
  
  if (result.totals.touristTax < 0) {
    errors.push('Tourist tax cannot be negative');
  }
  
  if (result.totals.totalVAT < 0) {
    errors.push('VAT cannot be negative');
  }
  
  if (result.totals.grandTotal < 0) {
    errors.push('Grand total cannot be negative');
  }
  
  // Verify calculation
  const expectedGrandTotal =
    result.totals.subtotal +
    result.totals.touristTax +
    result.totals.totalVAT;
  
  const tolerance = 0.01;
  if (
    Math.abs(expectedGrandTotal - result.totals.grandTotal) > tolerance
  ) {
    errors.push(
      `Grand total mismatch: expected ${expectedGrandTotal.toFixed(2)}, got ${result.totals.grandTotal.toFixed(2)}`
    );
  }
  
  // Warnings
  if (result.touristTax.nights === 0) {
    warnings.push('No nights calculated - check reservation dates');
  }
  
  if (result.touristTax.guests === 0) {
    warnings.push('No guests specified');
  }
  
  if (result.totals.subtotal === 0) {
    warnings.push('Subtotal is zero - check amounts');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
