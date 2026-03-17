/**
 * Monthly Tax Report Generator
 * 
 * Generates monthly tax reports for eDavki submission.
 * Aggregates all reservations for a property in a given month
 * and calculates total tourist tax and VAT obligations.
 * 
 * Usage:
 *   import { generateMonthlyTaxReport } from '@/lib/tax/monthly-report-generator';
 *   const report = await generateMonthlyTaxReport(propertyId, 3, 2026);
 */

import { prisma } from '@/lib/prisma';

export interface MonthlyTaxReport {
  // Report metadata
  id: string;
  propertyId: string;
  propertyName: string;
  month: number; // 1-12
  year: number;
  periodStart: Date;
  periodEnd: Date;
  
  // Tourist tax summary
  touristTax: {
    totalNights: number;
    totalGuests: number;
    totalAdults: number;
    totalChildren: number;
    totalAmount: number;
    byMunicipality: Array<{
      municipality: string;
      nights: number;
      guests: number;
      amount: number;
    }>;
  };
  
  // VAT summary
  vat: {
    accommodation: {
      taxableBase: number;
      vatRate: number; // 0.095
      vatAmount: number;
    };
    food: {
      taxableBase: number;
      vatRate: number; // 0.22
      vatAmount: number;
    };
    services: {
      taxableBase: number;
      vatRate: number; // 0.22
      vatAmount: number;
    };
    totalTaxableBase: number;
    totalVATAmount: number;
  };
  
  // Totals
  totals: {
    totalRevenue: number; // Before taxes
    totalTouristTax: number;
    totalVAT: number;
    totalToRemit: number; // Tourist tax + VAT
  };
  
