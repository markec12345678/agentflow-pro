import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element -- mock for tests
    return <img {...props} alt={props.alt ?? ''} />;
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3002'
process.env.MOCK_MODE = 'true'

// Mock Prisma (Prisma 7: mock database/schema which exports prisma)
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  workflow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workflowCheckpoint: {
    create: jest.fn().mockResolvedValue({ id: 'cp1' }),
  },
  $disconnect: jest.fn(),
}
jest.mock('@/database/schema', () => ({
  prisma: mockPrisma,
  PLAN_LIMITS: { starter: {}, pro: {}, enterprise: {} },
}))

// Mock agent modules
jest.mock('../agents/research/ResearchAgent', () => ({
  createResearchAgent: jest.fn(() => ({
    id: 'research-agent',
    type: 'research',
    name: 'Research Agent',
    execute: jest.fn().mockResolvedValue({
      urls: ['https://example.com'],
      scrapedData: [{ url: 'https://example.com', markdown: 'Mock Test data' }],
      searchResults: [{ url: 'https://example.com', title: 'Mock', description: 'Test data' }],
    }),
  })),
}))

jest.mock('../agents/content/ContentAgent', () => ({
  createContentAgent: jest.fn(() => ({
    id: 'content-agent',
    type: 'content',
    name: 'Content Agent',
    execute: jest.fn().mockResolvedValue({
      content: 'Mock content generated',
      metadata: { wordCount: 100, readingLevel: 'easy' },
    }),
  })),
}))

jest.mock('../agents/reservation/reservationAgent', () => ({
  createReservationAgent: jest.fn(() => ({
    id: 'reservation-agent',
    type: 'reservation',
    name: 'Reservation Agent',
    execute: jest.fn().mockResolvedValue({
      reservations: [],
      availability: true,
    }),
  })),
}))

jest.mock('../agents/communication/communicationAgent', () => ({
  createCommunicationAgent: jest.fn(() => ({
    id: 'communication-agent',
    type: 'communication',
    name: 'Communication Agent',
    execute: jest.fn().mockResolvedValue({
      emails: [],
      status: 'sent',
    }),
  })),
}))

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore specific console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}
