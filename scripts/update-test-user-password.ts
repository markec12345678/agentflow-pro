/**
 * Update test user password
 * Usage: npx tsx scripts/update-test-user-password.ts
 */

import { prisma } from "../src/infrastructure/database/prisma";
import bcrypt from "bcryptjs";

async function updateTestUserPassword() {
  const email = "test@agentflow.com";
  const password = "test123";

  const SALT_ROUNDS = 10;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      console.log("❌ User not found. Creating new user...");
      await createTestUser();
      return;
    }

    if (!user.passwordHash) {
      console.log("⚠️ User exists but has no passwordHash. Updating...");
    } else {
      console.log(
        "ℹ️ User exists with passwordHash. Updating password anyway...",
      );
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    console.log("✅ User updated:", updated);
    console.log("Login with:", { email, password: "test123" });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestUser() {
  const email = "test@agentflow.com";
  const password = "test123";
  const name = "Test User";

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
}

updateTestUserPassword();
