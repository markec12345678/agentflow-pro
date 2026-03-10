/**
 * Example: Using OpenTravelData in Communication Agent
 * 
 * This shows how to integrate attraction recommendations
 * into your guest communication workflow.
 */

import { openTravelData } from '@/lib/integrations/opentraveldata';

interface Property {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  country_code: string;
}

interface Guest {
  id: string;
  name: string;
  email: string;
  checkIn: Date;
  checkOut: Date;
}

interface AttractionEmail {
  to: string;
  subject: string;
  template: string;
  data: {
    guest_name: string;
    property_name: string;
    city: string;
    attractions: Array<{
      name: string;
      type: string;
      distance_km: number;
    }>;
    nearest_airport?: {
      name: string;
      iata_code: string;
      distance_km: number;
    };
  };
}

/**
 * Generate personalized attraction recommendations for guest
 */
export async function generateAttractionRecommendations(
  property: Property,
  guest: Guest
): Promise<AttractionEmail> {
  // Get nearby attractions
  const attractions = await openTravelData.getNearbyAttractions(
    property.latitude,
    property.longitude,
    10,  // 10km radius
    10   // Top 10
  );

  // Get nearest airport
  const airport = await openTravelData.getNearestAirport(
    property.latitude,
    property.longitude,
    property.country_code
  );

  // Prepare email
  return {
    to: guest.email,
    subject: `Discover ${property.city}: Top 10 Attractions Near ${property.name}`,
    template: 'local-attractions',
    data: {
      guest_name: guest.name,
      property_name: property.name,
      city: property.city,
      attractions: attractions.map(attr => ({
        name: attr.name,
        type: attr.type,
        distance_km: Math.round(attr.distance_km * 10) / 10
      })),
      nearest_airport: airport ? {
        name: airport.name,
        iata_code: airport.iata_code,
        distance_km: Math.round(airport.distance_km)
      } : undefined
    }
  };
}

/**
 * Example email template data
 */
export const emailTemplateExample = {
  subject: "Discover Bled: Top 10 Attractions Near Villa Bled",
  body: `
    Dear {{guest_name}},
    
    Welcome to {{property_name}}! We're excited to help you discover 
    the beautiful surroundings of {{city}}.
    
    🏰 TOP 10 ATTRACTIONS NEARBY:
    
    {{#attractions}}
    {{index}}. {{name}} ({{type}})
       📍 {{distance_km}}km from property
       
    {{/attractions}}
    
    ✈️ GETTING HERE:
    Nearest airport: {{nearest_airport.name}} ({{nearest_airport.iata_code}})
    Distance: {{nearest_airport.distance_km}}km
    
    Enjoy your stay!
    The {{property_name}} Team
  `
};

/**
 * Usage in your existing Communication Agent:
 * 
 * // src/agents/communication-agent.ts
 * import { generateAttractionRecommendations } from '@/lib/integrations/opentraveldata-examples';
 * 
 * const email = await generateAttractionRecommendations(property, guest);
 * await emailService.send(email);
 */
