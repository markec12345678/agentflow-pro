/**
 * OpenTravelData Test Script
 * 
 * Run this to verify the integration works:
 *   node -r tsx src/lib/integrations/opentraveldata.test.ts
 */

import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { openTravelData } from './opentraveldata';

async function runTests() {
  console.log('🧪 OpenTravelData Integration Tests\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Initialize
    console.log('\n📥 Test 1: Initialize service...');
    await openTravelData.initialize();
    console.log('✅ Service initialized');

    // Test 2: Cache info
    console.log('\n📊 Test 2: Check cache...');
    const cacheInfo = openTravelData.getCacheInfo();
    console.log(`Cache loaded: ${cacheInfo.loaded}`);
    console.log(`POI count: ${cacheInfo.count.toLocaleString()}`);
    console.log(`Cache age: ${cacheInfo.age}`);

    // Test 3: Get attractions near Bled
    console.log('\n🏰 Test 3: Get attractions near Bled...');
    const bledAttractions = await openTravelData.getNearbyAttractions(
      46.3683, // Bled latitude
      14.1146, // Bled longitude
      10,      // 10km radius
      10       // Top 10
    );
    console.log(`Found ${bledAttractions.length} attractions`);
    bledAttractions.forEach((attr, i) => {
      console.log(`  ${i + 1}. ${attr.name} (${attr.type}) - ${attr.distance_km.toFixed(1)}km`);
    });

    // Test 4: Get attractions near Ljubljana
    console.log('\n🏛️ Test 4: Get attractions near Ljubljana...');
    const ljubljanaAttractions = await openTravelData.getNearbyAttractions(
      46.0569, // Ljubljana latitude
      14.5058, // Ljubljana longitude
      10,      // 10km radius
      5        // Top 5
    );
    console.log(`Found ${ljubljanaAttractions.length} attractions`);
    ljubljanaAttractions.forEach((attr, i) => {
      console.log(`  ${i + 1}. ${attr.name} (${attr.type}) - ${attr.distance_km.toFixed(1)}km`);
    });

    // Test 5: Get airports in Slovenia
    console.log('\n✈️ Test 5: Get airports in Slovenia (SI)...');
    const sloveniaAirports = await openTravelData.getAirportsByCountry('SI');
    console.log(`Found ${sloveniaAirports.length} airports`);
    sloveniaAirports.forEach(airport => {
      console.log(`  - ${airport.name} (${airport.iata_code})`);
    });

    // Test 6: Get nearest airport to Bled
    console.log('\n🎯 Test 6: Get nearest airport to Bled...');
    const nearestAirport = await openTravelData.getNearestAirport(
      46.3683,
      14.1146,
      'SI'
    );
    if (nearestAirport) {
      console.log(`  ${nearestAirport.name} (${nearestAirport.iata_code})`);
      console.log(`  Distance: ${nearestAirport.distance_km?.toFixed(0)}km`);
    } else {
      console.log('  No airport found');
    }

    // Test 7: Error handling (invalid location)
    console.log('\n⚠️ Test 7: Error handling (middle of ocean)...');
    const oceanAttractions = await openTravelData.getNearbyAttractions(
      0, 0, 10, 10
    );
    console.log(`Attractions in ocean: ${oceanAttractions.length} (expected: 0)`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
