/**
 * Mock Prisma for testing without database
 * Use only for development/testing when DB is unavailable
 */

class MockPrismaClient {
  constructor() {
    this.$connected = true;
  }

  async $connect() {
    console.log('📦 Mock Prisma connected (no database)');
  }

  async $disconnect() {
    console.log('📦 Mock Prisma disconnected');
  }

  // Mock all models
  user = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 'mock-id', email: 'mock@test.com' }),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };

  property = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 'mock-prop', name: 'Mock Property' }),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };

  reservation = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 'mock-res' }),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    count: () => Promise.resolve(0),
  };

  notification = {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 'mock-notif', title: 'Mock' }),
    count: () => Promise.resolve(0),
  };

  // Add more models as needed...

  $transaction = async (fn) => {
    if (typeof fn === 'function') {
      return fn(this);
    }
    return Promise.all(fn);
  };

  $queryRaw = () => Promise.resolve([]);
  $executeRaw = () => Promise.resolve(0);
}

export const prisma = new MockPrismaClient();

export default prisma;
