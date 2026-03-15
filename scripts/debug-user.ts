/**
 * Debug: Check Admin User
 */

import { prisma } from "@/infrastructure/database/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🔍 Checking admin user...\n");

  // Find admin user
  const user = await prisma.user.findUnique({
    where: { email: "admin@admin.com" },
  });

  if (!user) {
    console.log("❌ User NOT FOUND in database!");
    return;
  }

  console.log("✅ User found:");
  console.log("   ID:", user.id);
  console.log("   Email:", user.email);
  console.log("   Name:", user.name);
  console.log("   Role:", user.role);
  console.log("   Has Password:", !!user.passwordHash);
  console.log("   Email Verified:", !!user.emailVerified);
  console.log("");

  // Test password
  const testPassword = "admin123";
  const validPassword = user.passwordHash
    ? await bcrypt.compare(testPassword, user.passwordHash)
    : false;

  console.log("🔐 Password test:");
  console.log("   Input:", testPassword);
  console.log("   Valid:", validPassword ? "✅ YES" : "❌ NO");
  console.log("");

  if (validPassword) {
    console.log("🎉 Login should work with:");
    console.log("   Email: admin@admin.com");
    console.log("   Password: admin123");
  } else {
    console.log("⚠️ Password does not match!");
    console.log("   Hash:", user.passwordHash?.substring(0, 20) + "...");
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
