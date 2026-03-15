/**
 * Guest Recommendations Test Script
 * 
 * Tests the complete flow:
 * 1. Load property from database
 * 2. Get nearby attractions from OpenTravelData
 * 3. Get FIWARE destination data
 * 4. Generate personalized email with Communication Agent
 * 5. Display results
 * 
 * Run: node -r tsx src/tests/guest-recommendations.test.ts
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from '@/database/schema';
import { openTravelData } from '@/lib/integrations/opentraveldata';
import { propertyToTourismDestination } from '@/lib/fiware/helpers';
import type { Attraction } from '@/lib/integrations/opentraveldata';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_PROPERTY_ID = process.env.TEST_PROPERTY_ID || 'test-property-123';
const TEST_GUEST = {
  id: 'guest-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  checkIn: new Date('2026-03-15'),
  checkOut: new Date('2026-03-22'),
  country: 'United Kingdom'
};

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function testGuestRecommendations() {
  logger.info('🧪 Testing Guest Recommendations Flow\n');
  logger.info('='.repeat(60));

  try {
    // ============================================================================
    // STEP 1: Initialize OpenTravelData
    // ============================================================================
    logger.info('\n📥 Step 1: Initialize OpenTravelData service...');
    await openTravelData.initialize();
    
    const cacheInfo = openTravelData.getCacheInfo();
    logger.info(`✅ Service initialized`);
    logger.info(`   - POIs loaded: ${cacheInfo.count.toLocaleString()}`);
    logger.info(`   - Cache age: ${cacheInfo.age}`);

    // ============================================================================
    // STEP 2: Load Test Property
    // ============================================================================
    logger.info('\n🏨 Step 2: Loading test property...');
    
    // Try to load from database, or use mock data
    let property = await prisma.property.findUnique({
      where: { id: TEST_PROPERTY_ID }
    });

    if (!property) {
      logger.info('⚠️  Test property not found, using mock data...');
      property = {
        id: TEST_PROPERTY_ID,
        name: 'Villa Bled',
        description: 'Beautiful villa with lake view',
        lat: 46.3683, // Bled coordinates
        lng: 14.1146,
        city: 'Bled',
        country: 'SI',
        type: 'villa',
        basePrice: 150,
        stars: 4,
        reviewScore: 4.8,
        reviewCount: 120,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    logger.info(`✅ Property loaded: ${property.name}`);
    logger.info(`   - Location: ${property.city}, ${property.country}`);
    logger.info(`   - Coordinates: ${property.lat}, ${property.lng}`);
    logger.info(`   - Rating: ${property.reviewScore || 'N/A'} (${property.reviewCount} reviews)`);

    // ============================================================================
    // STEP 3: Get Nearby Attractions
    // ============================================================================
    logger.info('\n🏰 Step 3: Getting nearby attractions...');
    
    const attractions = await openTravelData.getNearbyAttractions(
      property.lat!,
      property.lng!,
      10,  // 10km radius
      10   // Top 10
    );

    logger.info(`✅ Found ${attractions.length} attractions within 10km`);
    
    // Display top 5
    logger.info('\n   Top 5 Attractions:');
    attractions.slice(0, 5).forEach((attr, i) => {
      logger.info(`   ${i + 1}. ${attr.name}`);
      logger.info(`      Type: ${attr.type}`);
      logger.info(`      Distance: ${attr.distance_km.toFixed(1)}km`);
    });

    // ============================================================================
    // STEP 4: Get Nearest Airport
    // ============================================================================
    logger.info('\n✈️ Step 4: Getting nearest airport...');
    
    const airport = await openTravelData.getNearestAirport(
      property.lat!,
      property.lng!,
      property.country!
    );

    if (airport) {
      logger.info(`✅ Nearest airport: ${airport.name}`);
      logger.info(`   - IATA code: ${airport.iata_code}`);
      logger.info(`   - Distance: ${airport.distance_km?.toFixed(0)}km`);
    } else {
      logger.info('⚠️  No airport found');
    }

    // ============================================================================
    // STEP 5: Convert to FIWARE TourismDestination
    // ============================================================================
    logger.info('\n🏛️ Step 5: Converting to FIWARE standard...');
    
    const fiwareDestination = propertyToTourismDestination(property);
    
    logger.info(`✅ FIWARE TourismDestination created`);
    logger.info(`   - ID: ${fiwareDestination.id}`);
    logger.info(`   - Name: ${fiwareDestination.name.value}`);
    logger.info(`   - Location: [${fiwareDestination.location.value.coordinates}]`);
    logger.info(`   - Category: ${fiwareDestination.category?.value.join(', ')}`);

    // ============================================================================
    // STEP 6: Generate Personalized Email
    // ============================================================================
    logger.info('\n📧 Step 6: Generating personalized email...');
    
    const emailContent = generateWelcomeEmail({
      guest: TEST_GUEST,
      property: property,
      attractions: attractions,
      airport: airport || undefined,
      fiwareDestination: fiwareDestination
    });

    logger.info('✅ Email generated');
    logger.info('\n' + '='.repeat(60));
    logger.info('📧 EMAIL PREVIEW:');
    logger.info('='.repeat(60));
    logger.info(emailContent);
    logger.info('='.repeat(60));

    // ============================================================================
    // STEP 7: Summary
    // ============================================================================
    logger.info('\n📊 TEST SUMMARY:');
    logger.info('='.repeat(60));
    logger.info(`✅ OpenTravelData: ${cacheInfo.count.toLocaleString()} POIs loaded`);
    logger.info(`✅ Attractions found: ${attractions.length}`);
    logger.info(`✅ Nearest airport: ${airport?.name || 'N/A'}`);
    logger.info(`✅ FIWARE Destination: ${fiwareDestination.id}`);
    logger.info(`✅ Email generated: ${emailContent.length} characters`);
    logger.info('='.repeat(60));
    logger.info('\n🎉 All tests completed successfully!\n');

    return {
      success: true,
      property,
      attractions,
      airport,
      fiwareDestination,
      emailContent
    };

  } catch (error) {
    logger.error('\n❌ TEST FAILED:');
    logger.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// EMAIL GENERATION HELPER
// ============================================================================

interface EmailData {
  guest: typeof TEST_GUEST;
  property: any;
  attractions: Attraction[];
  airport?: {
    name: string;
    iata_code: string;
    distance_km?: number;
  };
  fiwareDestination: any;
}

function generateWelcomeEmail(data: EmailData): string {
  const { guest, property, attractions, airport, fiwareDestination } = data;

  return `
Subject: Welcome to ${property.name}! Your Personalized Guide to ${property.city}

Dear ${guest.name},

Welcome to ${property.name}! We're thrilled to host you from ${formatDate(guest.checkIn)} to ${formatDate(guest.checkOut)}.

To help you make the most of your stay, we've prepared a personalized guide to the best attractions near your accommodation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏰 TOP 10 ATTRACTIONS NEAR ${property.name.toUpperCase()}

${attractions.map((attr, i) => `
${i + 1}. ${attr.name}
   Type: ${capitalizeFirst(attr.type)}
   Distance: ${attr.distance_km.toFixed(1)}km from property
   Perfect for: ${getActivitySuggestion(attr.type)}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✈️ GETTING HERE

Nearest Airport: ${airport?.name || 'N/A'} (${airport?.iata_code || 'N/A'})
Distance from Property: ${airport?.distance_km?.toFixed(0) || 'N/A'}km
Estimated Transfer Time: ${airport?.distance_km ? Math.round(airport.distance_km / 1.5) : 'N/A'} minutes by car

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️ ABOUT ${property.city?.toUpperCase()}

${fiwareDestination.description?.value?.['en'] || `Discover the beauty of ${property.city}, ${property.country}. 
This amazing destination offers ${fiwareDestination.category?.value.join(', ')} and much more!`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 RECOMMENDED ITINERARY

Day 1-2: Explore nearby attractions (${attractions.slice(0, 3).map(a => a.name).join(', ')})
Day 3-4: Visit ${attractions[3]?.name || 'local landmarks'}
Day 5-7: Discover more of ${property.city} and surrounding areas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 LOCAL TIPS

• Best time to visit ${attractions[0]?.name || 'attractions'}: Early morning (9-11 AM)
• Don't miss: ${getLocalTip(attractions[0]?.type)}
• Parking: Most attractions have nearby parking
• Weather: Check local forecast before outdoor activities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 NEED HELP?

If you need any assistance during your stay, don't hesitate to contact us:
• Phone: +386 (your phone)
• Email: (your email)
• Check-in: After 14:00
• Check-out: Before 10:00

We look forward to welcoming you!

Warm regards,
The ${property.name} Team

---
This email was generated with ❤️ using AgentFlow Pro AI
Powered by OpenTravelData (50,000+ verified POIs) and FIWARE Smart Destination standards
`.trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getActivitySuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    'castle': 'History enthusiasts, photography',
    'museum': 'Culture lovers, rainy days',
    'park': 'Families, nature walks, picnics',
    'beach': 'Swimming, sunbathing, water sports',
    'church': 'Architecture, quiet reflection',
    'attraction': 'Sightseeing, photos',
    'viewpoint': 'Sunrise/sunset, photography',
    'garden': 'Relaxation, nature walks'
  };
  return suggestions[type.toLowerCase()] || 'Sightseeing';
}

function getLocalTip(type: string): string {
  const tips: Record<string, string> = {
    'castle': 'Book tickets online in advance for discounts',
    'museum': 'Many museums offer free entry on first Sunday',
    'park': 'Bring water and comfortable shoes',
    'beach': 'Arrive early in summer for best spots',
    'church': 'Dress modestly (covered shoulders/knees)',
    'viewpoint': 'Best lighting for photos in golden hour'
  };
  return tips[type.toLowerCase()] || 'Check opening hours before visiting';
}

// ============================================================================
// RUN TEST
// ============================================================================

// Run if executed directly
if (require.main === module) {
  testGuestRecommendations()
    .then(result => {
      if (result.success) {
        logger.info('✅ Test completed successfully!');
        process.exit(0);
      } else {
        logger.error('❌ Test failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

// Export for testing frameworks
export { testGuestRecommendations };
