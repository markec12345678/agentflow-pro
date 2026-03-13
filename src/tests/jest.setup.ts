/**
 * Jest Setup
 * 
 * Global test setup and utilities
 */

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Wait for async operation
 */
global.waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock console to reduce noise in tests
 */
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

// ============================================================================
// Custom Matchers
// ============================================================================

expect.extend({
  toBeDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime())
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid date`
    }
  },
  
  toBeInRange(received: number, start: number, end: number) {
    const pass = received >= start && received <= end
    return {
      pass,
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in range ${start}-${end}`
    }
  }
})

// ============================================================================
// Type Declarations
// ============================================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeDate(): R
      toBeInRange(start: number, end: number): R
    }
  }
}

// ============================================================================
// Cleanup
// ============================================================================

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.resetAllMocks()
})

// Global timeout
jest.setTimeout(10000)

// ============================================================================
// Export
// ============================================================================

export {}
