/**
 * Seed Database - Create Test User
 * Run this ONCE to create admin user
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@admin.com" },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists!");
    console.log("   Email: admin@admin.com");
    console.log("   Password: admin123");
    return;
  }

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@admin.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      emailVerified: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log("✅ Created admin user:");
  console.log("   ID:", admin.id);
  console.log("   Email:", admin.email);
  console.log("   Name:", admin.name);
  console.log("   Role:", admin.role);
  console.log("");
  console.log("🔐 Login credentials:");
  console.log("   Email: admin@admin.com");
  console.log("   Password: admin123");
  console.log("");
  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
