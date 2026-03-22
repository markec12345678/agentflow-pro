import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface TaxCalculationRequest {
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }[];
  defaultTaxRate?: number;
  country?: string;
  isBusinessCustomer?: boolean;
  taxId?: string;
}

interface TaxCalculationResult {
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate: number;
    subtotal: number;
    discountedSubtotal: number;
    taxAmount: number;
    total: number;
  }[];
  totals: {
    subtotal: number;
    totalDiscount: number;
    discountedSubtotal: number;
    totalTaxAmount: number;
    totalAmount: number;
  };
  taxInfo: {
    country: string;
    taxRate: number;
    taxType: string;
    isTaxExempt: boolean;
    appliedTaxRules: string[];
  };
}

/**
 * POST /api/invoices/calculate-tax
 * Calculate tax for invoice items
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const body: TaxCalculationRequest = await request.json();
    const { items, defaultTaxRate = 21, country = "SI", isBusinessCustomer = false, taxId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Items are required' } },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.description || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ITEM', message: 'Each item must have description, quantity, and unitPrice' } },
          { status: 400 }
        );
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_QUANTITY', message: 'Quantity must be a positive number' } },
          { status: 400 }
        );
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PRICE', message: 'Unit price must be a positive number' } },
          { status: 400 }
        );
      }

      if (item.discount && (typeof item.discount !== 'number' || item.discount < 0 || item.discount > 100)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_DISCOUNT', message: 'Discount must be between 0 and 100' } },
          { status: 400 }
        );
      }
    }

    // Calculate tax
    const taxCalculation = calculateTax(items, defaultTaxRate, country, isBusinessCustomer, taxId);

    return NextResponse.json({
      success: true,
      data: taxCalculation
    });

  } catch (error) {
    console.error('Calculate tax error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function calculateTax(items: TaxCalculationRequest['items'], defaultTaxRate: number, country: string, isBusinessCustomer: boolean, taxId?: string): TaxCalculationResult {
  // Determine tax rules based on country and customer type
  const taxInfo = determineTaxRules(country, isBusinessCustomer, taxId);
  
  const calculatedItems = items.map(item => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    const discountedSubtotal = subtotal * (1 - discount / 100);
    const taxRate = item.taxRate || taxInfo.taxRate;
    const taxAmount = taxInfo.isTaxExempt ? 0 : discountedSubtotal * taxRate / 100;
    const total = discountedSubtotal + taxAmount;

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount,
      taxRate,
      subtotal,
      discountedSubtotal,
      taxAmount,
      total
    };
  });

  const totals = {
    subtotal: calculatedItems.reduce((sum, item) => sum + item.subtotal, 0),
    totalDiscount: calculatedItems.reduce((sum, item) => sum + (item.discount ? (item.subtotal * item.discount / 100) : 0), 0),
    discountedSubtotal: calculatedItems.reduce((sum, item) => sum + item.discountedSubtotal, 0),
    totalTaxAmount: calculatedItems.reduce((sum, item) => sum + item.taxAmount, 0),
    totalAmount: calculatedItems.reduce((sum, item) => sum + item.total, 0)
  };

  return {
    items: calculatedItems,
    totals,
    taxInfo
  };
}

function determineTaxRules(country: string, isBusinessCustomer: boolean, taxId?: string) {
  // EU VAT rules (simplified)
  const euVatRates: { [key: string]: number } = {
    'AT': 20, // Austria
    'BE': 21, // Belgium
    'HR': 25, // Croatia
    'CY': 19, // Cyprus
    'CZ': 21, // Czech Republic
    'DK': 25, // Denmark
    'EE': 20, // Estonia
    'FI': 24, // Finland
    'FR': 20, // France
    'DE': 19, // Germany
    'GR': 24, // Greece
    'HU': 27, // Hungary
    'IE': 23, // Ireland
    'IT': 22, // Italy
    'LV': 21, // Latvia
    'LT': 21, // Lithuania
    'LU': 17, // Luxembourg
    'MT': 18, // Malta
    'NL': 21, // Netherlands
    'PL': 23, // Poland
    'PT': 23, // Portugal
    'RO': 19, // Romania
    'SK': 20, // Slovakia
    'SI': 22, // Slovenia
    'ES': 21, // Spain
    'SE': 25, // Sweden
  };

  const taxRate = euVatRates[country] || 22; // Default to 22% for Slovenia
  
  let isTaxExempt = false;
  let taxType = "VAT";
  let appliedTaxRules: string[] = [];

  // Check for tax exemption
  if (isBusinessCustomer && taxId && euVatRates[country]) {
    // B2B transaction within EU - reverse charge mechanism
    isTaxExempt = true;
    taxType = "Reverse Charge";
    appliedTaxRules.push("EU B2B Reverse Charge");
  } else if (country === "SI" && isBusinessCustomer && taxId) {
    // Domestic B2B - apply VAT
    taxType = "Standard VAT";
    appliedTaxRules.push("Domestic B2B");
  } else if (country === "SI" && !isBusinessCustomer) {
    // Domestic B2C - apply VAT
    taxType = "Standard VAT";
    appliedTaxRules.push("Domestic B2C");
  } else if (euVatRates[country] && !isBusinessCustomer) {
    // EU B2C - apply VAT
    taxType = "EU VAT";
    appliedTaxRules.push("EU B2C");
  } else {
    // Non-EU or other cases
    taxType = "Export";
    appliedTaxRules.push("Export/Other");
  }

  // Special rules for tourism industry in Slovenia
  if (country === "SI") {
    appliedTaxRules.push("Slovenian Tourism Rules");
    // Accommodation services might have reduced rates
    // This would be implemented based on service type
  }

  return {
    country,
    taxRate,
    taxType,
    isTaxExempt,
    appliedTaxRules
  };
}

// Helper function to validate tax ID (simplified)
function validateTaxID(taxId: string, country: string): boolean {
  if (!taxId) return false;
  
  // Simplified validation - in real implementation, this would be more sophisticated
  const patterns: { [key: string]: RegExp } = {
    'SI': /^SI\d{8}$/, // Slovenia: SI + 8 digits
    'DE': /^DE\d{9}$/, // Germany: DE + 9 digits
    'AT': /^ATU\d{8}$/, // Austria: ATU + 8 digits
    'HR': /^HR\d{11}$/, // Croatia: HR + 11 digits
    // Add more country patterns as needed
  };
  
  const pattern = patterns[country];
  if (!pattern) return true; // Allow unknown countries for now
  
  return pattern.test(taxId.replace(/\s/g, ''));
}
}
