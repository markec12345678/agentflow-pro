/**
 * Communication Agent - Guest Recommendations Integration
 * 
 * This module integrates OpenTravelData and FIWARE into
 * the Communication Agent for personalized guest emails.
 * 
 * Usage:
 *   import { generateGuestRecommendations } from '@/agents/communication/recommendations';
import { logger } from '@/infrastructure/observability/logger';
 *   const email = await generateGuestRecommendations(property, guest);
 */

import { openTravelData, type Attraction, type Airport } from '@/lib/integrations/opentraveldata';
import { propertyToTourismDestination, type TourismDestination } from '@/lib/fiware/helpers';
import type { Property, Guest } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface GuestRecommendations {
  property: Property;
  guest: Guest;
  attractions: Attraction[];
  airport: Airport | null;
  fiwareDestination: TourismDestination;
  generatedAt: Date;
}

export interface RecommendationEmail {
  to: string;
  subject: string;
  template: string;
  data: {
    guest_name: string;
    property_name: string;
    city: string;
    check_in: string;
    check_out: string;
    attractions: Array<{
      name: string;
      type: string;
      distance_km: number;
      description: string;
    }>;
    airport?: {
      name: string;
      iata_code: string;
      distance_km: number;
      transfer_time_minutes: number;
    };
    destination_description?: string;
    tips: string[];
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate personalized guest recommendations
 * 
 * @param property - Property from database
 * @param guest - Guest information
 * @param options - Optional configuration
 * @returns Complete recommendations object
 * 
 * @example
 * const recommendations = await generateGuestRecommendations(property, guest, {
 *   radiusKm: 10,
 *   limit: 10
 * });
 */
export async function generateGuestRecommendations(
  property: Property,
  guest: Guest,
  options?: {
    radiusKm?: number;
    limit?: number;
    includeAirport?: boolean;
  }
): Promise<GuestRecommendations> {
  const {
    radiusKm = 10,
    limit = 10,
    includeAirport = true
  } = options || {};

  // Ensure OpenTravelData is initialized
  if (!openTravelData.getCacheInfo().loaded) {
    await openTravelData.initialize();
  }

  // Get nearby attractions
  const attractions = await openTravelData.getNearbyAttractions(
    property.lat!,
    property.lng!,
    radiusKm,
    limit
  );

  // Get nearest airport (optional)
  let airport: Airport | null = null;
  if (includeAirport && property.country) {
    airport = await openTravelData.getNearestAirport(
      property.lat!,
      property.lng!,
      property.country
    );
  }

  // Convert to FIWARE standard
  const fiwareDestination = propertyToTourismDestination(property);

  return {
    property,
    guest,
    attractions,
    airport,
    fiwareDestination,
    generatedAt: new Date()
  };
}

/**
 * Generate personalized email from recommendations
 * 
 * @param recommendations - Guest recommendations object
 * @returns Email object ready to send
 * 
 * @example
 * const email = await generateRecommendationEmail(recommendations);
 * await emailService.send(email);
 */
export async function generateRecommendationEmail(
  recommendations: GuestRecommendations
): Promise<RecommendationEmail> {
  const { guest, property, attractions, airport, fiwareDestination } = recommendations;

  // Generate email subject
  const subject = `Welcome to ${property.name}! Your Personalized Guide to ${property.city}`;

  // Prepare attraction data
  const attractionData = attractions.map(attr => ({
    name: attr.name,
    type: attr.type,
    distance_km: Math.round(attr.distance_km * 10) / 10,
    description: getAttractionDescription(attr.type)
  }));

  // Prepare airport data
  const airportData = airport ? {
    name: airport.name,
    iata_code: airport.iata_code,
    distance_km: Math.round(airport.distance_km || 0),
    transfer_time_minutes: Math.round((airport.distance_km || 0) / 1.5)
  } : undefined;

  // Generate tips
  const tips = generateLocalTips(attractions);

  return {
    to: guest.email,
    subject,
    template: 'welcome-with-recommendations',
    data: {
      guest_name: guest.name || 'Valued Guest',
      property_name: property.name,
      city: property.city || 'our location',
      check_in: formatDate(guest.checkIn || new Date()),
      check_out: formatDate(guest.checkOut || new Date()),
      attractions: attractionData,
      airport: airportData,
      destination_description: fiwareDestination.description?.value?.['en'] || undefined,
      tips
    }
  };
}

/**
 * Send guest recommendations email
 * 
 * @param property - Property from database
 * @param guest - Guest information
 * @returns Email result
 * 
 * @example
 * const result = await sendGuestRecommendationsEmail(property, guest);
 * if (result.success) logger.info('Email sent!');
 */
export async function sendGuestRecommendationsEmail(
  property: Property,
  guest: Guest
): Promise<{ success: boolean; email?: RecommendationEmail; error?: string }> {
  try {
    // Generate recommendations
    const recommendations = await generateGuestRecommendations(property, guest);

    // Generate email
    const email = await generateRecommendationEmail(recommendations);

    // TODO: Integrate with your email service
    // await emailService.send(email);
    
    logger.info('✅ Guest recommendations email generated');
    logger.info(`   - To: ${email.to}`);
    logger.info(`   - Subject: ${email.subject}`);
    logger.info(`   - Attractions: ${email.data.attractions.length}`);

    return {
      success: true,
      email
    };
  } catch (error) {
    logger.error('❌ Failed to generate guest recommendations email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAttractionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'castle': 'Historic castle with guided tours and panoramic views',
    'museum': 'Cultural museum showcasing local heritage and art',
    'park': 'Beautiful natural park perfect for walking and picnics',
    'beach': 'Scenic beach area for swimming and relaxation',
    'church': 'Historic church with stunning architecture',
    'attraction': 'Popular tourist attraction worth visiting',
    'viewpoint': 'Scenic viewpoint with breathtaking panoramas',
    'garden': 'Peaceful gardens with local flora',
    'monument': 'Historic monument commemorating important events',
    'ruins': 'Ancient ruins offering glimpse into the past'
  };
  return descriptions[type.toLowerCase()] || 'Interesting local attraction';
}

function generateLocalTips(attractions: Attraction[]): string[] {
  const tips: string[] = [];

  if (attractions.length > 0) {
    tips.push(`Best time to visit ${attractions[0]?.name}: Early morning (9-11 AM)`);
  }

  tips.push('Check opening hours before visiting attractions');
  tips.push('Many attractions offer discounts for online booking');
  tips.push('Bring comfortable shoes for walking tours');
  tips.push('Keep local emergency numbers handy: 112 (EU-wide)');

  return tips;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ============================================================================
// COMMUNICATION AGENT INTEGRATION
// ============================================================================

/**
 * Integration with Communication Agent
 * 
 * This function can be called from your existing Communication Agent
 * to automatically include recommendations in guest emails.
 */
export async function integrateWithCommunicationAgent(
  communicationAgent: any,
  property: Property,
  guest: Guest,
  emailType: 'welcome' | 'during-stay' | 'pre-arrival' = 'welcome'
): Promise<void> {
  const recommendations = await generateGuestRecommendations(property, guest);
  const email = await generateRecommendationEmail(recommendations);

  // Call your existing Communication Agent
  await communicationAgent.send({
    to: email.to,
    template: email.template,
    data: email.data,
    metadata: {
      type: emailType,
      property_id: property.id,
      guest_id: guest.id,
      generated_at: new Date().toISOString()
    }
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateGuestRecommendations,
  generateRecommendationEmail,
  sendGuestRecommendationsEmail,
  integrateWithCommunicationAgent,
  type GuestRecommendations,
  type RecommendationEmail
};
