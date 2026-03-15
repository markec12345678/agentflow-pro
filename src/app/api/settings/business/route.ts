import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface BusinessSettings {
  propertyInfo: {
    name: string;
    legalName: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    contact: {
      phone: string;
      email: string;
      website: string;
    };
    taxId: string;
    registrationNumber: string;
  };
  businessHours: {
    checkIn: {
      start: string;
      end: string;
    };
    checkOut: {
      start: string;
      end: string;
    };
    reception: {
      [key: string]: {
        open: string;
        close: string;
        enabled: boolean;
      };
    };
  };
  policies: {
    cancellation: {
      freeCancellationDays: number;
      cancellationFee: number;
      noShowFee: number;
      description: string;
    };
    payment: {
      depositRequired: boolean;
      depositPercentage: number;
      paymentMethods: string[];
      paymentDueDays: number;
      currency: string;
    };
  };
  taxSettings: {
    vatEnabled: boolean;
    vatRate: number;
    taxId: string;
    taxName: string;
    includeTaxInPrices: boolean;
  };
  localization: {
    defaultCurrency: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
}

/**
 * GET /api/settings/business
 * Get business settings for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user's business settings (in real implementation, this would be stored in database)
    // For now, return default settings
    const defaultSettings: BusinessSettings = {
      propertyInfo: {
        name: "Hotel Alpina",
        legalName: "Alpina d.o.o.",
        address: {
          street: "Cankarjeva ulica 5",
          city: "Ljubljana",
          postalCode: "1000",
          country: "Slovenija"
        },
        contact: {
          phone: "+386 1 234 5678",
          email: "info@hotel-alpina.si",
          website: "https://www.hotel-alpina.si"
        },
        taxId: "SI12345678",
        registrationNumber: "6045789000"
      },
      businessHours: {
        checkIn: { start: "14:00", end: "22:00" },
        checkOut: { start: "07:00", end: "11:00" },
        reception: {
          monday: { open: "06:00", close: "23:00", enabled: true },
          tuesday: { open: "06:00", close: "23:00", enabled: true },
          wednesday: { open: "06:00", close: "23:00", enabled: true },
          thursday: { open: "06:00", close: "23:00", enabled: true },
          friday: { open: "06:00", close: "23:00", enabled: true },
          saturday: { open: "06:00", close: "23:00", enabled: true },
          sunday: { open: "06:00", close: "23:00", enabled: true }
        }
      },
      policies: {
        cancellation: {
          freeCancellationDays: 2,
          cancellationFee: 25,
          noShowFee: 100,
          description: "Free cancellation up to 2 days before check-in. After that, 25% of the total price. No-show fee is 100% of the total price."
        },
        payment: {
          depositRequired: true,
          depositPercentage: 30,
          paymentMethods: ["credit_card", "bank_transfer", "cash"],
          paymentDueDays: 14,
          currency: "EUR"
        }
      },
      taxSettings: {
        vatEnabled: true,
        vatRate: 22,
        taxId: "SI12345678",
        taxName: "DDV",
        includeTaxInPrices: true
      },
      localization: {
        defaultCurrency: "EUR",
        defaultLanguage: "sl",
        timezone: "Europe/Ljubljana",
        dateFormat: "DD.MM.YYYY",
        numberFormat: "1.234,56"
      }
    };

    return NextResponse.json({
      success: true,
      data: { settings: defaultSettings }
    });

  } catch (error) {
    logger.error('Get business settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/business
 * Update business settings
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

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Settings are required' } },
        { status: 400 }
      );
    }

    // Validate settings
    const validationResult = validateBusinessSettings(settings);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // In a real implementation, this would be stored in database
    // For now, we'll just log the settings
    logger.info('Updating business settings for user:', userId);
    logger.info('Settings:', JSON.stringify(settings, null, 2));

    // Update user's business settings in database
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     businessSettings: settings
    //   }
    // });

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Business settings updated successfully',
        settings
      }
    });

  } catch (error) {
    logger.error('Update business settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateBusinessSettings(settings: any): { valid: boolean; message?: string } {
  // Validate property info
  if (!settings.propertyInfo?.name || settings.propertyInfo.name.trim().length === 0) {
    return { valid: false, message: 'Property name is required' };
  }

  if (!settings.propertyInfo?.legalName || settings.propertyInfo.legalName.trim().length === 0) {
    return { valid: false, message: 'Legal name is required' };
  }

  // Validate address
  if (!settings.propertyInfo?.address?.city || settings.propertyInfo.address.city.trim().length === 0) {
    return { valid: false, message: 'City is required' };
  }

  if (!settings.propertyInfo?.address?.country || settings.propertyInfo.address.country.trim().length === 0) {
    return { valid: false, message: 'Country is required' };
  }

  // Validate contact
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!settings.propertyInfo?.contact?.email || !emailRegex.test(settings.propertyInfo.contact.email)) {
    return { valid: false, message: 'Valid email address is required' };
  }

  // Validate business hours
  if (!settings.businessHours?.checkIn?.start || !settings.businessHours?.checkIn?.end) {
    return { valid: false, message: 'Check-in times are required' };
  }

  if (!settings.businessHours?.checkOut?.start || !settings.businessHours?.checkOut?.end) {
    return { valid: false, message: 'Check-out times are required' };
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(settings.businessHours.checkIn.start) || !timeRegex.test(settings.businessHours.checkIn.end)) {
    return { valid: false, message: 'Invalid check-in time format' };
  }

  if (!timeRegex.test(settings.businessHours.checkOut.start) || !timeRegex.test(settings.businessHours.checkOut.end)) {
    return { valid: false, message: 'Invalid check-out time format' };
  }

  // Validate cancellation policy
  if (settings.policies?.cancellation) {
    const { freeCancellationDays, cancellationFee, noShowFee } = settings.policies.cancellation;
    
    if (freeCancellationDays < 0 || freeCancellationDays > 365) {
      return { valid: false, message: 'Free cancellation days must be between 0 and 365' };
    }

    if (cancellationFee < 0 || cancellationFee > 100) {
      return { valid: false, message: 'Cancellation fee must be between 0 and 100' };
    }

    if (noShowFee < 0 || noShowFee > 100) {
      return { valid: false, message: 'No-show fee must be between 0 and 100' };
    }
  }

  // Validate payment terms
  if (settings.policies?.payment) {
    const { depositPercentage, paymentDueDays } = settings.policies.payment;
    
    if (depositPercentage < 0 || depositPercentage > 100) {
      return { valid: false, message: 'Deposit percentage must be between 0 and 100' };
    }

    if (paymentDueDays < 0 || paymentDueDays > 365) {
      return { valid: false, message: 'Payment due days must be between 0 and 365' };
    }
  }

  // Validate tax settings
  if (settings.taxSettings?.vatEnabled) {
    const { vatRate } = settings.taxSettings;
    
    if (vatRate < 0 || vatRate > 100) {
      return { valid: false, message: 'VAT rate must be between 0 and 100' };
    }
  }

  // Validate localization
  const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
  if (!validCurrencies.includes(settings.localization?.defaultCurrency)) {
    return { valid: false, message: 'Invalid default currency' };
  }

  const validLanguages = ['sl', 'en', 'de', 'it', 'hr'];
  if (!validLanguages.includes(settings.localization?.defaultLanguage)) {
    return { valid: false, message: 'Invalid default language' };
  }

  const validTimezones = ['Europe/Ljubljana', 'Europe/Berlin', 'Europe/Paris', 'Europe/London', 'Europe/Rome', 'Europe/Zagreb'];
  if (!validTimezones.includes(settings.localization?.timezone)) {
    return { valid: false, message: 'Invalid timezone' };
  }

  return { valid: true };
}
}
