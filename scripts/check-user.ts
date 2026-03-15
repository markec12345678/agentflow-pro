// Check e2e user in database
import { PrismaClient } from "@prisma/client";

const DATABASE_URL = process.env.DATABASE_URL || "";

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "e2e@test.com" },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  if (!user) {
    console.log("❌ User e2e@test.com NOT found in database");
    return;
  }

  console.log("✅ User found:");
  console.log("   ID:", user.id);
  console.log("   Email:", user.email);
  console.log("   Name:", user.name);
  console.log("   passwordHash:", user.passwordHash);
  console.log("   passwordHash length:", user.passwordHash?.length);

  // Test bcrypt compare
  const bcrypt = require("bcryptjs");
  const testPassword = "e2e-secret";
  const hashFromSeed = await bcrypt.hash(testPassword, 10);

  console.log("\n🔐 Password test:");
  console.log("   Test password:", testPassword);
  console.log("   Hash from seed (bcrypt, rounds=10):", hashFromSeed);

  if (user.passwordHash) {
    const match = await bcrypt.compare(testPassword, user.passwordHash);
    console.log("   bcrypt.compare result:", match);
    console.log(
      "   Hashes match:",
      user.passwordHash === hashFromSeed ? "NO (different salts)" : "NO",
    );

    // Try comparing with different salt rounds
    for (const rounds of [10, 12, 14]) {
      const h = await bcrypt.hash(testPassword, rounds);
      const m = await bcrypt.compare(testPassword, h);
      console.log(`   bcrypt hash (rounds=${rounds}) compare:`, m);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
