/**
 * Property API Client
 * 
 * Centralized API client for all property operations.
 * Handles: HTTP requests, error transformation, response parsing
 */

import type { 
  Property, 
  PropertyCreateInput, 
  PropertyUpdateInput,
  PropertyFilters,
  PropertyListResponse 
} from '@/entities/property/types';

/**
 * Property API endpoints
 */
export const propertyApi = {
  /**
   * Get all properties with optional filters
   */
  getAll: async (filters?: PropertyFilters): Promise<PropertyListResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`/api/v1/properties?${params}`);
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return response.json();
  },

  /**
   * Get property by ID
   */
  getById: async (id: string): Promise<Property> => {
    const response = await fetch(`/api/v1/properties/${id}`);
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return response.json();
  },

  /**
   * Create new property
   */
  create: async (data: PropertyCreateInput): Promise<Property> => {
    const response = await fetch('/api/v1/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return response.json();
  },

  /**
   * Update existing property
   */
  update: async (id: string, data: PropertyUpdateInput): Promise<Property> => {
    const response = await fetch(`/api/v1/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    return response.json();
  },

  /**
   * Delete property
   */
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/v1/properties/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
  },

  /**
   * Upload property images
   */
  uploadImages: async (id: string, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await fetch(`/api/v1/properties/${id}/images`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
    
    const data = await response.json();
    return data.urls;
  },

  /**
   * Delete property image
   */
  deleteImage: async (propertyId: string, imageUrl: string): Promise<void> => {
    const response = await fetch(
      `/api/v1/properties/${propertyId}/images?url=${encodeURIComponent(imageUrl)}`,
      { method: 'DELETE' }
    );
    
    if (!response.ok) {
      throw await handleApiError(response);
    }
  }
};

/**
 * Handle API errors
 */
async function handleApiError(response: Response): Promise<Error> {
  try {
    const error = await response.json();
    return new ApiError(error.message, response.status, error.code);
  } catch {
    return new ApiError('An unexpected error occurred', response.status);
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
