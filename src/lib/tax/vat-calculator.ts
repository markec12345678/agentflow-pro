/**
 * Slovenian VAT (DDV) Calculator
 * 
 * Slovenian VAT rates for hospitality:
 * - 9.5%: Accommodation, breakfast (if included)
 * - 22%: Other food services, extra services
 * - 0%: Exempt services (insurance, certain financial services)
 * 
 * @see https://www.gov.si/en/topics/vat/
 */

export enum VATRate {
  NONE = 0,        // 0% - No VAT
  ACCOMMODATION = 0.095, // 9.5% - Accommodation, breakfast
  FOOD = 0.22,    // 22% - Restaurant services
  SERVICES = 0.22, // 22% - Other services
  STANDARD = 0.22, // 22% - Standard rate
}

export interface VATItem {
  description: string;
  amount: number; // Net amount (without VAT)
  vatRate: VATRate;
  quantity?: number;
  unitPrice?: number;
}

export interface VATItemCalculated extends VATItem {
  vatAmount: number;
  grossAmount: number;
}

export interface VATResult {
  items: VATItemCalculated[];
  totalNet: number;
  totalVAT: number;
  totalGross: number;
  breakdownByRate: {
    [rate: number]: {
      netAmount: number;
      vatAmount: number;
      grossAmount: number;
    };
  };
}

/**
 * Calculate VAT for a single item
 */
export function calculateItemVAT(item: VATItem): VATItemCalculated {
  const vatAmount = item.amount * item.vatRate;
  const grossAmount = item.amount + vatAmount;
  
  return {
    ...item,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossAmount: Math.round(grossAmount * 100) / 100,
  };
}

/**
 * Calculate VAT for multiple items
 */
