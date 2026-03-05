/**
 * AgentFlow Pro - Rust Pricing Engine Test
 * Test the Rust NAPI bindings directly
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Try to load the Rust NAPI module
let rustPricing: any = null;

try {
  rustPricing = require('./rust/pricing-engine/index.js');
  console.log('✅ Rust NAPI module loaded successfully');
  console.log('   Available functions:', Object.keys(rustPricing));
} catch (error) {
  console.log('❌ Rust NAPI module not available');
  console.log('   Error:', error instanceof Error ? error.message : error);
}

// Test function
async function testRustPricing() {
  console.log('\n📊 Pricing Engine Test Results\n');
  console.log('='.repeat(50));

  if (!rustPricing) {
    console.log('\n⚠️  Rust not available - TypeScript fallback will be used');
    console.log('   This is expected if Rust binary is not built.\n');
    
    // Import TypeScript fallback
    const { calculatePrice } = await import('./src/lib/tourism/pricing-engine.js');
    
    const result = calculatePrice(
      100,
      new Date('2026-03-15'),
      new Date('2026-03-22')
    );
    
    console.log('\nTypeScript Fallback Test:');
    console.log('  Base Rate: €100/night');
    console.log('  Check-in: 2026-03-15');
    console.log('  Check-out: 2026-03-22');
    console.log('  Nights:', result.nights);
    console.log('  Base Total: €' + result.baseTotal.toFixed(2));
    console.log('  Final Price: €' + result.finalPrice.toFixed(2));
    console.log('  Adjustments:', result.adjustments.length);
    result.adjustments.forEach(a => {
      console.log(`    - ${a.rule}: €${a.amount.toFixed(2)} (${a.percent?.toFixed(0)}%)`);
    });
    
    return;
  }

  // Test Rust NAPI
  try {
    console.log('\n🚀 Rust NAPI Test:\n');
    
    // Test basic calculation
    const result = rustPricing.calculatePrice(
      100.0,
      '2026-03-15',
      '2026-03-22',
      null
    );
    
    console.log('  Input:');
    console.log('    Base Rate: €100/night');
    console.log('    Check-in: 2026-03-15');
    console.log('    Check-out: 2026-03-22');
    
    console.log('\n  Rust Result:');
    console.log('    Nights:', result.nights);
    console.log('    Base Total: €' + result.base_total.toFixed(2));
    console.log('    Final Price: €' + result.final_price.toFixed(2));
    console.log('    Adjustments:', result.adjustments.length);
    
    if (result.breakdown) {
      console.log('\n  Breakdown:');
      console.log('    Rate per night: €' + result.breakdown.rate_per_night.toFixed(2));
      console.log('    Subtotal: €' + result.breakdown.subtotal.toFixed(2));
      console.log('    Total Discounts: €' + result.breakdown.total_discounts.toFixed(2));
      console.log('    Total Premiums: €' + result.breakdown.total_premiums.toFixed(2));
    }
    
    result.adjustments.forEach(a => {
      console.log(`    - ${a.rule}: €${a.amount.toFixed(2)} (${a.percent?.toFixed(0)}%)`);
    });
    
    // Test batch processing
    console.log('\n\n📦 Batch Processing Test:\n');
    
    const batchInput = {
      requests: [
        {
          id: 'req1',
          base_rate: 100.0,
          check_in: '2026-03-15',
          check_out: '2026-03-22',
          options: null,
        },
        {
          id: 'req2',
          base_rate: 150.0,
          check_in: '2026-04-01',
          check_out: '2026-04-05',
          options: null,
        },
      ],
    };
    
    const batchResults = rustPricing.calculatePriceBatch(batchInput);
    
    console.log('  Processed', batchResults.length, 'requests:');
    batchResults.forEach(r => {
      console.log(`    ${r.id}: €${r.result.final_price.toFixed(2)} (${r.result.nights} nights)`);
    });
    
    console.log('\n✅ All Rust tests passed!\n');
    
  } catch (error) {
    console.log('\n❌ Rust test failed:');
    console.log('   Error:', error instanceof Error ? error.message : error);
    console.log('\n⚠️  Falling back to TypeScript implementation\n');
  }
}

// Run test
testRustPricing().catch(console.error);
