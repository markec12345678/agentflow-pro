// Optional: configure a testing framework like jest-dom
// import '@testing-library/jest-dom'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'file:./test.db'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'authenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Setup global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
}

// Mock fetch if needed
global.fetch = jest.fn()
