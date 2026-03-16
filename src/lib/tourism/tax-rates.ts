/**
 * Slovenian Tourist Tax Rates 2026
 * 
 * Source: https://www.gov.si/en/topics/tourist-tax/
 * Updated: 2026-03-15
 * 
 * Rates are per person per night in EUR
 */

export interface TouristTaxRate {
  adults: number;           // Age 18+
  children_7_18: number;    // Age 7-18
  children_0_7: number;     // Age 0-7 (usually free)
  spa_tax?: number;         // Additional spa tax (Zdraviliška taksa)
}

export const TOURIST_TAX_RATES: Record<string, TouristTaxRate> = {
  // ============================================================================
  // DOLENJSKA, BELA KRAJINA, POSAVJE (Robert's region)
  // ============================================================================
  
  'gradac': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
    spa_tax: 0.43, // If property has spa status
  },
  
  'belokranjska': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  'novo_mesto': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
    spa_tax: 0.43,
  },
  
  'dolenjske_toplice': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
    spa_tax: 0.43,
  },
  
  'straza': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  // ============================================================================
  // LJUBLJANA REGION
  // ============================================================================
  
  'ljubljana': {
    adults: 3.13,
    children_7_18: 1.57,
    children_0_7: 0,
  },
  
  // ============================================================================
  // BLED & ALPINE REGION
  // ============================================================================
  
  'bled': {
    adults: 2.20,
    children_7_18: 1.10,
    children_0_7: 0,
  },
  
  'bohinj': {
    adults: 2.20,
    children_7_18: 1.10,
    children_0_7: 0,
  },
  
  'kranjska_gora': {
    adults: 2.20,
    children_7_18: 1.10,
    children_0_7: 0,
  },
  
  // ============================================================================
  // COASTAL REGION (Obala)
  // ============================================================================
  
  'portoroz': {
    adults: 2.48,
    children_7_18: 1.24,
    children_0_7: 0,
    spa_tax: 0.43,
  },
  
  'piran': {
    adults: 2.48,
    children_7_18: 1.24,
    children_0_7: 0,
    spa_tax: 0.43,
  },
  
  'koper': {
    adults: 2.48,
    children_7_18: 1.24,
    children_0_7: 0,
  },
  
  'izola': {
    adults: 2.48,
    children_7_18: 1.24,
    children_0_7: 0,
  },
  
  // ============================================================================
  // OTHER MAJOR TOURIST DESTINATIONS
  // ============================================================================
  
  'postojna': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  'predjama': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  'skocjan': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  'radovljica': {
    adults: 2.20,
    children_7_18: 1.10,
    children_0_7: 0,
  },
  
  'trzin': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
  
  // ============================================================================
  // DEFAULT (Other municipalities)
  // ============================================================================
  
  'default': {
    adults: 1.53,
    children_7_18: 0.77,
    children_0_7: 0,
  },
};

/**
 * Calculate tourist tax for a reservation
 * 
 * @param municipality - Municipality name (e.g., 'gradac', 'ljubljana', 'bled')
 * @param adults - Number of adults (age 18+)
 * @param children_7_18 - Number of children age 7-18
 * @param children_0_7 - Number of children age 0-7
 * @param nights - Number of nights
 * @param hasSpa - Whether property has spa status (adds spa tax)
 * @returns Total tourist tax in EUR (rounded to 2 decimals)
 */
export function calculateTouristTax(
  municipality: string,
  adults: number,
  children_7_18: number,
  children_0_7: number,
  nights: number,
  hasSpa: boolean = false
): number {
  // Normalize municipality key
  const key = municipality.toLowerCase().replace(/[\s-]/g, '_');
  const rates = TOURIST_TAX_RATES[key] || TOURIST_TAX_RATES.default;
  
  // Calculate base tax
  let tax = (
    (rates.adults * adults) +
    (rates.children_7_18 * children_7_18) +
    (rates.children_0_7 * children_0_7)
  ) * nights;
  
  // Add spa tax if applicable
  if (hasSpa && rates.spa_tax) {
    tax += rates.spa_tax * adults * nights;
  }
  
  // Round to 2 decimals
  return Math.round(tax * 100) / 100;
}

/**
 * Calculate VAT (DDV) for Slovenia
 * 
 * @param amount - Base amount in EUR
 * @param rate - VAT rate (default 22% for accommodation)
 * @returns VAT amount in EUR (rounded to 2 decimals)
 */
export function calculateVAT(amount: number, rate: number = 22): number {
  return Math.round(amount * (rate / 100) * 100) / 100;
}

/**
 * Calculate total price including tourist tax and VAT
 * 
 * @param basePrice - Base accommodation price
 * @param municipality - Municipality for tourist tax
 * @param adults - Number of adults
 * @param children_7_18 - Number of children 7-18
 * @param children_0_7 - Number of children 0-7
 * @param nights - Number of nights
 * @param hasSpa - Whether property has spa status
 * @returns Object with breakdown and total
 */
export function calculateTotalPrice(
  basePrice: number,
  municipality: string,
  adults: number,
  children_7_18: number,
  children_0_7: number,
  nights: number,
  hasSpa: boolean = false
) {
  const touristTax = calculateTouristTax(
    municipality,
    adults,
    children_7_18,
    children_0_7,
    nights,
    hasSpa
  );
  
  const subtotal = basePrice + touristTax;
  const vat = calculateVAT(subtotal, 22);
  const total = subtotal + vat;
  
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    touristTax,
    subtotal,
    vatRate: 22,
    vatAmount: vat,
    total,
  };
}

/**
 * Get all available municipalities with tourist tax rates
 * 
 * @returns Array of municipality names
 */
export function getMunicipalities(): string[] {
  return Object.keys(TOURIST_TAX_RATES);
}

/**
 * Get tourist tax rate for specific municipality
 * 
 * @param municipality - Municipality name
 * @returns TouristTaxRate object
 */
export function getTaxRate(municipality: string): TouristTaxRate {
  const key = municipality.toLowerCase().replace(/[\s-]/g, '_');
  return TOURIST_TAX_RATES[key] || TOURIST_TAX_RATES.default;
}
