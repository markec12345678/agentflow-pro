import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface PaymentMethod {
  id: string;
  type: "credit_card" | "bank_account" | "paypal";
  details: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
    paypalEmail?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cardholderName?: string;
  };
  isDefault: boolean;
  createdAt: string;
  status: "active" | "inactive";
  billingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
}

/**
 * GET /api/payments/methods
 * Get all payment methods
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

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Get payment methods (in real implementation, this would fetch from database)
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: "pm_1",
        type: "credit_card",
        details: {
          last4: "4242",
          brand: "Visa",
          expiryMonth: 12,
          expiryYear: 2025,
          cardholderName: "John Doe"
        },
        isDefault: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        billingAddress: {
          street: "Main Street 123",
          city: "Ljubljana",
          country: "Slovenia",
          postalCode: "1000"
        }
      },
      {
        id: "pm_2",
        type: "bank_account",
        details: {
          bankName: "NLB d.d.",
          accountNumber: "SI56 1234 5678 9012 345",
          cardholderName: "John Doe"
        },
        isDefault: false,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        billingAddress: {
          street: "Main Street 123",
          city: "Ljubljana",
          country: "Slovenia",
          postalCode: "1000"
        }
      },
      {
        id: "pm_3",
        type: "credit_card",
        details: {
          last4: "5555",
          brand: "Mastercard",
          expiryMonth: 8,
          expiryYear: 2024,
          cardholderName: "John Doe"
        },
        isDefault: false,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: "inactive"
      },
      {
        id: "pm_4",
        type: "paypal",
        details: {
          paypalEmail: "john.doe@email.com",
          cardholderName: "John Doe"
        },
        isDefault: false,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active"
      }
    ];

    // Apply filters
    let filteredMethods = mockPaymentMethods;
    
    if (type) {
      filteredMethods = filteredMethods.filter(method => method.type === type);
    }
    
    if (status) {
      filteredMethods = filteredMethods.filter(method => method.status === status);
    }

    return NextResponse.json({
      success: true,
      data: { paymentMethods: filteredMethods }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/methods
 * Add a new payment method
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

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, details, billingAddress, isDefault = false } = body;

    if (!type || !details) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Type and details are required' } },
        { status: 400 }
      );
    }

    // Validate payment method type
    const validTypes = ["credit_card", "bank_account", "paypal"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid payment method type' } },
        { status: 400 }
      );
    }

    // Validate details based on type
    const validationResult = validatePaymentMethodDetails(type, details);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Create payment method (in real implementation)
    const newPaymentMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type,
      details,
      isDefault,
      createdAt: new Date().toISOString(),
      status: "active",
      billingAddress
    };

    console.log('Created payment method:', newPaymentMethod);

    // Log activity
    await logActivity(userId, "Payment Method Added", `Added ${type} payment method`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Payment method added successfully',
        paymentMethod: newPaymentMethod
      }
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validatePaymentMethodDetails(type: string, details: any): { valid: boolean; message?: string } {
  switch (type) {
    case "credit_card":
      if (!details.last4 || !details.brand || !details.expiryMonth || !details.expiryYear) {
        return { valid: false, message: 'Credit card requires last4, brand, expiryMonth, and expiryYear' };
      }
      
      if (!/^\d{4}$/.test(details.last4)) {
        return { valid: false, message: 'Last4 must be 4 digits' };
      }
      
      const validBrands = ["Visa", "Mastercard", "American Express", "Discover"];
      if (!validBrands.includes(details.brand)) {
        return { valid: false, message: 'Invalid card brand' };
      }
      
      if (details.expiryMonth < 1 || details.expiryMonth > 12) {
        return { valid: false, message: 'Invalid expiry month' };
      }
      
      const currentYear = new Date().getFullYear();
      if (details.expiryYear < currentYear || details.expiryYear > currentYear + 10) {
        return { valid: false, message: 'Invalid expiry year' };
      }
      
      break;
      
    case "bank_account":
      if (!details.bankName || !details.accountNumber) {
        return { valid: false, message: 'Bank account requires bankName and accountNumber' };
      }
      
      // Basic IBAN validation (simplified)
      if (!/^[A-Z]{2}\d{2}[A-Z\d]{4}\d{10}$/.test(details.accountNumber.replace(/\s/g, ''))) {
        return { valid: false, message: 'Invalid account number format' };
      }
      
      break;
      
    case "paypal":
      if (!details.paypalEmail) {
        return { valid: false, message: 'PayPal requires paypalEmail' };
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(details.paypalEmail)) {
        return { valid: false, message: 'Invalid PayPal email format' };
      }
      
      break;
      
    default:
      return { valid: false, message: 'Unknown payment method type' };
  }
  
  return { valid: true };
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
