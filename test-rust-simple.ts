/**
 * AgentFlow Pro - Rust Pricing Engine Test (Simple)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔍 Loading Rust NAPI module...\n');

try {
  const rustPricing = require('./rust/pricing-engine/index.js');
  
  console.log('✅ Rust NAPI module loaded!');
  console.log('   Functions:', Object.keys(rustPricing).join(', '));
  console.log();
  
  // Test basic calculation
  console.log('📊 Test 1: Basic Price Calculation');
  console.log('   Input: 100 EUR, 2026-03-15 to 2026-03-22 (7 nights)');
  
  const result = rustPricing.calculatePrice(
    100.0,
    '2026-03-15',
    '2026-03-22',
    null
  );
  
  console.log('   Result:', JSON.stringify(result, null, 2));
  console.log();
  
  // Test batch
  console.log('📦 Test 2: Batch Processing');
  const batchInput = {
    requests: [
      {
        id: 'req1',
        baseRate: 100.0,
        checkIn: '2026-03-15',
        checkOut: '2026-03-22',
        options: null,
      },
      {
        id: 'req2',
        baseRate: 150.0,
        checkIn: '2026-04-01',
        checkOut: '2026-04-05',
        options: null,
      },
    ],
  };
  
  const batchResults = rustPricing.calculatePriceBatch(batchInput);
  console.log('   Results:', JSON.stringify(batchResults, null, 2));
  console.log();
  
  console.log('✅ All Rust NAPI tests passed!\n');
  
} catch (error) {
  console.log('❌ Error:', error instanceof Error ? error.message : error);
  console.log();
  console.log('Stack trace:');
  console.log(error instanceof Error ? error.stack : 'No stack trace');
}
