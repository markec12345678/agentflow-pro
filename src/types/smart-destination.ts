/**
 * FIWARE Smart Destination Data Models
 * 
 * Based on FIWARE Tourism Destination data models:
 * https://github.com/smart-data-models/dataModel.TourismDestinations
 * 
 * This provides standardized, EU-compliant data structures for:
 * - Tourism destinations
 * - Points of interest
 * - Events
 * - Weather conditions
 * 
 * License: FIWARE Open Data License
 * Version: 4.0.1
 */

// ============================================================================
// GEO TYPES (FIWARE Standard)
// ============================================================================

/**
 * GeoProperty - FIWARE standard for geographic locations
 * Uses GeoJSON format with [longitude, latitude]
 */
export interface GeoProperty {
  type: 'GeoProperty';
  value: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

/**
 * GeoProperty with optional altitude
 */
export interface GeoPropertyWithAltitude extends GeoProperty {
  value: GeoProperty['value'] & {
    altitude?: number;
  };
}

// ============================================================================
// PROPERTY TYPES (FIWARE Standard)
// ============================================================================

/**
 * Generic Property wrapper for FIWARE attributes
 * All FIWARE properties use this pattern
 */
export interface FIWAREProperty<T = string> {
  type: 'Property';
  value: T;
}

/**
 * Property with metadata (observedAt, providedBy, etc.)
 */
export interface FIWAREPropertyWithMeta<T = string> extends FIWAREProperty<T> {
  observedAt?: string; // ISO 8601 datetime
  providedBy?: string; // Entity ID of provider
  unitCode?: string; // UN/CEFACT unit code
}

/**
 * Multi-language property
 */
export interface LanguageProperty {
  type: 'LanguageProperty';
  value: {
    '@none'?: string;
    sl?: string; // Slovenian
    en?: string; // English
    de?: string; // German
    it?: string; // Italian
    hr?: string; // Croatian
    [key: string]: string | undefined;
  };
}

// ============================================================================
// TOURISM DESTINATION (Core Model)
// ============================================================================

/**
 * TourismDestination - FIWARE NGSI-LD standard
 * 
 * Represents a tourism destination (city, region, attraction, etc.)
 * Used for enriching Property data with standardized tourism information
 * 
 * @see https://github.com/smart-data-models/dataModel.TourismDestinations
 */
export interface TourismDestination {
  // Core FIWARE fields
  id: string;
  type: 'TourismDestination';
  
  // Required fields
  /** Name of the destination */
  name: FIWAREProperty<string>;
  
  /** Geographic location */
  location: GeoProperty;
  
  // Optional but recommended fields
  /** Destination category (beach, mountain, city, etc.) */
  category?: FIWAREProperty<string[]>;
  
  /** Description in multiple languages */
  description?: LanguageProperty;
  
  /** Web page with more information */
  url?: FIWAREProperty<string>;
  
  /** Image URL */
  image?: FIWAREProperty<string>;
  
  /** Thumbnail image URL */
  thumbnail?: FIWAREProperty<string>;
  
  /** Opening hours (ISO 8601 format) */
  openingHours?: FIWAREProperty<string>;
  
  /** Price range (€, €€, €€€, €€€€) */
  priceRange?: FIWAREProperty<'€' | '€€' | '€€€' | '€€€€'>;
  
  /** Average rating (0-5) */
  rating?: FIWAREProperty<number>;
  
  /** Number of reviews */
  reviewCount?: FIWAREProperty<number>;
  
  /** Contact information */
  contact?: FIWAREProperty<{
    type: 'ContactPoint';
    email?: string;
    phone?: string;
    url?: string;
  }>;
  
  /** Address */
  address?: FIWAREProperty<{
    type: 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressRegion?: string;
    addressCountry?: string;
  }>;
  
  /** Additional attributes */
  attributes?: FIWAREProperty<{
    /** Activities available */
    activities?: string[]; // ['swimming', 'hiking', 'skiing']
    
    /** Accessibility features */
    accessibility?: string[]; // ['wheelchair', 'elevator', 'parking']
    
    /** Seasonal availability */
    seasonality?: string[]; // ['summer', 'winter', 'year-round']
    
    /** Target audience */
    audience?: string[]; // ['family', 'couple', 'business', 'solo']
    
    /** Special features */
    features?: string[]; // ['wifi', 'parking', 'restaurant', 'pool']
  }>;
  