export function calculateVAT(items: VATItem[]): VATResult {
  const calculatedItems = items.map((item) => calculateItemVAT(item));
  
  const totalNet = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVAT = calculatedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalGross = calculatedItems.reduce((sum, item) => sum + item.grossAmount, 0);
  
  // Group by VAT rate
  const breakdownByRate: VATResult['breakdownByRate'] = {};
  
  for (const item of calculatedItems) {
    const rateKey = item.vatRate;
    
    if (!breakdownByRate[rateKey]) {
      breakdownByRate[rateKey] = {
        netAmount: 0,
        vatAmount: 0,
        grossAmount: 0,
      };
    }
    
    breakdownByRate[rateKey].netAmount += item.amount;
    breakdownByRate[rateKey].vatAmount += item.vatAmount;
    breakdownByRate[rateKey].grossAmount += item.grossAmount;
  }
  
  // Round all values
  for (const rate in breakdownByRate) {
    breakdownByRate[rate].netAmount = 
      Math.round(breakdownByRate[rate].netAmount * 100) / 100;
    breakdownByRate[rate].vatAmount = 
      Math.round(breakdownByRate[rate].vatAmount * 100) / 100;
    breakdownByRate[rate].grossAmount = 
      Math.round(breakdownByRate[rate].grossAmount * 100) / 100;
  }
  
  return {
    items: calculatedItems,
    totalNet: Math.round(totalNet * 100) / 100,
    totalVAT: Math.round(totalVAT * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    breakdownByRate,
  };
}

/**
 * Calculate VAT for a reservation with typical hospitality services
 */
export function calculateReservationVAT(
  accommodationAmount: number,
  options: {
    foodAmount?: number;
    servicesAmount?: number;
    otherAmount?: number;
  } = {}
): {
  accommodation: { base: number; rate: number; amount: number };
  food: { base: number; rate: number; amount: number };
  services: { base: number; rate: number; amount: number };
  other: { base: number; rate: number; amount: number };
  totals: {
    base: number;
    vat: number;
    gross: number;
  };
} {
  const items: VATItem[] = [];
  
  // Accommodation (9.5%)
  if (accommodationAmount > 0) {
    items.push({
      description: 'Accommodation',
      amount: accommodationAmount,
      vatRate: VATRate.ACCOMMODATION,
    });
  }
  
  // Food (22%)
  if (options.foodAmount && options.foodAmount > 0) {
    items.push({
      description: 'Food & Beverages',
      amount: options.foodAmount,
      vatRate: VATRate.FOOD,
    });
  }
  
  // Services (22%)
  if (options.servicesAmount && options.servicesAmount > 0) {
    items.push({
      description: 'Additional Services',
      amount: options.servicesAmount,
      vatRate: VATRate.SERVICES,
    });
  }
  
  // Other (22%)
  if (options.otherAmount && options.otherAmount > 0) {
    items.push({
      description: 'Other',
      amount: options.otherAmount,
      vatRate: VATRate.STANDARD,
    });
  }
  
  const vatResult = calculateVAT(items);
  
  // Extract by category
  const accommodation = items.find(i => i.vatRate === VATRate.ACCOMMODATION);
  const food = items.find(i => i.vatRate === VATRate.FOOD);
  const services = items.find(i => i.vatRate === VATRate.SERVICES);
  const other = items.find(i => i.vatRate === VATRate.STANDARD);
  
  return {
    accommodation: {
      base: accommodation?.amount || 0,
      rate: VATRate.ACCOMMODATION,
      amount: accommodation?.vatAmount || 0,
    },
    food: {
      base: food?.amount || 0,
      rate: VATRate.FOOD,
      amount: food?.vatAmount || 0,
    },
    services: {
      base: services?.amount || 0,
      rate: VATRate.SERVICES,
      amount: services?.vatAmount || 0,
    },
    other: {
      base: other?.amount || 0,
      rate: VATRate.STANDARD,
      amount: other?.vatAmount || 0,
    },
    totals: {
      base: vatResult.totalNet,
      vat: vatResult.totalVAT,
      gross: vatResult.totalGross,
    },
  };
}

/**
 * Get VAT rate label for display
 */
export function getVATRateLabel(rate: VATRate): string {
  switch (rate) {
    case VATRate.NONE:
      return '0% (Brez DDV)';
    case VATRate.ACCOMMODATION:
      return '9.5% (Namestitev)';
    case VATRate.FOOD:
      return '22% (Prehrana)';
    case VATRate.SERVICES:
      return '22% (Storitve)';
    case VATRate.STANDARD:
      return '22% (Standardno)';
    default:
      return `${(rate * 100).toFixed(1)}%`;
  }
}

/**
 * Get VAT rate category from description
 */
export function getVATRateFromDescription(description: string): VATRate {
  const desc = description.toLowerCase();
  
  // Accommodation related (9.5%)
  if (
    desc.includes('nočitev') ||
    desc.includes('accommodation') ||
    desc.includes('sob') ||
    desc.includes('room') ||
    desc.includes('apartma') ||
    desc.includes('apartment') ||
    desc.includes('breakfast') ||
    desc.includes('zajtrk')
  ) {
    return VATRate.ACCOMMODATION;
  }
  
  // Food related (22%)
  if (
    desc.includes('hrana') ||
    desc.includes('food') ||
    desc.includes('pijača') ||
    desc.includes('beverage') ||
    desc.includes('kosilo') ||
    desc.includes('lunch') ||
    desc.includes('večerja') ||
    desc.includes('dinner') ||
    desc.includes('restavracija') ||
    desc.includes('restaurant')
  ) {
    return VATRate.FOOD;
  }
  
  // Services related (22%)
  if (
    desc.includes('storitev') ||
    desc.includes('service') ||
    desc.includes('wellness') ||
    desc.includes('spa') ||
    desc.includes('parking') ||
    desc.includes('parkirišče') ||
    desc.includes('transfer') ||
    desc.includes('tour') ||
    desc.includes('vodenje')
  ) {
    return VATRate.SERVICES;
  }
  
  // Default to standard rate
  return VATRate.STANDARD;
}

/**
 * Format VAT breakdown for display (bilingual)
 */
export function formatVATBreakdown(result: VATResult, locale: 'sl' | 'en' = 'sl'): string {
  const t = {
    sl: {
      vatBreakdown: 'Pregled DDV',
      rate: 'Stopnja',
      netAmount: 'Osnova',
      vatAmount: 'DDV',
      grossAmount: 'Znesek z DDV',
      total: 'Skupaj',
      noVAT: 'Brez DDV',
    },
    en: {
      vatBreakdown: 'VAT Breakdown',
      rate: 'Rate',
      netAmount: 'Net Amount',
      vatAmount: 'VAT Amount',
      grossAmount: 'Gross Amount',
      total: 'Total',
      noVAT: 'No VAT',
    },
  };
  
  const labels = t[locale];
  const lines = [labels.vatBreakdown, ''];
  
  for (const [rateKey, breakdown] of Object.entries(result.breakdownByRate)) {
    const rate = parseFloat(rateKey);
    const rateLabel = rate === 0 ? labels.noVAT : `${(rate * 100).toFixed(1)}%`;
    
    lines.push(`${rateLabel}:`);
    lines.push(`  ${labels.netAmount}: €${breakdown.netAmount.toFixed(2)}`);
    lines.push(`  ${labels.vatAmount}: €${breakdown.vatAmount.toFixed(2)}`);
    lines.push(`  ${labels.grossAmount}: €${breakdown.grossAmount.toFixed(2)}`);
    lines.push('');
  }
  
  lines.push('─'.repeat(40));
  lines.push(`${labels.total}:`);
  lines.push(`  ${labels.netAmount}: €${result.totalNet.toFixed(2)}`);
  lines.push(`  ${labels.vatAmount}: €${result.totalVAT.toFixed(2)}`);
  lines.push(`  ${labels.grossAmount}: €${result.totalGross.toFixed(2)}`);
  
  return lines.join('\n');
}

/**
 * Validate VAT amounts
 */
export function validateVATCalculation(result: VATResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check totals match sum of items
  const calculatedNet = result.items.reduce((sum, item) => sum + item.amount, 0);
  const calculatedVAT = result.items.reduce((sum, item) => sum + item.vatAmount, 0);
  const calculatedGross = result.items.reduce((sum, item) => sum + item.grossAmount, 0);
  
  const tolerance = 0.01; // Allow 1 cent tolerance for rounding
  
  if (Math.abs(calculatedNet - result.totalNet) > tolerance) {
    errors.push(
      `Total net amount mismatch: expected ${result.totalNet}, got ${calculatedNet}`
    );
  }
  
  if (Math.abs(calculatedVAT - result.totalVAT) > tolerance) {
    errors.push(
      `Total VAT amount mismatch: expected ${result.totalVAT}, got ${calculatedVAT}`
    );
  }
  
  if (Math.abs(calculatedGross - result.totalGross) > tolerance) {
    errors.push(
      `Total gross amount mismatch: expected ${result.totalGross}, got ${calculatedGross}`
    );
  }
  
  // Check for negative amounts
  if (result.totalNet < 0) {
    errors.push('Total net amount cannot be negative');
  }
  
  if (result.totalVAT < 0) {
    errors.push('Total VAT amount cannot be negative');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
