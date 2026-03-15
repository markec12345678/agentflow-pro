import { prisma } from "../src/infrastructure/database/prisma";
import bcrypt from "bcryptjs";

async function createAdminUser() {
  const email = "admin@agentflow.com";
  const password = "admin123";
  const name = "Admin User";

  const SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { passwordHash },
      create: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        trialEndsAt,
      },
      select: { id: true, email: true, name: true },
    });

    console.log("✅ Admin user created/updated:", user);
    console.log("Login with:", { email, password: "admin123" });
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
