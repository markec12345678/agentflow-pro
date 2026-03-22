/**
 * AgentFlow Pro - Pricing Engine Benchmark Suite
 * 
 * Comprehensive performance comparison between TypeScript and Rust implementations.
 * 
 * Usage:
 *   npx tsx benchmarks/pricing-benchmark.ts
 * 
 * Output:
 *   - Operations per second (ops/sec)
 *   - Average latency (ms)
 *   - Memory usage
 *   - Performance ratio (Rust vs TypeScript)
 */

import { hrtime } from 'process';
import { RustPricingEngine } from '../src/lib/tourism/pricing-engine-rust';
import { calculatePrice as tsCalculatePrice } from '../src/lib/tourism/pricing-engine';

// ============================================================================
// Benchmark Configuration
// ============================================================================

interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  iterations: 10000,
  warmupIterations: 1000,
};

interface BenchmarkResult {
  name: string;
  engine: 'typescript' | 'rust';
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

// ============================================================================
// Test Cases
// ============================================================================

const testCases = {
  basic: {
    name: 'Basic Pricing (7 nights)',
    baseRate: 100,
    checkIn: '2026-07-01',
    checkOut: '2026-07-08',
    options: null as any,
  },
  seasonal: {
    name: 'Seasonal Pricing',
    baseRate: 100,
    checkIn: '2026-07-15',
    checkOut: '2026-07-22',
    options: {
      season_rates: {
        high: [
          { from: '2026-07-01', to: '2026-08-31', rate: 150 },
        ],
        mid: [
          { from: '2026-05-01', to: '2026-06-30', rate: 120 },
        ],
        low: [
          { from: '2026-01-01', to: '2026-04-30', rate: 80 },
        ],
      },
    },
  },
  withCompetitor: {
    name: 'Competitor Pricing',
    baseRate: 100,
    checkIn: '2026-07-01',
    checkOut: '2026-07-08',
    options: {
      competitor_avg: 90,
      season_rates: {
        high: [
          { from: '2026-07-01', to: '2026-08-31', rate: 150 },
        ],
        mid: null,
        low: null,
      },
    },
  },
  weekend: {
    name: 'Weekend Premium (2 weekends)',
    baseRate: 100,
    checkIn: '2026-07-03', // Friday
    checkOut: '2026-07-10', // Friday
    options: null as any,
  },
  lastMinute: {
    name: 'Last-minute Booking',
    baseRate: 100,
    checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    options: null as any,
  },
};

// ============================================================================
// Benchmark Functions
// ============================================================================

function now(): number {
  const [sec, nsec] = hrtime.bigint() as any;
  return Number(sec) * 1e6 + Number(nsec) / 1e6;
}

async function benchmarkTypeScript(
  name: string,
  testCase: any,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    tsCalculatePrice(
      testCase.baseRate,
      new Date(testCase.checkIn),
      new Date(testCase.checkOut),
      testCase.options ? {
        competitorAvg: testCase.options.competitor_avg,
        seasonRates: testCase.options.season_rates,
      } : undefined
    );
  }

  // Benchmark
  const startTime = now();
  for (let i = 0; i < config.iterations; i++) {
    const iterStart = now();
    tsCalculatePrice(
      testCase.baseRate,
      new Date(testCase.checkIn),
      new Date(testCase.checkOut),
      testCase.options ? {
        competitorAvg: testCase.options.competitor_avg,
        seasonRates: testCase.options.season_rates,
      } : undefined
    );
    times.push(now() - iterStart);
  }
  const totalTime = now() - startTime;

  return {
    name: testCase.name,
    engine: 'typescript',
    totalMs: totalTime,
    avgMs: totalTime / config.iterations,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    opsPerSec: config.iterations / (totalTime / 1000),
  };
}

async function benchmarkRust(
  name: string,
  testCase: any,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  const engine = new RustPricingEngine();
  
  if (!engine.isAvailable()) {
    console.warn('⚠️  Rust binary not available, skipping Rust benchmarks');
    return {
      name: testCase.name,
      engine: 'rust',
      totalMs: 0,
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
      opsPerSec: 0,
    };
  }

  const times: number[] = [];

  // Warmup
  for (let i = 0; i < config.warmupIterations; i++) {
    await engine.calculatePrice(
      testCase.baseRate,
      testCase.checkIn,
      testCase.checkOut,
      testCase.options
    );
  }

  // Benchmark
  const startTime = now();
  for (let i = 0; i < config.iterations; i++) {
    const iterStart = now();
    await engine.calculatePrice(
      testCase.baseRate,
      testCase.checkIn,
      testCase.checkOut,
      testCase.options
    );
    times.push(now() - iterStart);
  }
  const totalTime = now() - startTime;

  return {
    name: testCase.name,
    engine: 'rust',
    totalMs: totalTime,
    avgMs: totalTime / config.iterations,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    opsPerSec: config.iterations / (totalTime / 1000),
  };
}

// ============================================================================
// Report Generation
// ============================================================================

function formatNumber(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function printReport(tsResult: BenchmarkResult, rustResult: BenchmarkResult) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 BENCHMARK: ${tsResult.name}`);
  console.log('='.repeat(80));
  
  console.log('\n📘 TypeScript:');
  console.log(`   Total Time:    ${formatNumber(tsResult.totalMs)} ms`);
  console.log(`   Avg Latency:   ${formatNumber(tsResult.avgMs * 1000)} μs`);
  console.log(`   Min Latency:   ${formatNumber(tsResult.minMs * 1000)} μs`);
  console.log(`   Max Latency:   ${formatNumber(tsResult.maxMs * 1000)} μs`);
  console.log(`   Ops/sec:       ${formatNumber(tsResult.opsPerSec)}`);
  
  if (rustResult.opsPerSec > 0) {
    console.log('\n🦀 Rust:');
    console.log(`   Total Time:    ${formatNumber(rustResult.totalMs)} ms`);
    console.log(`   Avg Latency:   ${formatNumber(rustResult.avgMs * 1000)} μs`);
    console.log(`   Min Latency:   ${formatNumber(rustResult.minMs * 1000)} μs`);
    console.log(`   Max Latency:   ${formatNumber(rustResult.maxMs * 1000)} μs`);
    console.log(`   Ops/sec:       ${formatNumber(rustResult.opsPerSec)}`);
    
    const speedup = rustResult.opsPerSec / tsResult.opsPerSec;
    console.log(`\n⚡ Performance Ratio: Rust is ${formatNumber(speedup)}x faster`);
  } else {
    console.log('\n⚠️  Rust results not available');
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

// ============================================================================
// Main Execution
// ============================================================================

async function runBenchmarks() {
  console.log('\n🚀 AgentFlow Pro - Pricing Engine Benchmark Suite\n');
  console.log('Configuration:');
  console.log(`  Iterations:      ${DEFAULT_CONFIG.iterations.toLocaleString()}`);
  console.log(`  Warmup:          ${DEFAULT_CONFIG.warmupIterations.toLocaleString()}`);
  console.log('\nRunning benchmarks...\n');

  const config = DEFAULT_CONFIG;

  for (const [key, testCase] of Object.entries(testCases)) {
    console.log(`\n📍 Running: ${testCase.name}...`);
    
    try {
      const tsResult = await benchmarkTypeScript(key, testCase, config);
      const rustResult = await benchmarkRust(key, testCase, config);
      
      printReport(tsResult, rustResult);
    } catch (error) {
      console.error(`❌ Error in ${testCase.name}:`, error);
    }
  }

  console.log('✅ Benchmarks complete!\n');
}

// Run if executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { runBenchmarks };
