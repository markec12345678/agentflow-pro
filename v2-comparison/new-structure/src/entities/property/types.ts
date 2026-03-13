/**
 * Property Entity - Domain Definition
 * 
 * This is the single source of truth for Property domain types.
 * Used across: database, API, UI, validation schemas
 */

/**
 * Property types enumeration
 */
export type PropertyType = 'apartment' | 'house' | 'room' | 'villa' | 'studio';

/**
 * Property status enumeration
 */
export type PropertyStatus = 'active' | 'inactive' | 'maintenance' | 'archived';

/**
 * Main Property entity interface
 */
export interface Property {
  /** Unique identifier */
  id: string;
  
  /** Property name/title */
  name: string;
  
  /** Type of property */
  type: PropertyType;
  
  /** Full address */
  address: string;
  
  /** City location */
  city: string;
  
  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
  
  /** Postal code */
  postalCode: string;
  
  /** Geographic coordinates */
  coordinates: {
    latitude: number;
    longitude: number;
  };
  
  /** Price per night in EUR */
  pricePerNight: number;
  
  /** Cleaning fee in EUR */
  cleaningFee?: number;
  
  /** Number of guests allowed */
  maxGuests: number;
  
  /** Number of bedrooms */
  bedrooms: number;
  
  /** Number of bathrooms */
  bathrooms: number;
  
  /** Square meters */
  area: number;
  
  /** List of amenity IDs */
  amenities: string[];
  
  /** Property description (markdown) */
  description: string;
  
  /** Array of image URLs */
  images: string[];
  
  /** Current status */
  status: PropertyStatus;
  
  /** Owner user ID */
  ownerId: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Last booking timestamp */
  lastBookedAt?: Date;
}

/**
 * Property summary for list views (lighter version)
 */
export interface PropertySummary {
  id: string;
  name: string;
  type: PropertyType;
  city: string;
  country: string;
  pricePerNight: number;
  images: string[];
  rating?: number;
  reviewCount: number;
}

/**
 * Property with availability info
 */
export interface PropertyWithAvailability extends Property {
  availableFrom: Date;
  availableTo: Date;
  isAvailable: boolean;
}

/**
 * Property creation input (API)
 */
export interface PropertyCreateInput {
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  pricePerNight: number;
  cleaningFee?: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  description: string;
  images?: string[];
}

/**
 * Property update input (API) - all fields optional
 */
export type PropertyUpdateInput = Partial<PropertyCreateInput> & {
  status?: PropertyStatus;
};

/**
 * Property filters (for search/list)
 */
export interface PropertyFilters {
  type?: PropertyType[];
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minGuests?: number;
  amenities?: string[];
  status?: PropertyStatus;
  availableFrom?: Date;
  availableTo?: Date;
}

/**
 * Property sorting options
 */
export type PropertySortField = 'pricePerNight' | 'name' | 'createdAt' | 'rating' | 'lastBookedAt';
export type PropertySortOrder = 'asc' | 'desc';

export interface PropertySort {
  field: PropertySortField;
  order: PropertySortOrder;
}

/**
 * Pagination response
 */
export interface PropertyListResponse {
  data: PropertySummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
