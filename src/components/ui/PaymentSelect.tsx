"use client";

import React from 'react';
import { PaymentMethod, PaymentSelectProps, PAYMENT_METHODS, validatePaymentMethod } from '@/types/payment';

// Simple counter for generating unique IDs
let paymentSelectCounter = 0;

/**
 * Standardized PaymentSelect Component
 * Provides consistent payment method selection across the application
 */
export default function PaymentSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = "Izberite plačilno metodo",
  className = "",
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy
}: PaymentSelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value as PaymentMethod | null;
    onChange(newValue === "" ? null : newValue);
  };

  // Generate stable ID using counter
  const selectId = id || `payment-select-${++paymentSelectCounter}`;
  const selectAriaLabel = ariaLabel || "Izberite plačilno metodo";
  const isValid = validatePaymentMethod(value);

  return (
    <select
      id={selectId}
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      className={`
        w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `.trim()}
      aria-label={selectAriaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={isValid ? false : true}
      aria-required={required}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {PAYMENT_METHODS.map((method) => (
        <option
          key={method.value}
          value={method.value}
          disabled={disabled}
        >
          {method.label}
        </option>
      ))}
    </select>
  );
}

// Export component with display name for debugging
PaymentSelect.displayName = 'PaymentSelect';
