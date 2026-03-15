/**
 * Vitest setup file for AgentFlow Pro
 */
import '@testing-library/jest-dom'

// Mock NextAuth - only mock what we need
vi.mock('next-auth', async (importActual) => {
  const actual = await importActual()
  return {
    ...(actual as any),
    default: vi.fn(),
    getServerSession: vi.fn(() => Promise.resolve(null)),
  }
})

// Mock NextAuth JWT
vi.mock('next-auth/jwt', async (importActual) => {
  const actual = await importActual()
  return {
    ...(actual as any),
    getToken: vi.fn(() => Promise.resolve(null)),
  }
})

// Mock Prisma client with proper structure
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  teamMember: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((fn) => fn(mockPrisma)),
}

vi.mock('@/database/schema', () => ({
  prisma: mockPrisma,
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-only-12345678901234567890'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.OPENAI_API_KEY = 'sk-test-key-for-testing'
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

// Suppress console errors during tests
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  // Ignore NextAuth warnings
  if (args[0]?.includes?.('next-auth')) return
  // Ignore React hydration warnings
  if (args[0]?.includes?.('hydration')) return
  originalConsoleError(...args)
}
