/**
 * FIWARE Smart Destination Helpers
 * 
 * Utility functions for working with FIWARE TourismDestination models
 * in AgentFlow Pro
 */

import type { Property } from '@prisma/client';
import type { TourismDestination, PointOfInterest, TourismEvent } from '@/types/smart-destination';
import {
  createTourismDestination,
  createPointOfInterest,
  createTourismEvent,
  formatTourismDestination,
  unwrapProperty,
  unwrapLanguageProperty
} from '@/types/smart-destination';

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert Prisma Property to FIWARE TourismDestination
 */
export function propertyToTourismDestination(
  property: Property
): TourismDestination {
  return createTourismDestination(
    `property-${property.id}`,
    property.name,
    property.lat || 0,
    property.lng || 0,
    {
      category: {
        type: 'Property',
        value: [property.type || 'accommodation']
      },
      description: property.description ? {
        type: 'LanguageProperty',
        value: {
          '@none': property.description,
          'en': property.description // Could be enhanced with translations
        }
      } : undefined,
      priceRange: mapPriceRange(property.rentLow),
      rating: property.reviewScore ? {
        type: 'Property',
        value: Math.min(5, Math.max(0, property.reviewScore))
      } : undefined,
      reviewCount: property.reviewCount ? {
        type: 'Property',
        value: property.reviewCount
      } : undefined,
      address: {
        type: 'Property',
        value: {
          type: 'PostalAddress',
          streetAddress: property.street || undefined,
          addressLocality: property.city || undefined,
          postalCode: property.zip || undefined,
          addressCountry: property.country || 'SI'
        }
      },
      attributes: {
        type: 'Property',
        value: {
          activities: [], // Could be extracted from amenities
          accessibility: mapAccessibility(property.amenities),
          seasonality: ['year-round'],
          features: mapFeatures(property.amenities)
        }
      }
    }
  );
}

/**
 * Convert FIWARE TourismDestination to Prisma-compatible JSON
 */
export function tourismDestinationToJson(
  destination: TourismDestination
): any {
  return {
    id: destination.id,
    type: destination.type,
    name: unwrapProperty(destination.name),
    location: destination.location,
    category: unwrapProperty(destination.category),
    description: destination.description ? {
      '@none': unwrapLanguageProperty(destination.description, '@none'),
      'en': unwrapLanguageProperty(destination.description, 'en'),
      'sl': unwrapLanguageProperty(destination.description, 'sl'),
      'de': unwrapLanguageProperty(destination.description, 'de'),
      'it': unwrapLanguageProperty(destination.description, 'it'),
    } : undefined,
    url: unwrapProperty(destination.url),
    image: unwrapProperty(destination.image),
    openingHours: unwrapProperty(destination.openingHours),
    priceRange: unwrapProperty(destination.priceRange),
    rating: unwrapProperty(destination.rating),
    reviewCount: unwrapProperty(destination.reviewCount),
    contact: unwrapProperty(destination.contact),
    address: unwrapProperty(destination.address),
    attributes: unwrapProperty(destination.attributes),
    nearbyDestinations: unwrapProperty(destination.nearbyDestinations),
    containedInPlace: unwrapProperty(destination.containedInPlace),
  };
}

/**
 * Convert FIWARE PointOfInterest to JSON
 */
export function pointOfInterestToJson(poi: PointOfInterest): any {
  return {
    id: poi.id,
    type: poi.type,
    name: unwrapProperty(poi.name),
    location: poi.location,
    category: unwrapProperty(poi.category),
    subcategory: unwrapProperty(poi.subcategory),
    description: poi.description ? {
      '@none': unwrapLanguageProperty(poi.description, '@none'),
      'en': unwrapLanguageProperty(poi.description, 'en'),
    } : undefined,
    url: unwrapProperty(poi.url),
    image: unwrapProperty(poi.image),
    openingHours: unwrapProperty(poi.openingHours),
    priceRange: unwrapProperty(poi.priceRange),
    rating: unwrapProperty(poi.rating),
    reviewCount: unwrapProperty(poi.reviewCount),
    attributes: unwrapProperty(poi.attributes),
  };
}

/**
 * Convert FIWARE TourismEvent to JSON
 */