  /** Nearby destinations (references to other TourismDestination IDs) */
  nearbyDestinations?: FIWAREProperty<string[]>;
  
  /** Part of larger destination (e.g., Bled → Slovenia) */
  containedInPlace?: FIWAREProperty<string[]>;
  
  /** FIWARE context */
  '@context'?: string | string[];
}

// ============================================================================
// POINT OF INTEREST (POI)
// ============================================================================

/**
 * PointOfInterest - FIWARE NGSI-LD standard
 * 
 * Represents a specific point of interest within a destination
 * More granular than TourismDestination
 */
export interface PointOfInterest {
  id: string;
  type: 'PointOfInterest';
  
  // Required
  name: FIWAREProperty<string>;
  location: GeoProperty;
  
  // Optional
  category?: FIWAREProperty<string>; // 'museum', 'castle', 'park', etc.
  
  subcategory?: FIWAREProperty<string[]>;
  
  description?: LanguageProperty;
  
  url?: FIWAREProperty<string>;
  
  image?: FIWAREProperty<string>;
  
  openingHours?: FIWAREProperty<string>;
  
  priceRange?: FIWAREProperty<'€' | '€€' | '€€€' | '€€€€'>;
  
  rating?: FIWAREProperty<number>;
  
  reviewCount?: FIWAREProperty<number>;
  
  address?: FIWAREProperty<{
    type: 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressRegion?: string;
    addressCountry?: string;
  }>;
  
  attributes?: FIWAREProperty<{
    activities?: string[];
    accessibility?: string[];
    features?: string[];
  }>;
}

// ============================================================================
// EVENT MODEL
// ============================================================================

/**
 * Event - FIWARE NGSI-LD standard
 * 
 * Represents a tourism or cultural event
 */
export interface TourismEvent {
  id: string;
  type: 'Event';
  
  // Required
  name: FIWAREProperty<string>;
  startDate: FIWAREProperty<string>; // ISO 8601 datetime
  
  // Optional
  endDate?: FIWAREProperty<string>;
  
  location?: GeoProperty | FIWAREProperty<string>; // Geo or venue name
  
  description?: LanguageProperty;
  
  image?: FIWAREProperty<string>;
  
  url?: FIWAREProperty<string>;
  
  eventStatus?: FIWAREProperty<
    'EventScheduled' | 'EventRescheduled' | 'EventCancelled' | 'EventMovedOnline'
  >;
  
  eventAttendanceMode?: FIWAREProperty<
    'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode'
  >;
  
  organizer?: FIWAREProperty<{
    type: 'Organization' | 'Person';
    name: string;
    email?: string;
    phone?: string;
    url?: string;
  }>;
  
  performer?: FIWAREProperty<string>;
  
  audience?: FIWAREProperty<string[]>;
  
  price?: FIWAREProperty<{
    type: 'PriceSpecification';
    price: number;
    currency: string;
    priceValidUntil?: string;
  }>;
  
  maximumAttendeeCapacity?: FIWAREProperty<number>;
  
  remainingAttendeeCapacity?: FIWAREProperty<number>;
}

// ============================================================================
// WEATHER MODEL
// ============================================================================

/**
 * WeatherObservation - FIWARE NGSI-LD standard
 * 
 * Current weather conditions at a destination
 */
export interface WeatherObservation {
  id: string;
  type: 'WeatherObservation';
  
  // Required
  dateObserved: FIWAREProperty<string>; // ISO 8601 datetime
  location: GeoProperty;
  
  // Weather data
  temperature?: FIWAREPropertyWithMeta<number>; // °C
  
  feelsLike?: FIWAREPropertyWithMeta<number>; // °C
  
  humidity?: FIWAREPropertyWithMeta<number>; // %
  
  pressure?: FIWAREPropertyWithMeta<number>; // hPa
  
