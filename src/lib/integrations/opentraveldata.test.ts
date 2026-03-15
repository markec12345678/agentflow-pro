/**
 * OpenTravelData Test Script
 * 
 * Run this to verify the integration works:
 *   node -r tsx src/lib/integrations/opentraveldata.test.ts
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { logger } from '@/infrastructure/observability/logger';
import { openTravelData } from './opentraveldata';

async function runTests() {
  logger.info('🧪 OpenTravelData Integration Tests\n');
  logger.info('=' .repeat(50));

  try {
    // Test 1: Initialize
    logger.info('\n📥 Test 1: Initialize service...');
    await openTravelData.initialize();
    logger.info('✅ Service initialized');

    // Test 2: Cache info
    logger.info('\n📊 Test 2: Check cache...');
    const cacheInfo = openTravelData.getCacheInfo();
    logger.info(`Cache loaded: ${cacheInfo.loaded}`);
    logger.info(`POI count: ${cacheInfo.count.toLocaleString()}`);
    logger.info(`Cache age: ${cacheInfo.age}`);

    // Test 3: Get attractions near Bled
    logger.info('\n🏰 Test 3: Get attractions near Bled...');
    const bledAttractions = await openTravelData.getNearbyAttractions(
      46.3683, // Bled latitude
      14.1146, // Bled longitude
      10,      // 10km radius
      10       // Top 10
    );
    logger.info(`Found ${bledAttractions.length} attractions`);
    bledAttractions.forEach((attr, i) => {
      logger.info(`  ${i + 1}. ${attr.name} (${attr.type}) - ${attr.distance_km.toFixed(1)}km`);
    });

    // Test 4: Get attractions near Ljubljana
    logger.info('\n🏛️ Test 4: Get attractions near Ljubljana...');
    const ljubljanaAttractions = await openTravelData.getNearbyAttractions(
      46.0569, // Ljubljana latitude
      14.5058, // Ljubljana longitude
      10,      // 10km radius
      5        // Top 5
    );
    logger.info(`Found ${ljubljanaAttractions.length} attractions`);
    ljubljanaAttractions.forEach((attr, i) => {
      logger.info(`  ${i + 1}. ${attr.name} (${attr.type}) - ${attr.distance_km.toFixed(1)}km`);
    });

    // Test 5: Get airports in Slovenia
    logger.info('\n✈️ Test 5: Get airports in Slovenia (SI)...');
    const sloveniaAirports = await openTravelData.getAirportsByCountry('SI');
    logger.info(`Found ${sloveniaAirports.length} airports`);
    sloveniaAirports.forEach(airport => {
      logger.info(`  - ${airport.name} (${airport.iata_code})`);
    });

    // Test 6: Get nearest airport to Bled
    logger.info('\n🎯 Test 6: Get nearest airport to Bled...');
    const nearestAirport = await openTravelData.getNearestAirport(
      46.3683,
      14.1146,
      'SI'
    );
    if (nearestAirport) {
      logger.info(`  ${nearestAirport.name} (${nearestAirport.iata_code})`);
      logger.info(`  Distance: ${nearestAirport.distance_km?.toFixed(0)}km`);
    } else {
      logger.info('  No airport found');
    }

    // Test 7: Error handling (invalid location)
    logger.info('\n⚠️ Test 7: Error handling (middle of ocean)...');
    const oceanAttractions = await openTravelData.getNearbyAttractions(
      0, 0, 10, 10
    );
    logger.info(`Attractions in ocean: ${oceanAttractions.length} (expected: 0)`);

    // Summary
    logger.info('\n' + '='.repeat(50));
    logger.info('✅ All tests completed successfully!');
    logger.info('='.repeat(50));

  } catch (error) {
    logger.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