  // Status
  status: 'draft' | 'submitted' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateReportOptions {
  includeCancelled?: boolean;
  includeDraft?: boolean;
}

/**
 * Generate monthly tax report for a property
 */
export async function generateMonthlyTaxReport(
  propertyId: string,
  month: number,
  year: number,
  options: GenerateReportOptions = {}
): Promise<MonthlyTaxReport> {
  const { includeCancelled = false, includeDraft = false } = options;
  
  // Get property info
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
    },
  });
  
  if (!property) {
    throw new Error(`Property not found: ${propertyId}`);
  }
  
  // Calculate period
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  
  // Get all reservations for the month
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkIn: {
        gte: periodStart,
        lte: periodEnd,
      },
      ...(includeCancelled ? {} : { status: { not: 'cancelled' } }),
    },
    include: {
      guests: true,
    },
  });
  
  // Initialize aggregators
  const touristTaxAggregator = {
    totalNights: 0,
    totalGuests: 0,
    totalAdults: 0,
    totalChildren: 0,
    totalAmount: 0,
    byMunicipality: new Map<
      string,
      { nights: number; guests: number; amount: number }
    >(),
  };
  
  const vatAggregator = {
    accommodationBase: 0,
    accommodationVAT: 0,
    foodBase: 0,
    foodVAT: 0,
    servicesBase: 0,
    servicesVAT: 0,
  };
  
  let totalRevenue = 0;
  
  // Process each reservation
  for (const reservation of reservations) {
    // Calculate nights
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (nights <= 0) continue;
    
    // Get municipality (from property or reservation)
    const municipality =
      (reservation as any).municipality ||
      (property as any).municipality ||
      'other';
    
    // Aggregate tourist tax
    const touristTaxAmount = Number(reservation.touristTaxAmount || 0);
    touristTaxAggregator.totalNights += nights;
    touristTaxAggregator.totalAmount += touristTaxAmount;
    
    // Count guests by age
    for (const guest of reservation.guests) {
      const age = (guest as any).age || 30; // Default age if not available
      touristTaxAggregator.totalGuests++;
      
      if (age < 18) {
        touristTaxAggregator.totalChildren++;
      } else {
        touristTaxAggregator.totalAdults++;
      }
    }
    
    // Aggregate by municipality
    const munEntry = touristTaxAggregator.byMunicipality.get(municipality) || {
      nights: 0,
      guests: 0,
      amount: 0,
    };
    munEntry.nights += nights;
    munEntry.guests += reservation.guests.length;
    munEntry.amount += touristTaxAmount;
    touristTaxAggregator.byMunicipality.set(municipality, munEntry);
    
    // Aggregate VAT
    const taxBreakdown = reservation.taxBreakdown as any;
    if (taxBreakdown?.vat) {
      const vat = taxBreakdown.vat;
      
      if (vat.accommodation) {
        vatAggregator.accommodationBase += Number(vat.accommodation.base || 0);
        vatAggregator.accommodationVAT += Number(vat.accommodation.amount || 0);
      }
      
      if (vat.food) {
        vatAggregator.foodBase += Number(vat.food.base || 0);
        vatAggregator.foodVAT += Number(vat.food.amount || 0);
      }
      
      if (vat.services) {
        vatAggregator.servicesBase += Number(vat.services.base || 0);
        vatAggregator.servicesVAT += Number(vat.services.amount || 0);
      }
    }
    
    // Aggregate revenue
    totalRevenue += Number(reservation.totalPrice || 0);
  }
  
  // Build report
  const report: MonthlyTaxReport = {
    id: '', // Will be set by database
    propertyId,
    propertyName: property.name,
    month,
    year,
    periodStart,
    periodEnd,
    
    touristTax: {
      totalNights: touristTaxAggregator.totalNights,
      totalGuests: touristTaxAggregator.totalGuests,
      totalAdults: touristTaxAggregator.totalAdults,
      totalChildren: touristTaxAggregator.totalChildren,
      totalAmount: Math.round(touristTaxAggregator.totalAmount * 100) / 100,
      byMunicipality: Array.from(
        touristTaxAggregator.byMunicipality.entries()
      ).map(([municipality, data]) => ({
        municipality,
        nights: data.nights,
        guests: data.guests,
        amount: Math.round(data.amount * 100) / 100,
      })),
    },
    
    vat: {
      accommodation: {
        taxableBase: Math.round(vatAggregator.accommodationBase * 100) / 100,
        vatRate: 0.095,
        vatAmount: Math.round(vatAggregator.accommodationVAT * 100) / 100,
      },
      food: {
        taxableBase: Math.round(vatAggregator.foodBase * 100) / 100,
        vatRate: 0.22,
        vatAmount: Math.round(vatAggregator.foodVAT * 100) / 100,
      },
      services: {
        taxableBase: Math.round(vatAggregator.servicesBase * 100) / 100,
        vatRate: 0.22,
        vatAmount: Math.round(vatAggregator.servicesVAT * 100) / 100,
      },
      totalTaxableBase:
        Math.round(
          (vatAggregator.accommodationBase +
            vatAggregator.foodBase +
            vatAggregator.servicesBase) *
            100
        ) / 100,
      totalVATAmount:
        Math.round(
          (vatAggregator.accommodationVAT +
            vatAggregator.foodVAT +
            vatAggregator.servicesVAT) *
            100
        ) / 100,
    },
    
    totals: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTouristTax: Math.round(touristTaxAggregator.totalAmount * 100) / 100,
      totalVAT:
        Math.round(
          (vatAggregator.accommodationVAT +
            vatAggregator.foodVAT +
            vatAggregator.servicesVAT) *
            100
        ) / 100,
      totalToRemit:
        Math.round(
          (touristTaxAggregator.totalAmount +
            vatAggregator.accommodationVAT +
            vatAggregator.foodVAT +
            vatAggregator.servicesVAT) *
            100
        ) / 100,
    },
    
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return report;
}

/**
 * Save tax report to database
 */
export async function saveTaxReport(
  report: MonthlyTaxReport
): Promise<any> {
  return await prisma.taxReport.upsert({
    where: {
      propertyId_year_monthNumber: {
        propertyId: report.propertyId,
        year: report.year,
        monthNumber: report.month,
      },
    },
    update: {
      totalNights: report.touristTax.totalNights,
      totalGuests: report.touristTax.totalGuests,
      totalAdults: report.touristTax.totalAdults,
      totalChildren: report.touristTax.totalChildren,
      touristTaxAmount: report.touristTax.totalAmount,
      vatAmount: report.vat.totalVATAmount,
      totalAccommodation: report.vat.accommodation.taxableBase,
      totalRevenue: report.totals.totalRevenue,
      totalToRemit: report.totals.totalToRemit,
      status: report.status,
      updatedAt: new Date(),
    },
    create: {
      propertyId: report.propertyId,
      propertyName: report.propertyName,
      month: report.periodStart,
      year: report.year,
      monthNumber: report.month,
      totalNights: report.touristTax.totalNights,
      totalGuests: report.touristTax.totalGuests,
      totalAdults: report.touristTax.totalAdults,
      totalChildren: report.touristTax.totalChildren,
      touristTaxAmount: report.touristTax.totalAmount,
      vatAmount: report.vat.totalVATAmount,
      totalAccommodation: report.vat.accommodation.taxableBase,
      totalRevenue: report.totals.totalRevenue,
      totalToRemit: report.totals.totalToRemit,
      status: report.status,
    },
  });
}

