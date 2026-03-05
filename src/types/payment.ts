/**
 * Global Payment Types for AgentFlow Pro
 * Standardizes all payment-related operations across the application
 */

// Payment method types
export type PaymentMethod = 
  | 'credit_card'
  | 'debit_card' 
  | 'bank_transfer'
  | 'paypal'
  | 'stripe'
  | 'cash'
  | 'other';

// Payment status types
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// Payment select component props
export interface PaymentSelectProps {
  value?: PaymentMethod | null;
  onChange: (method: PaymentMethod | null) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Payment data interface
export interface PaymentData {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  currency: string;
  createdAt: Date;
  updatedAt?: Date;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Payment form data
export interface PaymentFormData {
  method: PaymentMethod | null;
  amount: string;
  description?: string;
  saveMethod?: boolean;
}

// Payment select options
export const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
  icon?: string;
  description?: string;
}> = [
  { value: 'credit_card', label: 'Kreditna kartica', description: 'Plačilo s kreditno kartico' },
  { value: 'debit_card', label: 'Debitna kartica', description: 'Plačilo z debetno kartico' },
  { value: 'bank_transfer', label: 'Bančno nakazilo', description: 'Plačilo preko banke' },
  { value: 'paypal', label: 'PayPal', description: 'Plačilo preko PayPal' },
  { value: 'stripe', label: 'Stripe', description: 'Plačilo preko Stripe' },
  { value: 'cash', label: 'Gotovina', description: 'Plačilo z gotovino' },
  { value: 'other', label: 'Drugo', description: 'Druga plačilna metoda' }
];

// Helper functions for payment validation
export const validatePaymentMethod = (method: PaymentMethod | null): boolean => {
  return method !== null && method !== undefined;
};

export const getPaymentMethodLabel = (method: PaymentMethod | null | undefined): string => {
  if (!method) return '';
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
};

export const isPaymentCompleted = (status: PaymentStatus): boolean => {
  return status === 'completed';
};
