/**
 * MOCK MODE - All API endpoints return mock data
 * Enable with MOCK_DATABASE=true environment variable
 */

// This file is imported first and mocks all database calls
if (process.env.MOCK_DATABASE === 'true') {
  global.prisma = {
    user: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}), delete: () => Promise.resolve({}), count: () => Promise.resolve(0) },
    property: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}), delete: () => Promise.resolve({}), count: () => Promise.resolve(0) },
    reservation: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}), delete: () => Promise.resolve({}), count: () => Promise.resolve(0) },
    notification: { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}), count: () => Promise.resolve(0) },
    room: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null) },
    guest: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null) },
    $transaction: async (fn: any) => (typeof fn === 'function' ? fn({}) : Promise.all(fn)),
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };
}