export function tourismEventToJson(event: TourismEvent): any {
  return {
    id: event.id,
    type: event.type,
    name: unwrapProperty(event.name),
    startDate: unwrapProperty(event.startDate),
    endDate: unwrapProperty(event.endDate),
    location: event.location,
    description: event.description ? {
      '@none': unwrapLanguageProperty(event.description, '@none'),
      'en': unwrapLanguageProperty(event.description, 'en'),
    } : undefined,
    image: unwrapProperty(event.image),
    url: unwrapProperty(event.url),
    eventStatus: unwrapProperty(event.eventStatus),
    eventAttendanceMode: unwrapProperty(event.eventAttendanceMode),
    organizer: unwrapProperty(event.organizer),
    performer: unwrapProperty(event.performer),
    audience: unwrapProperty(event.audience),
    price: unwrapProperty(event.price),
    maximumAttendeeCapacity: unwrapProperty(event.maximumAttendeeCapacity),
    remainingAttendeeCapacity: unwrapProperty(event.remainingAttendeeCapacity),
  };
}

// ============================================================================
// MAPPING HELPERS
// ============================================================================

/**
 * Map price to FIWARE price range (€, €€, €€€, €€€€)
 */
function mapPriceRange(price?: number | null): { type: 'Property'; value: '€' | '€€' | '€€€' | '€€€€' } | undefined {
  if (!price) return undefined;
  
  if (price < 50) return { type: 'Property', value: '€' };
  if (price < 100) return { type: 'Property', value: '€€' };
  if (price < 200) return { type: 'Property', value: '€€€' };
  return { type: 'Property', value: '€€€€' };
}

/**
 * Map amenities to accessibility features
 */
function mapAccessibility(amenities: any[]): string[] {
  const accessibility: string[] = [];
  
  if (!amenities) return accessibility;
  
  const amenityNames = amenities.map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
  
  if (amenityNames.some(n => n.toLowerCase().includes('wheelchair'))) {
    accessibility.push('wheelchair');
  }
  if (amenityNames.some(n => n.toLowerCase().includes('elevator'))) {
    accessibility.push('elevator');
  }
  if (amenityNames.some(n => n.toLowerCase().includes('parking'))) {
    accessibility.push('parking');
  }
  if (amenityNames.some(n => n.toLowerCase().includes('ramp'))) {
    accessibility.push('ramp');
  }
  
  return accessibility;
}

/**
 * Map amenities to features
 */
function mapFeatures(amenities: any[]): string[] {
  if (!amenities) return [];
  
  return amenities
    .map(a => typeof a === 'string' ? a : a.name)
    .filter(Boolean);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate FIWARE TourismDestination schema
 */
export function validateTourismDestination(
  data: unknown
): data is TourismDestination {
  if (!data || typeof data !== 'object') return false;
  
  const dest = data as Record<string, unknown>;
  
  // Required fields
  if (dest.type !== 'TourismDestination') return false;
  if (typeof dest.id !== 'string') return false;
  if (!dest.name || typeof dest.name !== 'object') return false;
  if (!dest.location || typeof dest.location !== 'object') return false;
  
  // Validate location
  const location = dest.location as Record<string, unknown>;
  if (location.type !== 'GeoProperty') return false;
  if (!location.value || typeof location.value !== 'object') return false;
  
  const value = location.value as Record<string, unknown>;
  if (value.type !== 'Point') return false;
  if (!Array.isArray(value.coordinates) || value.coordinates.length !== 2) return false;
  
  return true;
}

/**
 * Validate FIWARE PointOfInterest schema
 */
export function validatePointOfInterest(
  data: unknown
): data is PointOfInterest {
  if (!data || typeof data !== 'object') return false;
  
  const poi = data as Record<string, unknown>;
  
  if (poi.type !== 'PointOfInterest') return false;
  if (typeof poi.id !== 'string') return false;
  if (!poi.name || typeof poi.name !== 'object') return false;
  if (!poi.location || typeof poi.location !== 'object') return false;
  
  return true;
}

/**
 * Validate FIWARE TourismEvent schema
 */
export function validateTourismEvent(
  data: unknown
): data is TourismEvent {
  if (!data || typeof data !== 'object') return false;
  
  const event = data as Record<string, unknown>;
  
  if (event.type !== 'Event') return false;
  if (typeof event.id !== 'string') return false;
  if (!event.name || typeof event.name !== 'object') return false;
  if (!event.startDate || typeof event.startDate !== 'object') return false;
  
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  propertyToTourismDestination,
  tourismDestinationToJson,
  pointOfInterestToJson,
  tourismEventToJson,
  validateTourismDestination,
  validatePointOfInterest,
  validateTourismEvent
};
