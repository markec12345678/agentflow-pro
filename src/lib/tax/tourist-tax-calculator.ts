/**
 * Slovenian Tourist Tax Calculator
 * 
 * Calculates tourist tax based on Slovenian regulations:
 * - Children 0-7: Free
 * - Children 7-18: 50% discount
 * - Adults 18+: Full rate
 * - Some municipalities have spa tax (zdraviliška taksa)
 * 
 * @see https://www.gov.si/en/topics/tourist-tax/
 */

import { prisma } from '@/lib/prisma';

export interface GuestInput {
  age: number;
  isResident?: boolean; // EU residents may have different rates in some cases
}

export interface ReservationInput {
  checkIn: Date;
  checkOut: Date;
  municipality: string;
  guests: GuestInput[];
  nights?: number; // Optional override for calculated nights
}

export interface TaxBreakdown {
  guestAge: number;
  category: 'adult' | 'child_7_18' | 'child_0_7';
  nights: number;
  ratePerNight: number;
  amount: number;
}

export interface TouristTaxResult {
  totalTax: number;
  breakdown: TaxBreakdown[];
  municipality: string;
  nights: number;
  guests: number;
}

/**
 * Calculate number of nights between check-in and check-out
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerNight = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / msPerNight);
  return Math.max(0, nights);
}

/**
 * Get guest tax category based on age
 */
export function getGuestCategory(age: number): 'adult' | 'child_7_18' | 'child_0_7' {
  if (age < 7) {
    return 'child_0_7';
  } else if (age < 18) {
    return 'child_7_18';
  } else {
    return 'adult';
  }
}

/**
 * Calculate tourist tax for a reservation
 */
export async function calculateTouristTax(
  reservation: ReservationInput
): Promise<TouristTaxResult> {
  const { checkIn, checkOut, municipality, guests } = reservation;
  
  // Calculate nights
  const nights = reservation.nights ?? calculateNights(checkIn, checkOut);
  
  if (nights <= 0) {
    return {
      totalTax: 0,
      breakdown: [],
      municipality,
      nights: 0,
      guests: guests.length,
    };
  }
  
  // Get tax rate for municipality
  const taxRate = await prisma.touristTaxRate.findFirst({
    where: {
      municipality: municipality.toLowerCase(),
      validFrom: { lte: new Date() },
    },
  });
  
  if (!taxRate) {
    throw new Error(
      `No tourist tax rate found for municipality: ${municipality}. ` +
      'Please add the rate using: npx ts-node scripts/seed-tax-rates.ts'
    );
  }
  
  const breakdown: TaxBreakdown[] = [];
  let totalTax = 0;
  
  for (const guest of guests) {
    const category = getGuestCategory(guest.age);
    let ratePerNight: number;
    
    switch (category) {
      case 'child_0_7':
        ratePerNight = Number(taxRate.children0_7); // Should be 0
        break;
      case 'child_7_18':
        ratePerNight = Number(taxRate.children7_18);
        break;
      case 'adult':
        ratePerNight = Number(taxRate.adults);
        break;
    }
    
    const amount = ratePerNight * nights;
    totalTax += amount;
    
    breakdown.push({
      guestAge: guest.age,
      category,
      nights,
      ratePerNight,
      amount,
    });
  }
  
  return {
    totalTax: Math.round(totalTax * 100) / 100, // Round to 2 decimals
    breakdown,
    municipality,
    nights,
    guests: guests.length,
  };
}

/**
 * Calculate tourist tax with custom rates (without database lookup)
 * Useful for testing or when you have rates cached
 */
export function calculateTouristTaxWithRates(
  reservation: ReservationInput,
  rates: {
    adults: number;
    children7_18: number;
    children0_7: number;
  }
): TouristTaxResult {
  const { checkIn, checkOut, guests } = reservation;
  const nights = reservation.nights ?? calculateNights(checkIn, checkOut);
  
  if (nights <= 0) {
    return {
      totalTax: 0,
      breakdown: [],
      municipality: 'custom',
      nights: 0,
      guests: guests.length,
    };
  }
  
  const breakdown: TaxBreakdown[] = [];
  let totalTax = 0;
  
  for (const guest of guests) {
    const category = getGuestCategory(guest.age);
    let ratePerNight: number;
    
    switch (category) {
      case 'child_0_7':
        ratePerNight = rates.children0_7;
        break;
      case 'child_7_18':
        ratePerNight = rates.children7_18;
        break;
      case 'adult':
        ratePerNight = rates.adults;
        break;
    }
    
    const amount = ratePerNight * nights;
    totalTax += amount;
    
    breakdown.push({
      guestAge: guest.age,
      category,
      nights,
      ratePerNight,
      amount,
    });
  }
  
  return {
    totalTax: Math.round(totalTax * 100) / 100,
    breakdown,
    municipality: 'custom',
    nights,
    guests: guests.length,
  };
}

/**
 * Get all available tax rates for municipalities
 */
export async function getAvailableTaxRates(): Promise<
  Array<{
    municipality: string;
    adultRate: number;
    childRate: number;
    infantRate: number;
    spaTax?: number;
  }>
> {
  const rates = await prisma.touristTaxRate.findMany({
    where: {
      validFrom: { lte: new Date() },
      OR: [
        { validTo: { gte: new Date() } },
        { validTo: null },
      ],
    },
    orderBy: { municipality: 'asc' },
  });
  
  return rates.map((rate) => ({
    municipality: rate.municipality,
    adultRate: Number(rate.adults),
    childRate: Number(rate.children7_18),
    infantRate: Number(rate.children0_7),
    spaTax: rate.spaTax ? Number(rate.spaTax) : undefined,
  }));
}

/**
 * Format tax breakdown for display
 */
export function formatTaxBreakdown(result: TouristTaxResult): string {
  const lines = [
    `Tourist Tax Breakdown for ${result.municipality}`,
    `Nights: ${result.nights}`,
    `Guests: ${result.guests}`,
    '',
    'Details:',
  ];
  
  for (const item of result.breakdown) {
    const ageLabel = `Age ${item.guestAge}`;
    const categoryLabel = item.category.replace('_', ' ');
    lines.push(
      `  ${ageLabel} (${categoryLabel}): ${item.nights} nights × €${item.ratePerNight.toFixed(2)} = €${item.amount.toFixed(2)}`
    );
  }
  
  lines.push('');
  lines.push(`Total Tax: €${result.totalTax.toFixed(2)}`);
  
  return lines.join('\n');
}

/**
 * Validate guest ages
 */
export function validateGuestAges(guests: GuestInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (let i = 0; i < guests.length; i++) {
    const guest = guests[i];
    
    if (guest.age < 0 || guest.age > 120) {
      errors.push(`Guest ${i + 1}: Invalid age ${guest.age}`);
    }
    
    if (guest.age < 7 && guest.isResident !== undefined) {
      // Infants are always free, residency doesn't matter
      console.warn(`Guest ${i + 1}: Residency status ignored for infant (age ${guest.age})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
