/**
 * Prisma seed - E2E user for testing
 * Must match auth-users.ts: e2e@test.com / e2e-secret / e2e-user-1
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "e2e-user-1" },
    update: {},
    create: {
      id: "e2e-user-1",
      email: "e2e@test.com",
      name: "E2E Test User",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
