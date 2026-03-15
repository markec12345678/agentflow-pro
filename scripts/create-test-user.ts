/**
 * Create test user in database
 * Usage: npx tsx scripts/create-test-user.ts
 */

import { prisma } from "../src/infrastructure/database/prisma";
import bcrypt from "bcryptjs";

async function createTestUser() {
  const email = "test@agentflow.com";
  const password = "test123";
  const name = "Test User";

  const SALT_ROUNDS = 10;

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (existing) {
      console.log("✅ User already exists:", existing);
      return;
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        trialEndsAt,
      },
      select: { id: true, email: true, name: true },
    });

    console.log("✅ Test user created:", user);
    console.log("Login with:", { email, password: "test123" });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
