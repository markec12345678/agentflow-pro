/**
 * AgentFlow Pro - Rust Pricing Engine Test (Debug)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔍 Testing Rust NAPI batch processing...\n');

const rustPricing = require('./rust/pricing-engine/index.js');

// Test batch WITHOUT options field
console.log('📦 Test 1: Batch WITHOUT options field');
try {
  const batchInput1 = {
    requests: [
      {
        id: 'req1',
        baseRate: 100.0,
        checkIn: '2026-03-15',
        checkOut: '2026-03-22',
      },
    ],
  };
  
  const result1 = rustPricing.calculatePriceBatch(batchInput1);
  console.log('   ✅ Success:', JSON.stringify(result1, null, 2));
} catch (error) {
  console.log('   ❌ Error:', error instanceof Error ? error.message : error);
}

console.log();

// Test batch WITH undefined options
console.log('📦 Test 2: Batch WITH undefined options');
try {
  const batchInput2 = {
    requests: [
      {
        id: 'req1',
        baseRate: 100.0,
        checkIn: '2026-03-15',
        checkOut: '2026-03-22',
        options: undefined,
      },
    ],
  };
  
  const result2 = rustPricing.calculatePriceBatch(batchInput2);
  console.log('   ✅ Success:', JSON.stringify(result2, null, 2));
} catch (error) {
  console.log('   ❌ Error:', error instanceof Error ? error.message : error);
}

console.log();

// Test batch WITH empty options object
console.log('📦 Test 3: Batch WITH empty options object');
try {
  const batchInput3 = {
    requests: [
      {
        id: 'req1',
        baseRate: 100.0,
        checkIn: '2026-03-15',
        checkOut: '2026-03-22',
        options: {},
      },
    ],
  };
  
  const result3 = rustPricing.calculatePriceBatch(batchInput3);
  console.log('   ✅ Success:', JSON.stringify(result3, null, 2));
} catch (error) {
  console.log('   ❌ Error:', error instanceof Error ? error.message : error);
}

console.log();

// Test batch WITH null options
console.log('📦 Test 4: Batch WITH null options');
try {
  const batchInput4 = {
    requests: [
      {
        id: 'req1',
        baseRate: 100.0,
        checkIn: '2026-03-15',
        checkOut: '2026-03-22',
        options: null,
      },
    ],
  };
  
  const result4 = rustPricing.calculatePriceBatch(batchInput4);
  console.log('   ✅ Success:', JSON.stringify(result4, null, 2));
} catch (error) {
  console.log('   ❌ Error:', error instanceof Error ? error.message : error);
}