/**
 * Generate and save monthly tax report
 */
export async function generateAndSaveTaxReport(
  propertyId: string,
  month: number,
  year: number,
  options: GenerateReportOptions = {}
): Promise<MonthlyTaxReport> {
  const report = await generateMonthlyTaxReport(
    propertyId,
    month,
    year,
    options
  );
  await saveTaxReport(report);
  return report;
}

/**
 * Get existing tax report from database
 */
export async function getTaxReport(
  propertyId: string,
  month: number,
  year: number
): Promise<MonthlyTaxReport | null> {
  const dbReport = await prisma.taxReport.findUnique({
    where: {
      propertyId_year_monthNumber: {
        propertyId,
        year,
        monthNumber: month,
      },
    },
  });
  
  if (!dbReport) {
    return null;
  }
  
  // Convert to MonthlyTaxReport format
  return {
    id: dbReport.id,
    propertyId: dbReport.propertyId,
    propertyName: dbReport.propertyName,
    month: dbReport.monthNumber,
    year: dbReport.year,
    periodStart: new Date(dbReport.year, dbReport.monthNumber - 1, 1),
    periodEnd: new Date(dbReport.year, dbReport.monthNumber, 0),
    touristTax: {
      totalNights: dbReport.totalNights,
      totalGuests: dbReport.totalGuests,
      totalAdults: dbReport.totalAdults || 0,
      totalChildren: dbReport.totalChildren || 0,
      totalAmount: Number(dbReport.touristTaxAmount),
      byMunicipality: [], // Would need to fetch from reservations
    },
    vat: {
      accommodation: {
        taxableBase: Number(dbReport.totalAccommodation),
        vatRate: 0.095,
        vatAmount: 0, // Would need detailed breakdown
      },
      food: {
        taxableBase: 0,
        vatRate: 0.22,
        vatAmount: 0,
      },
      services: {
        taxableBase: 0,
        vatRate: 0.22,
        vatAmount: 0,
      },
      totalTaxableBase: Number(dbReport.totalAccommodation),
      totalVATAmount: Number(dbReport.vatAmount),
    },
    totals: {
      totalRevenue: Number(dbReport.totalRevenue),
      totalTouristTax: Number(dbReport.touristTaxAmount),
      totalVAT: Number(dbReport.vatAmount),
      totalToRemit: Number(dbReport.totalToRemit),
    },
    status: dbReport.status as any,
    createdAt: dbReport.createdAt,
    updatedAt: dbReport.updatedAt,
  };
}

/**
 * Mark tax report as submitted to eDavki
 */
export async function markReportAsSubmitted(
  reportId: string,
  edavkiExportUrl?: string
): Promise<void> {
  await prisma.taxReport.update({
    where: { id: reportId },
    data: {
      status: 'submitted',
      edavkiSubmittedAt: new Date(),
      edavkiExportUrl: edavkiExportUrl || null,
    },
  });
}

/**
 * Mark tax report as paid
 */
export async function markReportAsPaid(reportId: string): Promise<void> {
  await prisma.taxReport.update({
    where: { id: reportId },
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
  });
}

/**
 * Get all tax reports for a property
 */
