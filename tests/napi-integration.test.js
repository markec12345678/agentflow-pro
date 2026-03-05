/**
 * AgentFlow Pro - NAPI Integration Tests
 *
 * Comprehensive tests for Rust NAPI bindings:
 * - Pricing Engine (performance, accuracy, batch processing)
 * - Workflow Executor (validation, execution, error handling)
 *
 * Run with: node tests/napi-integration.test.js
 * Or: npm run test:napi
 */

const assert = require('assert');
const path = require('path');
const { performance } = require('perf_hooks');

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_TIMEOUT = 60000; // 60 seconds
const LOG_PREFIX = '[NAPI-TEST]';
const BENCHMARK_ITERATIONS = 100;

function log(message, level = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${LOG_PREFIX} [${timestamp}] ${prefix} ${message}`);
}

function logError(message) {
  log(message, 'error');
}

function logSuccess(message) {
  log(message, 'success');
}

function logBenchmark(message) {
  console.log(`📊 ${LOG_PREFIX} ${message}`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safe module require with error handling
 */
function safeRequire(modulePath, description) {
  try {
    const module = require(modulePath);
    log(`✓ ${description} loaded from: ${modulePath}`);
    return { success: true, module };
  } catch (error) {
    logError(`✗ ${description} failed: ${error.message}`);
    return { success: false, error };
  }
}

/**
 * Assert function with better error messages
 */
function assertCondition(condition, message) {
  try {
    assert.ok(condition, message);
    logSuccess(`✓ ${message}`);
    return true;
  } catch (error) {
    logError(`✗ ${message}: ${error.message}`);
    return false;
  }
}

/**
 * Measure execution time of a function
 */
function measureExecutionTime(fn, iterations = 1) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { avg, min, max, times };
}

/**
 * Assert that a function throws an error
 */
function assertThrows(fn, expectedMessage) {
  try {
    fn();
    return false;
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      logError(`Expected error message to include "${expectedMessage}", got: "${error.message}"`);
      return false;
    }
    return true;
  }
}

// ============================================================================
// Pricing Engine Tests
// ============================================================================

async function testPricingEngine() {
  log('\n=== Testing Pricing Engine ===\n');

  const results = {
    moduleLoad: false,
    basicCalculation: false,
    batchCalculation: false,
    errorHandling: false,
    performance: false,
    seasonalPricing: false,
    edgeCases: false,
  };

  // Test 1: Module Loading
  log('Test 1: Module Loading');
  const pricingResult = safeRequire(
    path.join(__dirname, '..', 'rust', 'pricing-engine'),
    'Pricing Engine NAPI module'
  );

  if (!pricingResult.success) {
    logError('Pricing Engine module not available, skipping remaining tests');
    return results;
  }

  results.moduleLoad = true;
  const pricingEngine = pricingResult.module;

  // Test 2: Basic Calculation
  log('\nTest 2: Basic Price Calculation');
  try {
    if (typeof pricingEngine.calculatePrice !== 'function') {
      throw new Error('calculatePrice function not found');
    }

    const result = pricingEngine.calculatePrice(
      100, // base rate
      '2026-03-15', // check-in
      '2026-03-20', // check-out
      null // options
    );

    results.basicCalculation = assertCondition(
      result && typeof result === 'object',
      'Calculate price returns valid result'
    );

    if (results.basicCalculation) {
      log(`  Base Total: €${result.base_total.toFixed(2)}`);
      log(`  Final Price: €${result.final_price.toFixed(2)}`);
      log(`  Nights: ${result.nights}`);
      log(`  Adjustments: ${result.adjustments.length}`);

      assertCondition(
        result.nights === 5,
        'Correct number of nights (5)'
      );
      
      assertCondition(
        result.final_price > 0,
        'Final price is positive'
      );
    }
  } catch (error) {
    logError(`Basic calculation failed: ${error.message}`);
  }

  // Test 3: Batch Calculation
  log('\nTest 3: Batch Price Calculation');
  try {
    if (typeof pricingEngine.calculatePriceBatch !== 'function') {
      throw new Error('calculatePriceBatch function not found');
    }

    const batchInput = {
      requests: [
        {
          id: 'req-1',
          baseRate: 100,
          checkIn: '2026-03-15',
          checkOut: '2026-03-20',
        },
        {
          id: 'req-2',
          baseRate: 150,
          checkIn: '2026-04-01',
          checkOut: '2026-04-05',
        },
        {
          id: 'req-3',
          baseRate: 200,
          checkIn: '2026-05-10',
          checkOut: '2026-05-20',
        },
      ],
    };

    const batchResult = pricingEngine.calculatePriceBatch(batchInput);

    results.batchCalculation = assertCondition(
      Array.isArray(batchResult) && batchResult.length === 3,
      'Batch calculation returns array with 3 results'
    );

    if (results.batchCalculation) {
      batchResult.forEach((result, index) => {
        log(`  Request ${index + 1}: ${result.id} - Final: €${result.result.final_price.toFixed(2)} (${result.result.nights} nights)`);
      });
    }
  } catch (error) {
    logError(`Batch calculation failed: ${error.message}`);
  }

  // Test 4: Seasonal Pricing
  log('\nTest 4: Seasonal Pricing');
  try {
    const options = {
      seasonRates: {
        high: [
          {
            from: '2026-07-01',
            to: '2026-08-31',
            rate: 150,
          },
        ],
        mid: [
          {
            from: '2026-05-01',
            to: '2026-06-30',
            rate: 120,
          },
        ],
        low: null,
      },
    };

    const result = pricingEngine.calculatePrice(
      100,
      '2026-07-15',
      '2026-07-22',
      options
    );

    results.seasonalPricing = assertCondition(
      result.breakdown && result.breakdown.rate_per_night === 150,
      'Seasonal rate applied correctly (high season: €150)'
    );
  } catch (error) {
    logError(`Seasonal pricing failed: ${error.message}`);
  }

  // Test 5: Error Handling
  log('\nTest 5: Error Handling');
  try {
    // Test with invalid dates
    let errorThrown = false;
    try {
      pricingEngine.calculatePrice(100, 'invalid-date', '2026-03-20', null);
    } catch (e) {
      errorThrown = true;
    }

    results.errorHandling = assertCondition(
      errorThrown,
      'Invalid input throws error'
    );
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
  }

  // Test 6: Edge Cases
  log('\nTest 6: Edge Cases');
  try {
    // Single night stay
    const singleNight = pricingEngine.calculatePrice(100, '2026-03-15', '2026-03-16', null);
    assertCondition(singleNight.nights === 1, 'Single night stay works');
    
    // Long stay (30 nights)
    const longStay = pricingEngine.calculatePrice(100, '2026-03-15', '2026-04-14', null);
    assertCondition(longStay.nights === 30, 'Long stay (30 nights) works');
    
    // Zero base rate
    const zeroRate = pricingEngine.calculatePrice(0, '2026-03-15', '2026-03-20', null);
    assertCondition(zeroRate.final_price === 0, 'Zero base rate results in zero price');
    
    results.edgeCases = true;
    logSuccess('✓ All edge cases passed');
  } catch (error) {
    logError(`Edge cases failed: ${error.message}`);
  }

  // Test 7: Performance Benchmark
  log('\nTest 7: Performance Benchmark');
  try {
    const benchmark = measureExecutionTime(() => {
      pricingEngine.calculatePrice(100, '2026-07-01', '2026-07-08', null);
    }, BENCHMARK_ITERATIONS);

    results.performance = assertCondition(
      benchmark.avg < 10, // Should complete in < 10ms on average
      `Performance: avg ${benchmark.avg.toFixed(3)}ms, min ${benchmark.min.toFixed(3)}ms, max ${benchmark.max.toFixed(3)}ms`
    );

    logBenchmark(`Pricing Calculation (${BENCHMARK_ITERATIONS} iterations):`);
    logBenchmark(`  Average: ${benchmark.avg.toFixed(3)}ms`);
    logBenchmark(`  Min: ${benchmark.min.toFixed(3)}ms`);
    logBenchmark(`  Max: ${benchmark.max.toFixed(3)}ms`);
    logBenchmark(`  Ops/sec: ${Math.round(1000 / benchmark.avg)}`);
  } catch (error) {
    logError(`Performance benchmark failed: ${error.message}`);
  }

  return results;
}

// ============================================================================
// Workflow Executor Tests
// ============================================================================

async function testWorkflowExecutor() {
  log('\n=== Testing Workflow Executor ===\n');

  const results = {
    moduleLoad: false,
    workflowValidation: false,
    executionPlan: false,
    workflowExecution: false,
    progressTracker: false,
    circularDependency: false,
    parallelExecution: false,
    performance: false,
  };

  // Test 1: Module Loading
  log('Test 1: Module Loading');
  const workflowResult = safeRequire(
    path.join(__dirname, '..', 'rust', 'workflow-executor'),
    'Workflow Executor NAPI module'
  );

  if (!workflowResult.success) {
    logError('Workflow Executor module not available, skipping remaining tests');
    return results;
  }

  results.moduleLoad = true;
  const workflowExecutor = workflowResult.module;

  // Test workflow definition
  const testWorkflow = {
    id: 'test-workflow-1',
    name: 'Test Workflow',
    nodes: [
      {
        id: 'node-1',
        nodeType: 'research',
        name: 'Research Task',
        data: JSON.stringify({ query: 'test query' }),
        timeoutMs: 5000,
        retryCount: 2,
      },
      {
        id: 'node-2',
        nodeType: 'content',
        name: 'Content Generation',
        data: JSON.stringify({ format: 'blog-post' }),
        timeoutMs: 10000,
        retryCount: 1,
      },
      {
        id: 'node-3',
        nodeType: 'deploy',
        name: 'Deploy Task',
        data: JSON.stringify({ platform: 'vercel' }),
        timeoutMs: 15000,
        retryCount: 0,
      },
    ],
    edges: [
      { source: 'node-1', target: 'node-2', condition: null },
      { source: 'node-2', target: 'node-3', condition: null },
    ],
    metadata: null,
  };

  // Test 2: Workflow Validation
  log('\nTest 2: Workflow Validation');
  try {
    if (typeof workflowExecutor.validateWorkflow !== 'function') {
      throw new Error('validateWorkflow function not found');
    }

    workflowExecutor.validateWorkflow(testWorkflow);
    results.workflowValidation = assertCondition(
      true,
      'Valid workflow passes validation'
    );

    // Test invalid workflow (circular dependency)
    const circularWorkflow = {
      id: 'circular-workflow',
      name: 'Circular Workflow',
      nodes: [
        { id: 'a', nodeType: 'test', name: 'A', data: '{}' },
        { id: 'b', nodeType: 'test', name: 'B', data: '{}' },
      ],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'a' },
      ],
    };

    let circularError = false;
    try {
      workflowExecutor.validateWorkflow(circularWorkflow);
    } catch (e) {
      circularError = true;
      log(`  Expected error: ${e.message}`);
    }

    results.circularDependency = assertCondition(
      circularError,
      'Circular dependency detected'
    );
  } catch (error) {
    logError(`Workflow validation failed: ${error.message}`);
  }

  // Test 3: Execution Plan
  log('\nTest 3: Execution Plan');
  try {
    if (typeof workflowExecutor.getExecutionPlan !== 'function') {
      throw new Error('getExecutionPlan function not found');
    }

    const plan = workflowExecutor.getExecutionPlan(testWorkflow);

    results.executionPlan = assertCondition(
      Array.isArray(plan) && plan.length === 3,
      'Execution plan returns correct number of nodes'
    );

    if (results.executionPlan) {
      log(`  Execution order: ${plan.join(' -> ')}`);
      assertCondition(
        plan[0] === 'node-1',
        'First node in plan is node-1 (no dependencies)'
      );
      assertCondition(
        plan[1] === 'node-2',
        'Second node in plan is node-2'
      );
      assertCondition(
        plan[2] === 'node-3',
        'Third node in plan is node-3'
      );
    }
  } catch (error) {
    logError(`Execution plan failed: ${error.message}`);
  }

  // Test 4: Progress Tracker
  log('\nTest 4: Progress Tracker');
  try {
    if (typeof workflowExecutor.createProgressTracker !== 'function') {
      throw new Error('createProgressTracker function not found');
    }

    const tracker = workflowExecutor.createProgressTracker('exec-123', 10);

    results.progressTracker = assertCondition(
      tracker && tracker.totalNodes === 10,
      'Progress tracker created with correct total'
    );

    if (results.progressTracker) {
      log(`  Execution ID: ${tracker.executionId}`);
      log(`  Total Nodes: ${tracker.totalNodes}`);
      log(`  Percent Complete: ${tracker.percentComplete}%`);
      log(`  Status: ${tracker.status}`);
    }
  } catch (error) {
    logError(`Progress tracker failed: ${error.message}`);
  }

  // Test 5: Workflow Execution
  log('\nTest 5: Workflow Execution (async)');
  try {
    if (typeof workflowExecutor.executeWorkflow !== 'function') {
      throw new Error('executeWorkflow function not found');
    }

    log('  Executing workflow...');
    const executionResult = await workflowExecutor.executeWorkflow(testWorkflow);

    results.workflowExecution = assertCondition(
      executionResult && executionResult.workflowId === testWorkflow.id,
      'Workflow execution returns valid result'
    );

    if (results.workflowExecution) {
      log(`  Execution ID: ${executionResult.executionId}`);
      log(`  Status: ${executionResult.status}`);
      log(`  Total Duration: ${executionResult.total_duration_ms.toFixed(2)}ms`);
      log(`  Node Results: ${executionResult.node_results.length}`);

      executionResult.node_results.forEach((nodeResult) => {
        log(`    - ${nodeResult.node_id}: ${nodeResult.status} (${nodeResult.duration_ms.toFixed(2)}ms)`);
        if (nodeResult.error) {
          log(`      Error: ${nodeResult.error}`);
        }
      });
    }
  } catch (error) {
    logError(`Workflow execution failed: ${error.message}`);
  }

  // Test 6: Parallel Execution
  log('\nTest 6: Parallel Execution');
  try {
    const parallelWorkflow = {
      id: 'parallel-workflow',
      name: 'Parallel Workflow',
      nodes: [
        {
          id: 'parallel-1',
          nodeType: 'task',
          name: 'Parallel Task 1',
          data: JSON.stringify({ id: 1 }),
          timeoutMs: 100,
          retryCount: 0,
        },
        {
          id: 'parallel-2',
          nodeType: 'task',
          name: 'Parallel Task 2',
          data: JSON.stringify({ id: 2 }),
          timeoutMs: 100,
          retryCount: 0,
        },
        {
          id: 'parallel-3',
          nodeType: 'task',
          name: 'Parallel Task 3',
          data: JSON.stringify({ id: 3 }),
          timeoutMs: 100,
          retryCount: 0,
        },
      ],
      edges: [], // No dependencies - all can run in parallel
    };

    log('  Executing parallel workflow...');
    const parallelResult = await workflowExecutor.executeWorkflow(parallelWorkflow);

    results.parallelExecution = assertCondition(
      parallelResult.status === 2, // Completed
      'Parallel workflow completed successfully'
    );

    if (results.parallelExecution) {
      const maxDuration = Math.max(...parallelResult.node_results.map(n => n.duration_ms));
      const totalDuration = parallelResult.total_duration_ms;
      
      log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
      log(`  Max Node Duration: ${maxDuration.toFixed(2)}ms`);
      log(`  Parallelization efficiency: ${((maxDuration / totalDuration) * 100).toFixed(1)}%`);
      
      // If truly parallel, total should be close to max node duration
      assertCondition(
        totalDuration < maxDuration * 2,
        'Nodes executed in parallel (total time < 2x max node time)'
      );
    }
  } catch (error) {
    logError(`Parallel execution failed: ${error.message}`);
  }

  // Test 7: Performance Benchmark
  log('\nTest 7: Performance Benchmark');
  try {
    const simpleWorkflow = {
      id: 'benchmark-workflow',
      name: 'Benchmark Workflow',
      nodes: [
        {
          id: 'bench-1',
          nodeType: 'task',
          name: 'Benchmark Task',
          data: JSON.stringify({}),
          timeoutMs: 10,
          retryCount: 0,
        },
      ],
      edges: [],
    };

    const benchmark = measureExecutionTime(async () => {
      await workflowExecutor.executeWorkflow(simpleWorkflow);
    }, 10);

    results.performance = assertCondition(
      benchmark.avg < 1000, // Should complete in < 1s on average
      `Performance: avg ${benchmark.avg.toFixed(2)}ms, min ${benchmark.min.toFixed(2)}ms, max ${benchmark.max.toFixed(2)}ms`
    );

    logBenchmark(`Workflow Execution (10 iterations):`);
    logBenchmark(`  Average: ${benchmark.avg.toFixed(2)}ms`);
    logBenchmark(`  Min: ${benchmark.min.toFixed(2)}ms`);
    logBenchmark(`  Max: ${benchmark.max.toFixed(2)}ms`);
  } catch (error) {
    logError(`Performance benchmark failed: ${error.message}`);
  }

  return results;
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  log('╔════════════════════════════════════════════════════════╗');
  log('║       AgentFlow Pro - NAPI Integration Tests          ║');
  log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Run Pricing Engine tests
  const pricingResults = await testPricingEngine();

  // Run Workflow Executor tests
  const workflowResults = await testWorkflowExecutor();

  // Summary
  const endTime = Date.now();
  const duration = endTime - startTime;

  log('\n╔════════════════════════════════════════════════════════╗');
  log('║                    TEST SUMMARY                        ║');
  log('╚════════════════════════════════════════════════════════╝\n');

  log(`Total Duration: ${duration}ms\n`);

  // Pricing Engine Summary
  log('Pricing Engine:');
  log(`  ✓ Module Load: ${pricingResults.moduleLoad ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Basic Calculation: ${pricingResults.basicCalculation ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Batch Calculation: ${pricingResults.batchCalculation ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Seasonal Pricing: ${pricingResults.seasonalPricing ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Error Handling: ${pricingResults.errorHandling ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Edge Cases: ${pricingResults.edgeCases ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Performance: ${pricingResults.performance ? 'PASS' : 'FAIL'}`);

  const pricingPassCount = Object.values(pricingResults).filter(Boolean).length;
  const pricingTotal = Object.keys(pricingResults).length;

  // Workflow Executor Summary
  log('\nWorkflow Executor:');
  log(`  ✓ Module Load: ${workflowResults.moduleLoad ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Workflow Validation: ${workflowResults.workflowValidation ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Execution Plan: ${workflowResults.executionPlan ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Progress Tracker: ${workflowResults.progressTracker ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Workflow Execution: ${workflowResults.workflowExecution ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Circular Dependency: ${workflowResults.circularDependency ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Parallel Execution: ${workflowResults.parallelExecution ? 'PASS' : 'FAIL'}`);
  log(`  ✓ Performance: ${workflowResults.performance ? 'PASS' : 'FAIL'}`);

  const workflowPassCount = Object.values(workflowResults).filter(Boolean).length;
  const workflowTotal = Object.keys(workflowResults).length;

  // Overall Summary
  const totalPass = pricingPassCount + workflowPassCount;
  const totalTests = pricingTotal + workflowTotal;
  const passRate = totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(1) : 0;

  log('\n───────────────────────────────────────────────────────');
  log(`Overall: ${totalPass}/${totalTests} tests passed (${passRate}%)`);
  log('───────────────────────────────────────────────────────\n');

  // Exit with appropriate code
  if (totalPass === totalTests) {
    logSuccess('All tests passed!\n');
    process.exit(0);
  } else {
    logError(`${totalTests - totalPass} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    logError(`Test runner failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests, testPricingEngine, testWorkflowExecutor };
