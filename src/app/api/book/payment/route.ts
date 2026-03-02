import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: "credit_card" | "paypal" | "bank_transfer";
  cardDetails?: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  language: string;
}

interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  paymentMethod: string;
  timestamp: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * POST /api/book/payment
 * Process payment for booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, amount, currency, paymentMethod, cardDetails, billingAddress, language = 'en' } = body;

    if (!bookingId || !amount || !currency || !paymentMethod || !billingAddress) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Missing required payment parameters' } },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than 0' } },
        { status: 400 }
      );
    }

    // Validate currency
    const supportedCurrencies = ['EUR', 'USD', 'GBP', 'CHF'];
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CURRENCY', message: 'Unsupported currency' } },
        { status: 400 }
      );
    }

    // Validate payment method
    const supportedMethods = ['credit_card', 'paypal', 'bank_transfer'];
    if (!supportedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PAYMENT_METHOD', message: 'Unsupported payment method' } },
        { status: 400 }
      );
    }

    // Validate billing address
    const requiredBillingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country', 'postalCode'];
    const missingBillingFields = requiredBillingFields.filter(field => !billingAddress[field]);
    
    if (missingBillingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BILLING_INFO', message: `Missing billing information: ${missingBillingFields.join(', ')}` } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingAddress.email)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Process payment based on method
    let paymentResponse: PaymentResponse;

    switch (paymentMethod) {
      case 'credit_card':
        if (!cardDetails) {
          return NextResponse.json(
            { success: false, error: { code: 'MISSING_CARD_DETAILS', message: 'Card details required for credit card payment' } },
            { status: 400 }
          );
        }
        paymentResponse = await processCreditCardPayment(bookingId, amount, currency, cardDetails, billingAddress);
        break;
      
      case 'paypal':
        paymentResponse = await processPayPalPayment(bookingId, amount, currency, billingAddress, language);
        break;
      
      case 'bank_transfer':
        paymentResponse = await processBankTransferPayment(bookingId, amount, currency, billingAddress);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PAYMENT_METHOD', message: 'Unsupported payment method' } },
          { status: 400 }
        );
    }

    // Log payment attempt
    await logPaymentAttempt(bookingId, paymentMethod, amount, currency, paymentResponse.success, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: paymentResponse
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Payment processing failed' } },
      { status: 500 }
    );
  }

async function processCreditCardPayment(bookingId: string, amount: number, currency: string, cardDetails: any, billingAddress: any): Promise<PaymentResponse> {
  // In real implementation, this would integrate with a payment gateway like Stripe, Adyen, etc.
  console.log('Processing credit card payment:', { bookingId, amount, currency });
  
  // Validate card details
  const cardNumber = cardDetails.number.replace(/\s/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      amount,
      currency,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      error: 'Invalid card number'
    };
  }

  // Validate expiry
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!expiryRegex.test(cardDetails.expiry)) {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      amount,
      currency,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      error: 'Invalid expiry date'
    };
  }

  // Validate CVC
  if (cardDetails.cvc.length < 3 || cardDetails.cvc.length > 4) {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      amount,
      currency,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      error: 'Invalid CVC'
    };
  }

  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Simulate success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      success: true,
      paymentId,
      status: 'completed',
      amount,
      currency,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      amount,
      currency,
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString(),
      error: 'Payment declined by bank'
    };
  }
}

async function processPayPalPayment(bookingId: string, amount: number, currency: string, billingAddress: any, language: string): Promise<PaymentResponse> {
  // In real implementation, this would integrate with PayPal API
  console.log('Processing PayPal payment:', { bookingId, amount, currency, language });
  
  // Create PayPal payment
  const paymentId = `paypal_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Generate PayPal redirect URL (in real implementation, this would be actual PayPal URL)
  const redirectUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=${paymentId}`;
  
  return {
    success: true,
    paymentId,
    status: 'pending',
    amount,
    currency,
    paymentMethod: 'paypal',
    timestamp: new Date().toISOString(),
    redirectUrl
  };
}

async function processBankTransferPayment(bookingId: string, amount: number, currency: string, billingAddress: any): Promise<PaymentResponse> {
  // In real implementation, this would generate bank transfer instructions
  console.log('Processing bank transfer payment:', { bookingId, amount, currency });
  
  const paymentId = `bank_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    success: true,
    paymentId,
    status: 'pending',
    amount,
    currency,
    paymentMethod: 'bank_transfer',
    timestamp: new Date().toISOString()
  };
}

async function logPaymentAttempt(bookingId: string, paymentMethod: string, amount: number, currency: string, success: boolean, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Payment attempt logged:', {
    bookingId,
    paymentMethod,
    amount,
    currency,
    success,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
