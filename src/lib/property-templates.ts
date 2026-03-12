/**
 * Property Setup Templates
 * 
 * Pre-made templates for different property types
 * Users can select a template during onboarding to auto-fill settings
 */

export interface PropertyTemplate {
  id: string;
  name: string;
  type: 'hotel' | 'kamp' | 'kmetija' | 'apartma' | 'guesthouse';
  icon: string;
  description: string;
  defaultData: PropertyDefaultData;
  popular: boolean;
}

export interface PropertyDefaultData {
  roomTypes: Array<{
    type: string;
    count: number;
    price: number;
    capacity: number;
    amenities: string[];
  }>;
  amenities: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  services: string[];
  suggestedEmails: string[];
}

/**
 * Pre-made property templates
 */
export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    id: 'hotel-boutique',
    name: 'Boutique Hotel',
    type: 'hotel',
    icon: '🏨',
    description: 'Manjši hotel z osebnim pridihom (10-30 sob)',
    popular: true,
    defaultData: {
      roomTypes: [
        {
          type: 'Double Room',
          count: 8,
          price: 85,
          capacity: 2,
          amenities: ['WiFi', 'TV', 'Mini bar', 'Safe'],
        },
        {
          type: 'Suite',
          count: 4,
          price: 150,
          capacity: 4,
          amenities: ['WiFi', 'TV', 'Mini bar', 'Safe', 'Jacuzzi', 'Balcony'],
        },
      ],
      amenities: [
        'WiFi',
        'Parking',
        'Breakfast',
        'Restaurant',
        'Bar',
        '24h Reception',
        'Room Service',
        'Laundry',
      ],
      policies: {
        checkIn: '14:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation up to 48h before check-in',
      },
      services: [
        'Airport shuttle',
        'Tour desk',
        'Luggage storage',
        'Concierge',
      ],
      suggestedEmails: [
        'Pre-arrival email with directions',
        'Welcome email with WiFi password',
        'Check-out email with invoice',
      ],
    },
  },
  {
    id: 'kamp-standard',
    name: 'Kamp',
    type: 'kamp',
    icon: '⛺',
    description: 'Kamping z parcelami in mobilnimi hišicami',
    popular: true,
    defaultData: {
      roomTypes: [
        {
          type: 'Parcela Standard',
          count: 20,
          price: 35,
          capacity: 4,
          amenities: ['Electricity', 'Water', 'Sewage'],
        },
        {
          type: 'Mobilna Hišica',
          count: 10,
          price: 80,
          capacity: 6,
          amenities: ['Kitchen', 'Bathroom', 'WiFi', 'TV', 'Terrace'],
        },
      ],
      amenities: [
        'WiFi',
        'Parking',
        'Swimming Pool',
        'Restaurant',
        'Market',
        'Playground',
        'Bike Rental',
        'Boat Rental',
      ],
      policies: {
        checkIn: '13:00',
        checkOut: '10:00',
        cancellation: 'Free cancellation up to 7 days before arrival',
      },
      services: [
        'Bike rental',
        'Boat rental',
        'Tour booking',
        'Grocery delivery',
      ],
      suggestedEmails: [
        'Pre-arrival email with camp rules',
        'Welcome email with map and facilities',
        'Activity suggestions email',
      ],
    },
  },
  {
    id: 'kmetija-turisticna',
    name: 'Turistična Kmetija',
    type: 'kmetija',
    icon: '🏡',
    description: 'Avtentična kmetija z doživetji in lokalno hrano',
    popular: false,
    defaultData: {
      roomTypes: [
        {
          type: 'Dvojna Soba',
          count: 5,
          price: 70,
          capacity: 2,
          amenities: ['WiFi', 'TV', 'Private Bathroom'],
        },
        {
          type: 'Apartma',
          count: 3,
          price: 120,
          capacity: 4,
          amenities: ['WiFi', 'TV', 'Kitchen', 'Terrace', 'Fireplace'],
        },
      ],
      amenities: [
        'WiFi',
        'Parking',
        'Breakfast',
        'Restaurant',
        'Wine Tasting',
        'Horse Riding',
        'Bike Rental',
        'Farm Tours',
      ],
      policies: {
        checkIn: '15:00',
        checkOut: '10:00',
        cancellation: 'Free cancellation up to 5 days before arrival',
      },
      services: [
        'Wine tasting',
        'Horse riding',
        'Farm tours',
        'Cooking classes',
        'Bike rental',
      ],
      suggestedEmails: [
        'Pre-arrival email with activity options',
        'Welcome email with farm history',
        'Wine tasting booking confirmation',
      ],
    },
  },
  {
    id: 'apartma-standard',
    name: 'Apartma',
    type: 'apartma',
    icon: '🏠',
    description: 'Samostojen apartma za počitnike',
    popular: true,
    defaultData: {
      roomTypes: [
        {
          type: '1-Bedroom Apartment',
          count: 1,
          price: 75,
          capacity: 4,
          amenities: ['WiFi', 'TV', 'Kitchen', 'Washing Machine', 'Balcony'],
        },
      ],
      amenities: [
        'WiFi',
        'Parking',
        'Kitchen',
        'Washing Machine',
        'Air Conditioning',
        'Balcony',
      ],
      policies: {
        checkIn: '15:00',
        checkOut: '10:00',
        cancellation: 'Free cancellation up to 3 days before check-in',
      },
      services: ['Self check-in', 'Airport shuttle (on request)'],
      suggestedEmails: [
        'Pre-arrival email with check-in instructions',
        'Welcome email with WiFi and appliance instructions',
        'Check-out email with simple instructions',
      ],
    },
  },
  {
    id: 'guesthouse-pansion',
    name: 'Gostišče / Penzion',
    type: 'guesthouse',
    icon: '🏢',
    description: 'Družinsko gostišče s sobami in restavracijo',
    popular: false,
    defaultData: {
      roomTypes: [
        {
          type: 'Single Room',
          count: 4,
          price: 55,
          capacity: 1,
          amenities: ['WiFi', 'TV', 'Private Bathroom'],
        },
        {
          type: 'Double Room',
          count: 8,
          price: 80,
          capacity: 2,
          amenities: ['WiFi', 'TV', 'Private Bathroom', 'Mini Bar'],
        },
      ],
      amenities: [
        'WiFi',
        'Parking',
        'Breakfast',
        'Restaurant',
        'Bar',
        'Garden',
        'Terrace',
      ],
      policies: {
        checkIn: '14:00',
        checkOut: '10:00',
        cancellation: 'Free cancellation up to 48h before check-in',
      },
      services: ['Restaurant', 'Bar', 'Tour desk', 'Luggage storage'],
      suggestedEmails: [
        'Pre-arrival email with restaurant menu',
        'Welcome email with local tips',
        'Check-out email with invoice',
      ],
    },
  },
];

/**
 * Get template by ID
 */
export function getPropertyTemplate(templateId: string): PropertyTemplate | undefined {
  return PROPERTY_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get templates by property type
 */
export function getTemplatesByType(type: PropertyTemplate['type']): PropertyTemplate[] {
  return PROPERTY_TEMPLATES.filter(t => t.type === type);
}

/**
 * Get popular templates
 */
export function getPopularTemplates(): PropertyTemplate[] {
  return PROPERTY_TEMPLATES.filter(t => t.popular);
}

/**
 * Merge AI-extracted data with template defaults
 */
export function mergeWithTemplate(
  extractedData: any,
  templateId?: string
): any {
  if (!templateId) return extractedData;

  const template = getPropertyTemplate(templateId);
  if (!template) return extractedData;

  // Merge extracted data with template defaults
  return {
    ...extractedData,
    ...template.defaultData,
    // Override with extracted data where available
    propertyName: extractedData.propertyName || template.defaultData.roomTypes[0].type,
    propertyType: extractedData.propertyType || template.type,
    roomCount: extractedData.roomCount || template.defaultData.roomTypes.reduce((sum, rt) => sum + rt.count, 0),
  };
}
