/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Class name utility
 * Combines clsx with tailwind-merge for optimal class merging
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('sl-SI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Format date range
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return new Intl.DateTimeFormat('sl-SI', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).formatRange(startDate, endDate);
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
