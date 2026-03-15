/**
 * Mock Prisma Client
 * Use this when database is not available
 */

class MockPrismaClient {
  constructor() {}
  
  async $connect() {
    logger.info('📦 Mock Prisma connected (no database)');
  }
  
  async $disconnect() {
    logger.info('📦 Mock Prisma disconnected');
  }
  
  // Mock all models with empty responses
  user = createMockModel('user');
  property = createMockModel('property');
  reservation = createMockModel('reservation');
  notification = createMockModel('notification');
  room = createMockModel('room');
  guest = createMockModel('guest');
  // Add more as needed...
  
  $transaction = async (fn: any) => {
    if (typeof fn === 'function') return fn(this);
    return Promise.all(fn);
  };
  
  $queryRaw = () => Promise.resolve([]);
  $executeRaw = () => Promise.resolve(0);
  $on = () => {};
}

function createMockModel(name: string) {
  return {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: `mock-${name}-1` }),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
    upsert: () => Promise.resolve({ id: `mock-${name}-1` }),
  };
}

export const prisma = process.env.MOCK_DATABASE === 'true' 
  ? new MockPrismaClient() as any
  : undefined;

export default prisma;