export async function getPropertyTaxReports(
  propertyId: string,
  options: {
    year?: number;
    status?: string;
    limit?: number;
  } = {}
): Promise<MonthlyTaxReport[]> {
  const { year, status, limit = 100 } = options;
  
  const where: any = { propertyId };
  
  if (year) {
    where.year = year;
  }
  
  if (status) {
    where.status = status;
  }
  
  const dbReports = await prisma.taxReport.findMany({
    where,
    orderBy: [{ year: 'desc' }, { monthNumber: 'desc' }],
    take: limit,
  });
  
  return dbReports.map((report) => ({
    id: report.id,
    propertyId: report.propertyId,
    propertyName: report.propertyName,
    month: report.monthNumber,
    year: report.year,
    periodStart: new Date(report.year, report.monthNumber - 1, 1),
    periodEnd: new Date(report.year, report.monthNumber, 0),
    touristTax: {
      totalNights: report.totalNights,
      totalGuests: report.totalGuests,
      totalAdults: report.totalAdults || 0,
      totalChildren: report.totalChildren || 0,
      totalAmount: Number(report.touristTaxAmount),
      byMunicipality: [],
    },
    vat: {
      accommodation: {
        taxableBase: Number(report.totalAccommodation),
        vatRate: 0.095,
        vatAmount: 0,
      },
      food: {
        taxableBase: 0,
        vatRate: 0.22,
        vatAmount: 0,
      },
      services: {
        taxableBase: 0,
        vatRate: 0.22,
        vatAmount: 0,
      },
      totalTaxableBase: Number(report.totalAccommodation),
      totalVATAmount: Number(report.vatAmount),
    },
    totals: {
      totalRevenue: Number(report.totalRevenue),
      totalTouristTax: Number(report.touristTaxAmount),
      totalVAT: Number(report.vatAmount),
      totalToRemit: Number(report.totalToRemit),
    },
    status: report.status as any,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }));
}

/**
 * Format report for display
 */
export function formatTaxReport(report: MonthlyTaxReport): string {
  const lines = [
    '═'.repeat(70),
    `MONTHLY TAX REPORT - ${report.propertyName}`,
    `${report.month}/${report.year}`,
    '═'.repeat(70),
    '',
    'PERIOD',
    `From: ${report.periodStart.toLocaleDateString('sl-SI')}`,
    `To: ${report.periodEnd.toLocaleDateString('sl-SI')}`,
    '',
    '─'.repeat(70),
    'TOURIST TAX SUMMARY',
    '─'.repeat(70),
    `Total Nights: ${report.touristTax.totalNights}`,
    `Total Guests: ${report.touristTax.totalGuests} (${report.touristTax.totalAdults} adults, ${report.touristTax.totalChildren} children)`,
    `Total Tourist Tax: €${report.touristTax.totalAmount.toFixed(2)}`,
    '',
    'By Municipality:',
  ];
  
  for (const mun of report.touristTax.byMunicipality) {
    lines.push(
      `  ${mun.municipality}: ${mun.nights} nights, ${mun.guests} guests, €${mun.amount.toFixed(2)}`
    );
  }
  
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('VAT SUMMARY');
  lines.push('─'.repeat(70));
  lines.push(
    `Accommodation (9.5%): €${report.vat.accommodation.taxableBase.toFixed(2)} base, €${report.vat.accommodation.vatAmount.toFixed(2)} VAT`
  );
  lines.push(
    `Food (22%): €${report.vat.food.taxableBase.toFixed(2)} base, €${report.vat.food.vatAmount.toFixed(2)} VAT`
  );
  lines.push(
    `Services (22%): €${report.vat.services.taxableBase.toFixed(2)} base, €${report.vat.services.vatAmount.toFixed(2)} VAT`
  );
  lines.push('');
  lines.push(
    `Total Taxable Base: €${report.vat.totalTaxableBase.toFixed(2)}`
  );
  lines.push(`Total VAT: €${report.vat.totalVATAmount.toFixed(2)}`);
  lines.push('');
  lines.push('─'.repeat(70));
  lines.push('TOTALS');
  lines.push('─'.repeat(70));
  lines.push(`Total Revenue: €${report.totals.totalRevenue.toFixed(2)}`);
  lines.push(`Tourist Tax: €${report.totals.totalTouristTax.toFixed(2)}`);
  lines.push(`VAT: €${report.totals.totalVAT.toFixed(2)}`);
  lines.push(`TOTAL TO REMIT: €${report.totals.totalToRemit.toFixed(2)}`);
  lines.push('');
  lines.push(`Status: ${report.status.toUpperCase()}`);
  lines.push('═'.repeat(70));
  
  return lines.join('\n');
}
