/**
 * Shared API Client
 * 
 * Base HTTP client with authentication, error handling, and retries.
 */

import { ApiError } from '@/features/properties/api/propertyApi';

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * Base API client
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>(url, { ...config, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>(url, { ...config, method: 'DELETE' });
  }
};

/**
 * Base request function with retries
 */
async function request<T>(url: string, config: RequestConfig): Promise<T> {
  const { 
    timeout = 30000, 
    retries = 0,
    headers = {},
    ...fetchConfig 
  } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry logic
    if (retries > 0 && isRetryableError(error)) {
      await delay(1000);
      return request<T>(url, { ...config, retries: retries - 1 });
    }

    throw error;
  }
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true; // Network error
  }
  if (error instanceof ApiError && error.status >= 500) {
    return true; // Server error
  }
  return false;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ApiError extension for fromResponse static method
 */
declare class ApiErrorWithFromResponse extends ApiError {
  static async fromResponse(response: Response): Promise<ApiErrorWithFromResponse>;
}