  windSpeed?: FIWAREPropertyWithMeta<number>; // m/s
  
  windDirection?: FIWAREPropertyWithMeta<number>; // Degrees
  
  precipitation?: FIWAREPropertyWithMeta<number>; // mm
  
  cloudiness?: FIWAREPropertyWithMeta<number>; // %
  
  weatherCondition?: FIWAREProperty<string>; // 'sunny', 'cloudy', 'rainy', etc.
  
  visibility?: FIWAREPropertyWithMeta<number>; // meters
  
  uvIndex?: FIWAREPropertyWithMeta<number>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a GeoProperty from lat/lng
 */
export function createGeoProperty(
  latitude: number,
  longitude: number
): GeoProperty {
  return {
    type: 'GeoProperty',
    value: {
      type: 'Point',
      coordinates: [longitude, latitude] // FIWARE uses [lng, lat] order!
    }
  };
}

/**
 * Create a TourismDestination with minimal required fields
 */
export function createTourismDestination(
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  options?: Partial<TourismDestination>
): TourismDestination {
  return {
    id,
    type: 'TourismDestination',
    name: { type: 'Property', value: name },
    location: createGeoProperty(latitude, longitude),
    ...options
  };
}

/**
 * Create a PointOfInterest
 */
export function createPointOfInterest(
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  category: string,
  options?: Partial<PointOfInterest>
): PointOfInterest {
  return {
    id,
    type: 'PointOfInterest',
    name: { type: 'Property', value: name },
    location: createGeoProperty(latitude, longitude),
    category: { type: 'Property', value: category },
    ...options
  };
}

/**
 * Create a TourismEvent
 */
export function createTourismEvent(
  id: string,
  name: string,
  startDate: string,
  latitude: number,
  longitude: number,
  options?: Partial<TourismEvent>
): TourismEvent {
  return {
    id,
    type: 'Event',
    name: { type: 'Property', value: name },
    startDate: { type: 'Property', value: startDate },
    location: createGeoProperty(latitude, longitude),
    ...options
  };
}

/**
 * Validate if an object is a valid TourismDestination
 */
export function isTourismDestination(obj: unknown): obj is TourismDestination {
  if (!obj || typeof obj !== 'object') return false;
  const dest = obj as Record<string, unknown>;
  
  return (
    dest.type === 'TourismDestination' &&
    typeof dest.id === 'string' &&
    typeof dest.name === 'object' &&
    typeof dest.location === 'object'
  );
}

/**
 * Convert TourismDestination to display format
 */
export function formatTourismDestination(dest: TourismDestination): {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string[];
  description?: string;
  rating?: number;
  url?: string;
} {
  return {
    id: dest.id,
    name: typeof dest.name === 'object' ? dest.name.value : dest.name,
    latitude: dest.location.value.coordinates[1],
    longitude: dest.location.value.coordinates[0],
    category: dest.category?.value,
    description: dest.description?.value?.['@none'] || dest.description?.value?.['en'],
    rating: dest.rating?.value,
    url: dest.url?.value
  };
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Extract value from FIWARE Property
 */
export function unwrapProperty<T>(property: FIWAREProperty<T> | T | undefined): T | undefined {
  if (!property) return undefined;
  if (typeof property === 'object' && 'type' in property && property.type === 'Property') {
    return (property as FIWAREProperty<T>).value;
  }
  return property as T;
}

/**
 * Extract value from LanguageProperty
 */
export function unwrapLanguageProperty(
  property: LanguageProperty | undefined,
  preferredLang: string = 'en'
): string | undefined {
  if (!property?.value) return undefined;
  return property.value[preferredLang] || property.value['@none'];
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  GeoProperty,
  GeoPropertyWithAltitude,
  FIWAREProperty,
  FIWAREPropertyWithMeta,
  LanguageProperty,
  TourismDestination,
  PointOfInterest,
  TourismEvent,
  WeatherObservation
};

export {
  createGeoProperty,
  createTourismDestination,
  createPointOfInterest,
  createTourismEvent,
  isTourismDestination,
  formatTourismDestination,
  unwrapProperty,
  unwrapLanguageProperty
};
