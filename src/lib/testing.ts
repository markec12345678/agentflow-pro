/**
 * AgentFlow Pro - Testing Suite Configuration
 * Jest unit tests and Playwright E2E tests setup
 */

// Jest configuration for unit tests
export const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000
};

// Playwright configuration for E2E tests
export const playwrightConfig = {
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
};

// Mock data for testing
export const mockUsers = {
  testUser: {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    plan: 'starter' as const,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  adminUser: {
    id: 'admin-user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const,
    plan: 'pro' as const,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

export const mockAgents = {
  researchAgent: {
    id: 'research-agent',
    type: 'research' as const,
    name: 'Research Agent',
    status: 'active' as const
  },
  contentAgent: {
    id: 'content-agent',
    type: 'content' as const,
    name: 'Content Agent',
    status: 'active' as const
  },
  reservationAgent: {
    id: 'reservation-agent',
    type: 'reservation' as const,
    name: 'Reservation Agent',
    status: 'active' as const
  },
  communicationAgent: {
    id: 'communication-agent',
    type: 'communication' as const,
    name: 'Communication Agent',
    status: 'active' as const
  }
};

export const mockWorkflows = {
  propertyDescription: {
    useCase: 'property_description',
    propertyData: {
      name: 'Grand Hotel Ljubljana',
      location: 'Ljubljana, Slovenia',
      type: 'Luxury Hotel',
      amenities: ['WiFi', 'Spa', 'Restaurant'],
      rating: 4.5
    }
  },
  tourPackage: {
    useCase: 'tour_package',
    tourData: {
      destination: 'Slovenia',
      duration: 7,
      activities: ['Hiking', 'Wine tasting'],
      accommodation: '4-star hotels'
    }
  }
};

export const mockBilling = {
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      price: 3900,
      currency: 'usd',
      interval: 'month',
      features: ['3 agents', '100 runs/month'],
      limits: { agents: 3, runsPerMonth: 100, storage: 1000, teamMembers: 1 }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 7900,
      currency: 'usd',
      interval: 'month',
      features: ['10 agents', '1000 runs/month'],
      limits: { agents: 10, runsPerMonth: 1000, storage: 10000, teamMembers: 5 }
    }
  ],
  subscription: {
    id: 'sub_123',
    customerId: 'cus_123',
    status: 'active' as const,
    planId: 'pro' as const,
    currentPeriodEnd: new Date(),
    createdAt: new Date()
  }
};

// Test utilities
export class TestUtils {
  static createMockRequest(data: any, method = 'POST') {
    return {
      json: async () => data,
      method,
      headers: new Map([
        ['content-type', 'application/json'],
        ['authorization', 'Bearer mock-token']
      ])
    } as any;
  }

  static createMockResponse() {
    const data: any = {
      status: 200,
      headers: new Map(),
      json: async (data: any) => data,
      text: async (data: any) => JSON.stringify(data)
    };
    
    return data;
  }

  static async waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static generateRandomEmail(): string {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  }

  static generateRandomString(length = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static createMockFile(content: string, filename: string): File {
    const blob = new Blob([content], { type: 'text/plain' });
    return new File([blob], filename);
  }
}

// Test fixtures
export class TestFixtures {
  static async setupDatabase(): Promise<void> {
    // Setup test database
    console.log('Setting up test database...');
  }

  static async cleanupDatabase(): Promise<void> {
    // Cleanup test database
    console.log('Cleaning up test database...');
  }

  static async seedTestData(): Promise<void> {
    // Seed test data
    console.log('Seeding test data...');
  }

  static async createTestUser(userData: Partial<any> = {}): Promise<any> {
    const user = {
      ...mockUsers.testUser,
      ...userData,
      id: TestUtils.generateRandomString()
    };
    
    return user;
  }

  static async createTestAgent(agentData: Partial<any> = {}): Promise<any> {
    const agent = {
      ...mockAgents.researchAgent,
      ...agentData,
      id: TestUtils.generateRandomString()
    };
    
    return agent;
  }

  static async createTestWorkflow(workflowData: Partial<any> = {}): Promise<any> {
    const workflow = {
      ...mockWorkflows.propertyDescription,
      ...workflowData
    };
    
    return workflow;
  }
}

// Performance testing utilities
export class PerformanceTests {
  static async measureExecutionTime(fn: () => Promise<any>): Promise<{ result: any; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    
    return { result, time };
  }

  static async measureMemoryUsage(fn: () => Promise<any>): Promise<{ result: any; memory: number }> {
    const before = process.memoryUsage().heapUsed;
    const result = await fn();
    const after = process.memoryUsage().heapUsed;
    const memory = after - before;
    
    return { result, memory };
  }

  static async runLoadTest(
    fn: () => Promise<any>,
    concurrency: number,
    iterations: number
  ): Promise<{ totalTime: number; averageTime: number; successRate: number }> {
    const startTime = Date.now();
    const promises: Promise<any>[] = [];
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      promises.push(
        fn()
          .then(() => {
            successCount++;
          })
          .catch(() => {
            // Handle errors
          })
      );
      
      if (promises.length >= concurrency) {
        await Promise.allSettled(promises.splice(0, concurrency));
      }
    }
    
    await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;
    
    return {
      totalTime,
      averageTime: totalTime / iterations,
      successRate: (successCount / iterations) * 100
    };
  }
}

// Integration test utilities
export class IntegrationTests {
  static async setupTestEnvironment(): Promise<void> {
    // Setup test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  }

  static async teardownTestEnvironment(): Promise<void> {
    // Cleanup test environment
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
  }

  static async createTestServer(): Promise<any> {
    // Create test server for API testing
    return {
      listen: async (port: number) => {
        console.log(`Test server listening on port ${port}`);
      },
      close: async () => {
        console.log('Test server closed');
      }
    };
  }

  static async createMockStripe(): Promise<any> {
    // Create mock Stripe instance
    return {
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_test_123',
          email: 'test@example.com'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cus_test_123',
          email: 'test@example.com'
        })
      },
      subscriptions: {
        create: jest.fn().mockResolvedValue({
          id: 'sub_test_123',
          status: 'active'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_test_123',
          status: 'active'
        })
      }
    };
  }
}

// Export all testing utilities
export {
  jestConfig,
  playwrightConfig,
  mockUsers,
  mockAgents,
  mockWorkflows,
  mockBilling,
  TestUtils,
  TestFixtures,
  PerformanceTests,
  IntegrationTests
};
